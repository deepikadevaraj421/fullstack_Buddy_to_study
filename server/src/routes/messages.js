import express from 'express';
import Message from '../models/Message.js';
import Group from '../models/Group.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get messages for a group
router.get('/groups/:groupId/messages', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Verify user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    if (!group.members.some(m => m.equals(req.userId))) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }
    
    const messages = await Message.find({ groupId }).populate('userId', 'name').sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a message to a group
router.post('/groups/:groupId/messages', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { type = 'text', content, files, audioUrl } = req.body;
    
    // Verify user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    if (!group.members.some(m => m.equals(req.userId))) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }
    
    const userId = req.userId;

    const messageData = {
      groupId,
      userId,
      type
    };

    if (type === 'text') {
      messageData.content = content;
    } else if (type === 'file') {
      // Placeholder: in real app, handle file uploads
      if (files && files.length > 0) {
        messageData.fileName = files[0].name;
        messageData.fileUrl = files[0].url;
      }
    } else if (type === 'audio') {
      messageData.audioUrl = audioUrl;
    }

    const message = new Message(messageData);
    await message.save();
    await message.populate('userId', 'name');

    console.log(`Message saved: ${message._id}`);
    const io = req.app.get('io');
    if (io) {
      console.log(`Emitting message to group: ${groupId}`);
      io.to(String(groupId)).emit('new-message', message);
      console.log(`Message emitted to group ${groupId}`);
    } else {
      console.warn('Socket.io instance not found');
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;