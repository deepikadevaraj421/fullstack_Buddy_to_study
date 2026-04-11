import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { assignCluster } from '../utils/matching.js';

const router = express.Router();

// Get all users (excluding current user)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } }).select('-passwordHash -behavior -availability -preferences');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user analytics — must be before /:id
router.get('/analytics', auth, async (req, res) => {
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const Group = (await import('../models/Group.js')).default;
    const Session = (await import('../models/Session.js')).default;
    const Task = (await import('../models/Task.js')).default;

    const groups = await Group.find({ members: req.userId, isDissolved: false });
    const groupIds = groups.map(g => g._id);

    const sessions = await Session.find({
      groupId: { $in: groupIds },
      startTime: { $gte: weekStart }
    });

    const sessionsThisWeek = sessions.length;

    let totalSlots = 0;
    let presentCount = 0;
    sessions.forEach(s => {
      const userAttendance = s.attendance.find(a => a.userId.equals(req.userId));
      if (userAttendance) {
        totalSlots++;
        if (userAttendance.status === 'present') presentCount++;
      }
    });

    const attendanceRate = totalSlots > 0 ? Math.round((presentCount / totalSlots) * 100) : 0;

    const tasks = await Task.find({ groupId: { $in: groupIds } });
    let completedTasks = 0;
    tasks.forEach(t => {
      const userCompletion = t.completion.find(c => c.userId.equals(req.userId));
      if (userCompletion && userCompletion.done) completedTasks++;
    });

    const activityScore = Math.min(10, Math.round(
      (sessionsThisWeek * 0.5) + (attendanceRate / 10) + (completedTasks * 0.3)
    ));

    res.json({ sessionsThisWeek, attendanceRate, activityScore });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get my profile (/auth/me equivalent)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete onboarding
router.put('/onboarding', auth, async (req, res) => {
  try {
    const { subjects, availability, preferences, behavior } = req.body;
    const cluster = assignCluster(behavior, availability);

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.subjects = subjects;
    user.availability = availability;
    user.preferences = preferences;
    user.behavior = behavior;
    user.cluster = cluster;
    user.onboardingComplete = true;

    await user.save();

    res.json({
      message: 'Onboarding completed',
      user: { id: user._id, name: user.name, onboardingComplete: true, cluster }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    Object.keys(updates).forEach(key => {
      if (key !== 'passwordHash' && key !== '_id') user[key] = updates[key];
    });
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID — must be last
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
