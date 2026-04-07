import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, // For existing group invites
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

export default mongoose.model('Invite', inviteSchema);
