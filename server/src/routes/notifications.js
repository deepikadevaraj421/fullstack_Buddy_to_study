import express from 'express';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
