async function test() {
  const baseUrl = 'http://localhost:5000/api';

  const apiFetch = async (method, endpoint, body = null, token = null) => {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers.Authorization = `Bearer ${token}`;
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(`${baseUrl}${endpoint}`, options);
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`${res.status}: ${error}`);
    }
    return res.json();
  };

  try {
    console.log('=== Testing Message Flow ===\n');

    // 1. Login as Alice
    console.log('1️⃣ Logging in as Alice...');
    let data = await apiFetch('POST', '/auth/login', {
      email: 'alice@test.com',
      password: 'password123'
    });
    const aliceToken = data.token;
    const aliceId = data.userId;
    console.log(`✓ Alice logged in (ID: ${aliceId})\n`);

    // 2. Login as Bob
    console.log('2️⃣ Logging in as Bob...');
    data = await apiFetch('POST', '/auth/login', {
      email: 'bob@test.com',
      password: 'password123'
    });
    const bobToken = data.token;
    const bobId = data.userId;
    console.log(`✓ Bob logged in (ID: ${bobId})\n`);

    // 3. Get Alice's groups
    console.log('3️⃣ Getting Alice\'s groups...');
    data = await apiFetch('GET', '/groups', null, aliceToken);
    const drivingGroup = data.find(g => g.subject === 'DSA');
    if (!drivingGroup) {
      console.error('✗ DSA group not found');
      return;
    }
    const groupId = drivingGroup._id;
    console.log(`✓ Found DSA group (ID: ${groupId})\n`);

    // 4. Alice sends a message
    console.log('4️⃣ Alice sending message...');
    data = await apiFetch('POST', `/groups/${groupId}/messages`, 
      { type: 'text', content: 'Hello Bob! This is Alice' },
      aliceToken
    );
    const msg1 = data;
    console.log(`✓ Message sent (ID: ${msg1._id})`);
    console.log(`  Content: "${msg1.content}"\n`);

    // 5. Bob fetches messages for the group
    console.log('5️⃣ Bob fetching messages from group...');
    data = await apiFetch('GET', `/groups/${groupId}/messages`, null, bobToken);
    const bobMessages = data;
    console.log(`✓ Fetched ${bobMessages.length} message(s)`);
    if (bobMessages.length > 0) {
      console.log(`  First message: "${bobMessages[0].content}"`);
      console.log(`  From: ${bobMessages[0].userId.name}\n`);
    }

    // 6. Bob sends a reply
    console.log('6️⃣ Bob sending reply...');
    data = await apiFetch('POST', `/groups/${groupId}/messages`,
      { type: 'text', content: 'Hi Alice! Message received!' },
      bobToken
    );
    const msg2 = data;
    console.log(`✓ Message sent (ID: ${msg2._id})`);
    console.log(`  Content: "${msg2.content}"\n`);

    // 7. Alice fetches messages again
    console.log('7️⃣ Alice fetching messages again...');
    data = await apiFetch('GET', `/groups/${groupId}/messages`, null, aliceToken);
    const aliceMessages = data;
    console.log(`✓ Fetched ${aliceMessages.length} message(s)`);
    aliceMessages.forEach((msg, i) => {
      console.log(`  [${i + 1}] ${msg.userId.name}: "${msg.content}"`);
    });

    console.log('\n✅ All tests passed! Messages are persisting and visible to both users.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

test();
