import express from 'express';
import User from '../models/User.js';
import Group from '../models/Group.js';
import Session from '../models/Session.js';
import Task from '../models/Task.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const skillToNum = (s) => ({ beginner: 1, intermediate: 2, advanced: 3 }[s?.toLowerCase()] ?? 2);

// Personal analytics stats for current user
router.get('/platform', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Groups the user is in
    const myGroups = await Group.find({ members: userId, isDissolved: false });
    const myGroupIds = myGroups.map(g => g._id);

    // Sessions the user attended
    const mySessions = await Session.find({ groupId: { $in: myGroupIds } });
    const myAttended = mySessions.filter(s =>
      s.attendance?.some(a => a.userId?.toString() === userId.toString() && a.status === 'present')
    ).length;

    // Study partners (unique members across all groups excluding self)
    const partnerSet = new Set();
    myGroups.forEach(g => g.members.forEach(m => {
      if (m.toString() !== userId.toString()) partnerSet.add(m.toString());
    }));

    // My cluster (single value)
    const clusterDist = {};
    if (req.user.cluster?.label) {
      clusterDist[req.user.cluster.label] = 1;
    }

    // My subjects only
    const subjectCount = {};
    req.user.subjects?.forEach(s => {
      subjectCount[s.name] = skillToNum(s.skill);
    });
    const topSubjects = Object.entries(subjectCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      totalUsers: myGroups.length,           // my active groups
      totalGroups: partnerSet.size,           // my study partners
      totalSessions: myAttended,             // sessions I attended
      clusterDist,
      topSubjects
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leaderboard — top users by attendance + task completion
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const users = await User.find({}).select('name profilePicture cluster streak longestStreak');
    const groups = await Group.find({ isDissolved: false });
    const groupIds = groups.map(g => g._id);
    const sessions = await Session.find({ groupId: { $in: groupIds } });
    const tasks = await Task.find({ groupId: { $in: groupIds } });

    const scores = users.map(u => {
      const uid = u._id.toString();

      let attended = 0, totalSlots = 0;
      sessions.forEach(s => {
        const a = s.attendance?.find(a => a.userId?.toString() === uid);
        if (a) { totalSlots++; if (a.status === 'present') attended++; }
      });
      const attendanceRate = totalSlots > 0 ? attended / totalSlots : 0;

      let completed = 0, totalTasks = 0;
      tasks.forEach(t => {
        const c = t.completion?.find(c => c.userId?.toString() === uid);
        if (c) { totalTasks++; if (c.done) completed++; }
      });
      const taskRate = totalTasks > 0 ? completed / totalTasks : 0;

      const score = Math.round(
        (attendanceRate * 0.5 + taskRate * 0.3 + Math.min((u.streak || 0) / 10, 1) * 0.2) * 100
      );

      return {
        _id: u._id.toString(),
        name: u.name,
        profilePicture: u.profilePicture || '',
        clusterLabel: u.cluster?.label || 'Unassigned',
        streak: u.streak || 0,
        longestStreak: u.longestStreak || 0,
        attendanceRate: Math.round(attendanceRate * 100),
        taskRate: Math.round(taskRate * 100),
        score
      };
    });

    scores.sort((a, b) => b.score - a.score);
    res.json(scores.slice(0, 10));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Group analytics — attendance trend over last 4 weeks
router.get('/group/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'name profilePicture');
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.some(m => m._id.equals(req.user._id))) return res.status(403).json({ error: 'Not a member' });

    // Weekly attendance for last 4 weeks
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);

      const sessions = await Session.find({ groupId: group._id, startTime: { $gte: weekStart, $lt: weekEnd } });
      let present = 0, total = 0;
      sessions.forEach(s => s.attendance?.forEach(a => { total++; if (a.status === 'present') present++; }));

      weeks.push({
        label: `Week ${4 - i}`,
        attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
        sessions: sessions.length
      });
    }

    // Per-member stats
    const allSessions = await Session.find({ groupId: group._id });
    const allTasks = await Task.find({ groupId: group._id });

    const memberStats = group.members.map(member => {
      const uid = member._id.toString();
      let attended = 0, totalSlots = 0;
      allSessions.forEach(s => {
        const a = s.attendance?.find(a => a.userId?.toString() === uid);
        if (a) { totalSlots++; if (a.status === 'present') attended++; }
      });
      let done = 0, total = 0;
      allTasks.forEach(t => {
        const c = t.completion?.find(c => c.userId?.toString() === uid);
        if (c) { total++; if (c.done) done++; }
      });
      return {
        name: member.name,
        profilePicture: member.profilePicture || '',
        attendanceRate: totalSlots > 0 ? Math.round((attended / totalSlots) * 100) : 0,
        taskRate: total > 0 ? Math.round((done / total) * 100) : 0
      };
    });

    res.json({ weeklyTrend: weeks, memberStats, healthHistory: group.weeklyHealthHistory?.slice(-4) || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user streak when they join a session
router.post('/streak/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    if (lastActive) lastActive.setHours(0, 0, 0, 0);

    const dayDiff = lastActive ? Math.floor((today - lastActive) / (1000 * 60 * 60 * 24)) : null;

    if (dayDiff === null || dayDiff > 1) {
      user.streak = 1;
    } else if (dayDiff === 1) {
      user.streak = (user.streak || 0) + 1;
    }
    // dayDiff === 0 means already active today, no change

    user.longestStreak = Math.max(user.longestStreak || 0, user.streak);
    user.lastActiveDate = new Date();
    await user.save();

    res.json({ streak: user.streak, longestStreak: user.longestStreak });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
