import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  title: { type: String, required: true },
  dueDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completion: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    done: { type: Boolean, default: false },
    doneAt: Date
  }]
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
