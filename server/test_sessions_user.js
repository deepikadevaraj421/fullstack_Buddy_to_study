import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './src/models/User.js';
import Group from './src/models/Group.js';
import Session from './src/models/Session.js';

const mongoUri = 'mongodb://127.0.0.1:27017/buddy_to_study';
const SECRET = process.env.JWT_SECRET || 'your-secret-key';

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Get the first user
    const user = await User.findOne();
    if (!user) {
      console.error('❌ No users found in database');
      mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`\nUser: ${user.name} (${user._id})`);
    
    // Get groups this user is a member of
    const groups = await Group.find({ members: user._id, isDissolved: false });
    console.log(`\nGroups user is member of: ${groups.length}`);
    groups.forEach(g => console.log(`  - ${g.subject}`));
    
    // Get upcoming sessions for these groups
    if (groups.length > 0) {
      const groupIds = groups.map(g => g._id);
      const sessionCount = await Session.countDocuments({
        groupId: { $in: groupIds },
        startTime: { $gte: new Date() }
      });
      console.log(`\nUpcoming sessions for these groups: ${sessionCount}`);
      
      const sessions = await Session.find({
        groupId: { $in: groupIds },
        startTime: { $gte: new Date() }
      })
      .sort({ startTime: 1 })
      .populate('groupId', 'subject');
      
      sessions.forEach(s => {
        console.log(`  - ${s.groupId?.subject}: ${s.startTime} (${s.durationMinutes} min)`);
      });
    } else {
      console.log('\n⚠️  User is not a member of any active groups');
      console.log('\nAll available sessions:');
      const allSessions = await Session.find({  startTime: { $gte: new Date() } })
        .sort({ startTime: 1 })
        .populate('groupId', 'subject members');
      
      allSessions.forEach(s => {
        console.log(`  - ${s.groupId?.subject}: ${s.startTime} (members: ${s.groupId?.members.length})`);
      });
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
