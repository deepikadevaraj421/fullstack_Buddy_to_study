import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  startTime: { type: Date, required: true },
  durationMinutes: { type: Number, default: 60 },
  attendance: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['present', 'absent'], default: 'absent' },
    joinedAt: Date
  }]
}, { timestamps: true });

export default mongoose.model('Session', sessionSchema);
