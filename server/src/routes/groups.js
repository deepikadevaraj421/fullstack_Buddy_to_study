import express from 'express';
import Group from '../models/Group.js';
import Session from '../models/Session.js';
import Task from '../models/Task.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Create group
router.post('/', auth, async (req, res) => {
  try {
    const { subject, members, scheduleRule } = req.body;
    
    const group = new Group({
      subject,
      members: [req.userId, ...members],
      createdBy: req.userId,
      scheduleRule
    });
    
    await group.save();
    await group.populate('members', 'name email cluster profilePicture');
    
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's groups
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.userId
    }).populate('members', 'name email cluster profilePicture');
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get group by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email cluster profilePicture')
      .populate('voiceParticipants', 'name profilePicture');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    if (!group.members.some(m => m._id.equals(req.userId))) {
      return res.status(403).json({ error: 'Not a member' });
    }
    
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create session
router.post('/:id/sessions', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group || group.isDissolved) {
      return res.status(400).json({ error: 'Group not available' });
    }
    
    const { startTime, durationMinutes } = req.body;
    
    const session = new Session({
      groupId: group._id,
      startTime,
      durationMinutes: durationMinutes || 60,
      attendance: group.members.map(m => ({ userId: m, status: 'absent' }))
    });
    
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get group sessions
router.get('/:id/sessions', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ groupId: req.params.id })
      .sort({ startTime: -1 })
      .populate('attendance.userId', 'name');
    
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Voice room join/leave (demo only)
router.post('/:id/voice/join', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.includes(req.userId)) {
      return res.status(403).json({ error: 'Not a member' });
    }
    if (!group.voiceParticipants.some(p => p.equals(req.userId))) {
      group.voiceParticipants.push(req.userId);
      await group.save();
    }
    await group.populate('voiceParticipants', 'name');
    res.json({ voiceParticipants: group.voiceParticipants });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/voice/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    group.voiceParticipants = group.voiceParticipants.filter(p => !p.equals(req.userId));
    await group.save();
    await group.populate('voiceParticipants', 'name');
    res.json({ voiceParticipants: group.voiceParticipants });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add task
router.post('/:id/tasks', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group || group.isDissolved) {
      return res.status(400).json({ error: 'Group not available' });
    }
    
    const { title, dueDate } = req.body;
    
    const task = new Task({
      groupId: group._id,
      title,
      dueDate,
      createdBy: req.userId,
      completion: group.members.map(m => ({ userId: m, done: false }))
    });
    
    await task.save();
    await task.populate('completion.userId', 'name');
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get group tasks
router.get('/:id/tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ groupId: req.params.id })
      .sort({ createdAt: -1 })
      .populate('completion.userId', 'name')
      .populate('createdBy', 'name');
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle task completion
router.put('/:id/tasks/:taskId/complete', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const completion = task.completion.find(c => c.userId.equals(req.userId));
    
    if (completion) {
      const wasDone = completion.done;
      completion.done = !completion.done;
      completion.doneAt = completion.done ? new Date() : null;
      await task.save();
      
      // Send notifications if task was just completed
      if (!wasDone && completion.done) {
        try {
          console.log('🎯 Sending task completion notifications...');
          const group = await Group.findById(req.params.id).populate('members', 'name');
          
          if (group) {
            console.log(`📢 Group found: ${group.subject} with ${group.members.length} members`);
            const currentUser = group.members.find(m => m._id.equals(req.userId));
            const otherMembers = group.members.filter(m => !m._id.equals(req.userId));
            
            console.log(`👤 Current user: ${currentUser?.name}, Other members: ${otherMembers.length}`);
            
            if (otherMembers.length > 0 && currentUser) {
              const notifications = otherMembers.map(member => ({
                userId: member._id,
                type: 'task_completed',
                message: `${currentUser.name} completed the task "${task.title}" in ${group.subject}`
              }));
              
              const createdNotifications = await Notification.insertMany(notifications);
              console.log(`✅ Created ${createdNotifications.length} notifications`);
            } else {
              console.log('⚠️ No notifications created: insufficient members or user not found');
            }
          } else {
            console.log('❌ Group not found for notifications');
          }
        } catch (notificationError) {
          console.error('❌ Error sending task completion notifications:', notificationError);
          // Don't fail the task completion if notification fails
        }
      }
    }
    
    await task.populate('completion.userId', 'name');
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Evaluate weekly health
router.post('/:id/evaluate-week', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    // Calculate attendance rate
    const sessions = await Session.find({
      groupId: group._id,
      startTime: { $gte: weekStart }
    });
    
    let totalSlots = 0;
    let presentCount = 0;
    
    sessions.forEach(s => {
      s.attendance.forEach(a => {
        totalSlots++;
        if (a.status === 'present') presentCount++;
      });
    });
    
    const attendanceRate = totalSlots > 0 ? (presentCount / totalSlots) * 100 : 0;
    
    // Calculate task completion rate
    const tasks = await Task.find({
      groupId: group._id,
      createdAt: { $gte: weekStart }
    });
    
    let totalTaskSlots = 0;
    let completedCount = 0;
    
    tasks.forEach(t => {
      t.completion.forEach(c => {
        totalTaskSlots++;
        if (c.done) completedCount++;
      });
    });
    
    const taskCompletionRate = totalTaskSlots > 0 ? (completedCount / totalTaskSlots) * 100 : 0;
    
    // Compute health score
    const score = (attendanceRate * 0.6 + taskCompletionRate * 0.4);
    
    let status;
    if (score >= 70) status = 'Healthy';
    else if (score >= 50) status = 'Warning';
    else status = 'At Risk';
    
    // Update streak
    if (status === 'At Risk') {
      group.atRiskStreak++;
    } else {
      group.atRiskStreak = 0;
    }
    
    // Auto-dissolve if at risk for 3 weeks
    if (group.atRiskStreak >= 3) {
      group.isDissolved = true;
    }
    
    group.weeklyHealthHistory.push({
      weekStart,
      attendanceRate,
      taskCompletionRate,
      score,
      status
    });
    
    await group.save();
    
    res.json({
      status,
      score: Math.round(score),
      attendanceRate: Math.round(attendanceRate),
      taskCompletionRate: Math.round(taskCompletionRate),
      atRiskStreak: group.atRiskStreak,
      isDissolved: group.isDissolved
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join voice room
router.post('/:id/voice/join', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    if (!group.members.some(m => m.equals(req.userId))) {
      return res.status(403).json({ error: 'Not a member' });
    }
    
    if (!group.voiceParticipants.some(p => p.equals(req.userId))) {
      group.voiceParticipants.push(req.userId);
      await group.save();
    }
    
    await group.populate('voiceParticipants', 'name');
    res.json(group.voiceParticipants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leave voice room
router.post('/:id/voice/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    group.voiceParticipants = group.voiceParticipants.filter(p => !p.equals(req.userId));
    await group.save();
    
    await group.populate('voiceParticipants', 'name');
    res.json(group.voiceParticipants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete group
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    if (!group.createdBy.equals(req.userId)) {
      return res.status(403).json({ error: 'Only creator can delete group' });
    }
    
    // Delete related data
    await Message.deleteMany({ groupId: group._id });
    await Session.deleteMany({ groupId: group._id });
    await Task.deleteMany({ groupId: group._id });
    
    await Group.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug route: show sockets in a group room
router.get('/:id/socket-members', auth, (req, res) => {
  try {
    const io = req.app.get('io');
    if (!io) {
      return res.status(500).json({ error: 'Socket.io not initialized' });
    }
    const room = io.sockets.adapter.rooms.get(req.params.id);
    const sockets = room ? Array.from(room) : [];
    res.json({ count: sockets.length, sockets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

import Invite from '../models/Invite.js';
import User from '../models/User.js';
import { findMatches } from '../utils/matching.js';

// Invite member to group
router.post('/:id/invite', auth, async (req, res) => {
  try {
    const { toUserId } = req.body;
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    if (!group.members.some(m => m.equals(req.userId))) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }
    
    if (group.members.length >= 5) {
      return res.status(400).json({ error: 'Group is already full' });
    }
    
    if (group.members.some(m => m.equals(toUserId))) {
      return res.status(400).json({ error: 'User is already a member' });
    }
    
    // Check for duplicate pending invite
    const existing = await Invite.findOne({
      fromUserId: req.userId,
      toUserId,
      groupId: group._id,
      status: 'pending'
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Invite already sent' });
    }
    
    const invite = await Invite.create({
      fromUserId: req.userId,
      toUserId,
      subject: group.subject,
      groupId: group._id,
      message: `You've been invited to join the ${group.subject} study group`
    });
    
    const sender = await User.findById(req.userId);
    
    await Notification.create({
      userId: toUserId,
      type: 'group_invite',
      message: `${sender.name} invited you to join the ${group.subject} study group`,
      inviteId: invite._id
    });
    
    res.json({ message: 'Invite sent', invite });
  } catch (error) {
    console.error('Send group invite error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recommended students for group
router.get('/:id/recommended', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'name email cluster availability behavior subjects');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    if (!group.members.some(m => m.equals(req.userId))) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }
    
    if (group.members.length >= 5) {
      return res.json({ recommended: [] });
    }
    
    // Get existing member IDs
    const existingMemberIds = group.members.map(m => m._id.toString());
    
    // Get pending invite user IDs
    const pendingInvites = await Invite.find({
      groupId: group._id,
      status: 'pending'
    }).select('toUserId');
    const invitedUserIds = pendingInvites.map(i => i.toUserId.toString());
    
    // Get all users excluding existing members, pending invites, and self, matching subjects
    const recommendedUsers = await User.find({
      _id: { $nin: [...existingMemberIds, ...invitedUserIds, req.userId] }, // Exclude self too
      onboardingComplete: true,
      "subjects.name": group.subject // Match users with the group's subject in their subjects array
    }).select('name email cluster profilePicture').limit(3);
    
    res.json({ recommended: recommendedUsers });
  } catch (error) {
    console.error('Get recommended error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users for group (for All Users tab)
router.get('/:id/all-users', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    if (!group.members.some(m => m.equals(req.userId))) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }
    
    if (group.members.length >= 5) {
      return res.json({ users: [] });
    }
    
    // Get existing member IDs
    const existingMemberIds = group.members.map(m => m._id.toString());
    
    // Get pending invite user IDs
    const pendingInvites = await Invite.find({
      groupId: group._id,
      status: 'pending'
    }).select('toUserId');
    const invitedUserIds = pendingInvites.map(i => i.toUserId.toString());
    
    // Get all users excluding existing members, pending invites, and self
    const allUsers = await User.find({
      _id: { $nin: [...existingMemberIds, ...invitedUserIds, req.userId] },
      onboardingComplete: true
    }).select('name email cluster subjects profilePicture').limit(20);
    
    res.json({ users: allUsers });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
