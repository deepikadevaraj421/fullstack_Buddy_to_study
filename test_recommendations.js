import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Test login to get token
async function testLogin() {
  try {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'alice@test.com',
      password: 'password123'
    });
    const token = loginRes.data.token;
    console.log('Token:', token);

    // Get groups
    const groupsRes = await axios.get(`${API_BASE}/groups`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Groups:', groupsRes.data);

    // Get recommended for first group
    const groupId = groupsRes.data[0]._id;
    const recRes = await axios.get(`${API_BASE}/groups/${groupId}/recommended`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Recommended for group:', recRes.data);

  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

testLogin();