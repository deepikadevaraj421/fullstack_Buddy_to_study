import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  college: String,
  dept: String,
  year: Number,
  onboardingComplete: { type: Boolean, default: false },
  subjects: [{
    name: String,
    skill: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] }
  }],
  availability: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    startTime: String,
    endTime: String
  }],
  preferences: {
    groupSize: { type: Number, default: 4 },
    mode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
    communication: { type: String, enum: ['chat', 'voice', 'both'], default: 'both' },
    sessionDuration: { type: Number, default: 60 }
  },
  behavior: {
    frequencyTarget: { type: Number, default: 3 },
    timeWindow: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'], default: 'evening' },
    commitment: { type: Number, min: 1, max: 10, default: 7 }
  },
  cluster: {
    label: String,
    confidence: Number
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
