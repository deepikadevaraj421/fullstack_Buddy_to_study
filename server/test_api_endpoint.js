import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production_min_32_chars';
const userId = '69aa8b39323e4d6fe115fb78'; // Alice's new ID

console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
console.log('Using SECRET:', SECRET);

// Create a test token
const token = jwt.sign({ userId }, SECRET, { expiresIn: '24h' });

console.log('Test Token:', token);
console.log('\nTesting /sessions/upcoming endpoint...\n');

const apiUrl = 'http://localhost:5000/api/sessions/upcoming';

fetch(apiUrl, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => {
  console.log('Status:', res.status);
  console.log('Headers:', Object.fromEntries(res.headers));
  return res.json();
})
.then(data => {
  console.log('\nResponse:');
  console.log(JSON.stringify(data, null, 2));
})
.catch(err => {
  console.error('Error:', err.message);
});
