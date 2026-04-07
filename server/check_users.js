import mongoose from 'mongoose';
import User from './src/models/User.js';

const mongoUri = 'mongodb://127.0.0.1:27017/buddy_to_study';

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    const users = await User.find({}).limit(3);
    console.log('\nFirst 3 users:');
    users.forEach(u => {
      console.log(`  - ${u.name}: ${u._id} (${u.email})`);
    });

    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
