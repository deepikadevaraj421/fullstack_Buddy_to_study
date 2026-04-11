import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  inviteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invite' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

// Index for fast per-user notification queries
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ inviteId: 1 });

export default mongoose.model('Notification', notificationSchema);
