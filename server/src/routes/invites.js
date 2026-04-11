import express from 'express';
import Invite from '../models/Invite.js';
import Notification from '../models/Notification.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Send invite
router.post('/', auth, async (req, res) => {
  try {
    const { toUserId, subject, proposedSchedule, message, groupName } = req.body;
    
    // Check for duplicate pending invite
    const existing = await Invite.findOne({
      fromUserId: req.userId,
      toUserId,
      subject,
      status: 'pending'
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Invite already sent' });
    }
    
    const invite = await Invite.create({
      fromUserId: req.userId,
      toUserId,
      subject,
      groupName: groupName || `${subject} Study Group`,
      proposedSchedule,
      message
    });
    
    const sender = await User.findById(req.userId);
    
    await Notification.create({
      userId: toUserId,
      type: 'group_invite',
      message: `${sender.name} invited you to join ${groupName || subject + ' Study Group'}`,
      inviteId: invite._id
    });
    
    res.json({ message: 'Invite sent', invite });
  } catch (error) {
    console.error('Send invite error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List invites
router.get('/', auth, async (req, res) => {
  try {
    const receivedInvites = await Invite.find({ toUserId: req.userId, status: 'pending' })
      .populate('fromUserId', 'name email')
      .sort({ createdAt: -1 });
    
    const sentInvites = await Invite.find({ fromUserId: req.userId })
      .populate('toUserId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ receivedInvites, sentInvites });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept invite
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const { selectedScheduleIndex = 0 } = req.body;
    const invite = await Invite.findById(req.params.id);

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.toUserId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'Invite already responded' });
    }

    invite.status = 'accepted';
    invite.respondedAt = new Date();
    await invite.save();

    let group;

    if (invite.groupId) {
      // Add user to existing group
      group = await Group.findById(invite.groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      if (group.members.length >= 5) {
        return res.status(400).json({ error: 'Group is already full' });
      }
      if (group.members.some(m => m.equals(req.userId))) {
        return res.status(400).json({ error: 'Already a member of this group' });
      }
      group.members.push(req.userId);
      await group.save();
      await group.populate('members', 'name email cluster');
    } else {
      // Create new group — safely handle empty/missing proposedSchedule
      const schedules = invite.proposedSchedule || [];
      const schedule = schedules.length > 0
        ? (schedules[selectedScheduleIndex] || schedules[0])
        : null;

      group = await Group.create({
        name: invite.groupName || `${invite.subject} Study Group`,
        subject: invite.subject,
        members: [invite.fromUserId, invite.toUserId],
        createdBy: invite.fromUserId,
        ...(schedule ? { schedule } : {})
      });
    }

    // Delete the notification so it disappears from the UI
    await Notification.deleteMany({
      inviteId: invite._id,
      userId: req.userId
    }).catch(() => {});

    res.json({ message: 'Invite accepted', group, invite });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Decline invite
router.post('/:id/decline', auth, async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.id);

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.toUserId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    invite.status = 'declined';
    invite.respondedAt = new Date();
    await invite.save();

    // Delete notification so it disappears from UI
    await Notification.deleteMany({
      inviteId: invite._id,
      userId: req.userId
    }).catch(() => {});

    res.json({ message: 'Invite declined' });
  } catch (error) {
    console.error('Decline invite error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
