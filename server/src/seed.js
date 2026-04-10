import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Group from './models/Group.js';
import Session from './models/Session.js';
import Task from './models/Task.js';

dotenv.config();

const dummyUsers = [
  {
    name: 'Alice Johnson',
    email: 'alice@test.com',
    password: 'password123',
    onboardingComplete: true,
    subjects: [{ name: 'DSA', skill: 'Advanced' }, { name: 'Web Dev', skill: 'Intermediate' }],
    availability: [
      { day: 'Monday', startTime: '09:00', endTime: '17:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
      { day: 'Friday', startTime: '09:00', endTime: '17:00' }
    ],
    preferences: { groupSize: 4, mode: 'online', communication: 'both', sessionDuration: 60 },
    behavior: { frequencyTarget: 5, timeWindow: 'morning', commitment: 9 },
    cluster: { label: 'Consistent Planner', confidence: 90 }
  },
  {
    name: 'Bob Smith',
    email: 'bob@test.com',
    password: 'password123',
    onboardingComplete: true,
    subjects: [{ name: 'DSA', skill: 'Intermediate' }, { name: 'DBMS', skill: 'Beginner' }],
    availability: [
      { day: 'Monday', startTime: '18:00', endTime: '22:00' },
      { day: 'Tuesday', startTime: '18:00', endTime: '22:00' },
      { day: 'Thursday', startTime: '18:00', endTime: '22:00' }
    ],
    preferences: { groupSize: 3, mode: 'online', communication: 'voice', sessionDuration: 90 },
    behavior: { frequencyTarget: 4, timeWindow: 'night', commitment: 7 },
    cluster: { label: 'Night Owl', confidence: 87 }
  },
  {
    name: 'Carol Davis',
    email: 'carol@test.com',
    password: 'password123',
    onboardingComplete: true,
    subjects: [{ name: 'Machine Learning', skill: 'Advanced' }, { name: 'DSA', skill: 'Advanced' }],
    availability: [
      { day: 'Saturday', startTime: '10:00', endTime: '18:00' },
      { day: 'Sunday', startTime: '10:00', endTime: '18:00' }
    ],
    preferences: { groupSize: 4, mode: 'hybrid', communication: 'both', sessionDuration: 120 },
    behavior: { frequencyTarget: 2, timeWindow: 'afternoon', commitment: 8 },
    cluster: { label: 'Weekend Warrior', confidence: 85 }
  },
  {
    name: 'David Lee',
    email: 'david@test.com',
    password: 'password123',
    onboardingComplete: true,
    subjects: [{ name: 'Web Dev', skill: 'Beginner' }, { name: 'DSA', skill: 'Intermediate' }],
    availability: [
      { day: 'Monday', startTime: '14:00', endTime: '18:00' },
      { day: 'Wednesday', startTime: '14:00', endTime: '18:00' },
      { day: 'Friday', startTime: '14:00', endTime: '18:00' }
    ],
    preferences: { groupSize: 5, mode: 'online', communication: 'chat', sessionDuration: 60 },
    behavior: { frequencyTarget: 3, timeWindow: 'afternoon', commitment: 6 },
    cluster: { label: 'Balanced Learner', confidence: 80 }
  },
  {
    name: 'Emma Wilson',
    email: 'emma@test.com',
    password: 'password123',
    onboardingComplete: true,
    subjects: [{ name: 'DBMS', skill: 'Intermediate' }, { name: 'OS', skill: 'Advanced' }],
    availability: [
      { day: 'Tuesday', startTime: '09:00', endTime: '12:00' },
      { day: 'Thursday', startTime: '09:00', endTime: '12:00' }
    ],
    preferences: { groupSize: 3, mode: 'offline', communication: 'voice', sessionDuration: 45 },
    behavior: { frequencyTarget: 2, timeWindow: 'morning', commitment: 4 },
    cluster: { label: 'Casual Learner', confidence: 75 }
  },
  {
    name: 'Frank Miller',
    email: 'frank@test.com',
    password: 'password123',
    onboardingComplete: true,
    subjects: [{ name: 'DSA', skill: 'Beginner' }, { name: 'Math', skill: 'Intermediate' }],
    availability: [
      { day: 'Monday', startTime: '09:00', endTime: '17:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '17:00' }
    ],
    preferences: { groupSize: 4, mode: 'online', communication: 'both', sessionDuration: 60 },
    behavior: { frequencyTarget: 2, timeWindow: 'evening', commitment: 7 },
    cluster: { label: 'Sprint Learner', confidence: 82 }
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Only insert dummy users if they don't already exist
    const users = [];
    for (const userData of dummyUsers) {
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        const passwordHash = await bcrypt.hash(userData.password, 10);
        user = new User({ ...userData, passwordHash });
        await user.save();
        console.log(`Created user: ${user.name}`);
      } else {
        console.log(`Skipped (already exists): ${user.name}`);
      }
      users.push(user);
    }

    // Create groups
    const group1 = new Group({
      subject: 'DSA',
      members: [users[0]._id, users[1]._id, users[3]._id],
      createdBy: users[0]._id,
      atRiskStreak: 0,
      weeklyHealthHistory: []
    });
    await group1.save();
    console.log('Created DSA Study Group');

    const group2 = new Group({
      subject: 'Web Dev',
      members: [users[0]._id, users[3]._id],
      createdBy: users[3]._id,
      atRiskStreak: 0,
      weeklyHealthHistory: []
    });
    await group2.save();
    console.log('Created Web Dev Study Group');

    const group3 = new Group({
      subject: 'Machine Learning',
      members: [users[2]._id],
      createdBy: users[2]._id,
      atRiskStreak: 0,
      weeklyHealthHistory: []
    });
    await group3.save();
    console.log('Created ML Study Group');

    // Create sessions for group1 (DSA)
    const session1 = new Session({
      groupId: group1._id,
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      durationMinutes: 60,
      attendance: [
        { userId: users[0]._id, status: 'absent' },
        { userId: users[1]._id, status: 'absent' },
        { userId: users[3]._id, status: 'absent' }
      ]
    });
    await session1.save();

    const session2 = new Session({
      groupId: group1._id,
      startTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      durationMinutes: 90,
      attendance: [
        { userId: users[0]._id, status: 'absent' },
        { userId: users[1]._id, status: 'absent' },
        { userId: users[3]._id, status: 'absent' }
      ]
    });
    await session2.save();

    // Create session for group2 (Web Dev)
    const session3 = new Session({
      groupId: group2._id,
      startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      durationMinutes: 60,
      attendance: [
        { userId: users[0]._id, status: 'absent' },
        { userId: users[3]._id, status: 'absent' }
      ]
    });
    await session3.save();

    // Create session for group3 (Machine Learning)
    const session4 = new Session({
      groupId: group3._id,
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      durationMinutes: 120,
      attendance: [
        { userId: users[2]._id, status: 'absent' }
      ]
    });
    await session4.save();

    console.log('Created sessions for all groups');

    // Create tasks for group1
    const task1 = new Task({
      groupId: group1._id,
      title: 'Complete Binary Tree problems',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: users[0]._id,
      completion: [
        { userId: users[0]._id, done: false },
        { userId: users[1]._id, done: false },
        { userId: users[3]._id, done: false }
      ]
    });
    await task1.save();

    const task2 = new Task({
      groupId: group1._id,
      title: 'Review Dynamic Programming concepts',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdBy: users[1]._id,
      completion: [
        { userId: users[0]._id, done: true },
        { userId: users[1]._id, done: false },
        { userId: users[3]._id, done: false }
      ]
    });
    await task2.save();
    console.log('Created tasks');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('Email: alice@test.com | Password: password123');
    console.log('Email: bob@test.com | Password: password123');
    console.log('Email: carol@test.com | Password: password123');
    console.log('Email: david@test.com | Password: password123');
    console.log('Email: emma@test.com | Password: password123');
    console.log('Email: frank@test.com | Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
