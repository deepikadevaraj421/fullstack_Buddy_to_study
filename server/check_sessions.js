import mongoose from 'mongoose';
import Session from './src/models/Session.js';
import Group from './src/models/Group.js';
import User from './src/models/User.js';

const mongoUri = 'mongodb://127.0.0.1:27017/buddy_to_study';

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const sessionCount = await Session.countDocuments();
    const groupCount = await Group.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log(`\nDatabase Statistics:`);
    console.log(`- Sessions: ${sessionCount}`);
    console.log(`- Groups: ${groupCount}`);
    console.log(`- Users: ${userCount}`);
    
    if (sessionCount > 0) {
      const sessions = await Session.find({}).limit(3).populate('groupId', 'subject');
      console.log(`\nFirst 3 Sessions:`);
      sessions.forEach(s => {
        console.log(`  - ${s._id}: Group ${s.groupId?.subject}, Start: ${s.startTime}`);
      });
    }
    
    if (groupCount > 0) {
      const groups = await Group.find({}).limit(1);
      console.log(`\nSample Group:`);
      groups.forEach(g => {
        console.log(`  - ${g.subject} with ${g.members.length} members`);
      });
    }
    
    mongoose.connection.close();
    console.log('\n✅ Check complete');
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
