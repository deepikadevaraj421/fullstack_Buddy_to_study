import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { findMatches } from '../utils/matching.js';

const router = express.Router();

// Get recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    const { subject } = req.query;
    
    // If no subject specified, get general recommendations across all subjects
    const matches = await findMatches(User, req.user, subject || null, 3);
    
    const recommendations = matches.map(m => ({
      userId: m.user._id,
      name: m.user.name,
      subject: subject || m.subject || 'General',
      skillLevel: m.skillLevel,
      overlapPct: m.overlapPct,
      clusterLabel: m.user.cluster?.label || 'Unknown',
      compatibilityScore: m.score,
      reasons: m.reasons
    }));
    
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
