import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  groupName: { type: String },
  proposedSchedule: [{
    days: [String],
    startTime: String,
    durationMinutes: Number
  }],
  message: String,
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'expired'], default: 'pending' },
  respondedAt: Date
}, { timestamps: true });

// Indexes for fast lookups
inviteSchema.index({ toUserId: 1, status: 1 });
inviteSchema.index({ fromUserId: 1 });

export default mongoose.model('Invite', inviteSchema);
