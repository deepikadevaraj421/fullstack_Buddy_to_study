import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { findMatches, generateInsights } from '../utils/matching.js';

const router = express.Router();

// Get recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    const { subject } = req.query;
    const matches = await findMatches(User, req.user, subject || null, 3);
    res.json(matches.map(m => ({
      userId: m.user._id,
      name: m.user.name,
      subject: subject || m.subject || 'General',
      skillLevel: m.skillLevel,
      overlapPct: m.overlapPct,
      clusterLabel: m.user.cluster?.label || 'Unknown',
      compatibilityScore: m.score,
      reasons: m.reasons
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get personalized DS-powered insights
router.get('/insights', auth, async (req, res) => {
  try {
    const Group = (await import('../models/Group.js')).default;
    const Session = (await import('../models/Session.js')).default;
    const Task = (await import('../models/Task.js')).default;

    const groups = await Group.find({ members: req.user._id, isDissolved: false });
    const groupIds = groups.map(g => g._id);
    const sessions = await Session.find({ groupId: { $in: groupIds } });
    const tasks = await Task.find({ groupId: { $in: groupIds } });

    const insights = generateInsights(req.user, groups, sessions, tasks);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
