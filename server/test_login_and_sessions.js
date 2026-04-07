import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production_min_32_chars';

// Test login API
const loginData = {
  email: 'alice@test.com',
  password: 'password123'
};

console.log('Testing login API...\n');

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
.then(data => {
  if (data.token) {
    console.log('✅ Login successful!');
    console.log('Token:', data.token);

    // Now test the sessions endpoint with this token
    console.log('\nTesting /sessions/upcoming with login token...\n');

    return fetch('http://localhost:5000/api/sessions/upcoming', {
      headers: {
        'Authorization': `Bearer ${data.token}`,
        'Content-Type': 'application/json'
      }
    });
  } else {
    console.error('❌ Login failed:', data);
    throw new Error('Login failed');
  }
})
.then(res => {
  console.log('Sessions Status:', res.status);
  return res.json();
})
.then(data => {
  console.log('\nSessions Response:');
  console.log(JSON.stringify(data, null, 2));
})
.catch(err => {
  console.error('Error:', err.message);
});
