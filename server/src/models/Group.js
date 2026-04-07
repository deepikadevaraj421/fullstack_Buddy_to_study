import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: { type: String },
  subject: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  schedule: {
    days: [String],
    startTime: String,
    durationMinutes: Number
  },
  scheduleRule: String,
  isDissolved: { type: Boolean, default: false },
  atRiskStreak: { type: Number, default: 0 },
  weeklyHealthHistory: [{
    weekStart: Date,
    attendanceRate: Number,
    taskCompletionRate: Number,
    score: Number,
    status: { type: String, enum: ['Healthy', 'Warning', 'At Risk'] }
  }],
  voiceParticipants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model('Group', groupSchema);
