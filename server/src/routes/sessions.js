import express from 'express';
import Session from '../models/Session.js';
import Group from '../models/Group.js';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Join session (auto-mark attendance)
router.post('/:sessionId/join', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get the group to find all members
    const group = await Group.findById(session.groupId).populate('members', 'name');
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    let attendance = session.attendance.find(a => a.userId.equals(req.userId));
    let isFirstJoin = false;
    
    if (attendance) {
      // User has already joined before, just update status
      attendance.status = 'present';
      attendance.joinedAt = new Date();
    } else {
      // First time joining
      session.attendance.push({
        userId: req.userId,
        status: 'present',
        joinedAt: new Date()
      });
      isFirstJoin = true;
    }
    
    await session.save();
    await session.populate('attendance.userId', 'name');
    
    // Create notifications for all other group members only on first join
    if (isFirstJoin) {
      try {
        const currentUser = group.members.find(m => m._id.equals(req.userId));
        const otherMembers = group.members.filter(m => !m._id.equals(req.userId));
        
        console.log(`Group has ${group.members.length} members`);
        console.log(`Current user: ${currentUser?.name} (${req.userId})`);
        console.log(`Creating notifications for ${otherMembers.length} other members`);
        
        if (otherMembers.length > 0 && currentUser) {
          const notifications = otherMembers.map(member => ({
            userId: member._id,
            type: 'session_join',
            message: `${currentUser.name} joined the study session for ${group.subject}`
          }));
          
          const createdNotifications = await Notification.insertMany(notifications);
          console.log(`Successfully created ${createdNotifications.length} notifications`);
        } else {
          console.log('No notifications created: either no other members or current user not found');
        }
      } catch (notificationError) {
        console.error('Error creating notifications:', notificationError);
        // Don't fail the join operation if notification creation fails
      }
    }
    
    res.json({ message: 'Attendance marked', session });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming sessions for user
router.get('/upcoming', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId, isDissolved: false });
    const groupIds = groups.map(g => g._id);
    
    const sessions = await Session.find({
      groupId: { $in: groupIds },
      startTime: { $gte: new Date() }
    })
    .sort({ startTime: 1 })
    .populate('groupId', 'subject');
    
    const sessionsWithGroupName = sessions.map(s => ({
      _id: s._id,
      groupName: s.groupId.subject,
      startTime: s.startTime,
      durationMinutes: s.durationMinutes,
      attendance: s.attendance
    }));
    
    res.json(sessionsWithGroupName);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
