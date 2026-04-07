import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['text', 'file', 'audio'], default: 'text' },
  content: { type: String }, // for text messages
  fileName: { type: String }, // for file messages
  fileUrl: { type: String }, // for file messages
  audioUrl: { type: String }, // for audio messages
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);