import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production_min_32_chars';

// Test login and task functionality
const loginData = {
  email: 'alice@test.com',
  password: 'password123'
};

console.log('Testing task functionality...\n');

// First login
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(loginData)
})
.then(res => {
  console.log('Login Status:', res.status);
  return res.json();
})
.then(async data => {
  if (data.token) {
    console.log('✅ Login successful!');
    const token = data.token;

    // Get user's groups first
    const groupsRes = await fetch('http://localhost:5000/api/groups', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const groups = await groupsRes.json();
    console.log('User groups:', groups.map(g => g.subject));

    if (groups.length > 0) {
      const groupId = groups[0]._id;

      // Create a test task
      console.log('\n📝 Creating test task...');
      const taskData = {
        title: 'Test Task - Complete Binary Tree Implementation',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
      };

      const createTaskRes = await fetch(`http://localhost:5000/api/groups/${groupId}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      const newTask = await createTaskRes.json();
      console.log('✅ Task created:', newTask.title);

      // Get all tasks
      console.log('\n📋 Getting all tasks...');
      const tasksRes = await fetch(`http://localhost:5000/api/groups/${groupId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const tasks = await tasksRes.json();
      console.log(`Found ${tasks.length} tasks`);

      if (tasks.length > 0) {
        const taskId = tasks[0]._id;
        console.log('\n✅ Completing task...');

        const completeRes = await fetch(`http://localhost:5000/api/groups/${groupId}/tasks/${taskId}/complete`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const updatedTask = await completeRes.json();
        console.log('Updated task completion array:', updatedTask.completion.map(c => ({
          userId: c.userId,
          name: c.userId.name || c.userId,
          done: c.done
        })));

        // Check notifications for Alice (should be 0 - she only receives from others)
        console.log('\n🔔 Checking Alice notifications...');
        const notificationsRes = await fetch('http://localhost:5000/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const notifications = await notificationsRes.json();
        console.log(`Alice has ${notifications.length} notifications`);

        // Login as Bob to check his notifications
        console.log('\n🔔 Checking Bob notifications...');
        const bobLoginRes = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'bob@test.com',
            password: 'password123'
          })
        });

        const bobData = await bobLoginRes.json();
        const bobToken = bobData.token;

        const bobNotificationsRes = await fetch('http://localhost:5000/api/notifications', {
          headers: {
            'Authorization': `Bearer ${bobToken}`,
            'Content-Type': 'application/json'
          }
        });

        const bobNotifications = await bobNotificationsRes.json();
        console.log(`Bob has ${bobNotifications.length} notifications`);
        if (bobNotifications.length > 0) {
          bobNotifications.slice(0, 3).forEach((n, i) => {
            console.log(`${i + 1}. ${n.message} (${n.type})`);
          });
        }
      }
    }
  } else {
    console.error('❌ Login failed:', data);
  }
})
.catch(err => {
  console.error('Error:', err.message);
});
