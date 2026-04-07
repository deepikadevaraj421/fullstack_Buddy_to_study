async function testInviteMembers() {
  try {
    // First login to get token
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@test.com',

        password: 'password123'
      })
    });

    console.log('Login response status:', loginRes.status);
    const loginData = await loginRes.json();
    console.log('Login response:', loginData);

    if (!loginData.token) {
      console.log('Login failed');
      return;
    }

    const token = loginData.token;
    console.log('Logged in as Alice');

    // Get user's groups
    const groupsRes = await fetch('http://localhost:5000/api/groups', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Groups response status:', groupsRes.status);
    const groups = await groupsRes.json();
    console.log('Groups response:', groups);

    if (!Array.isArray(groups) || groups.length === 0) {
      console.log('No groups found for Alice. Let\'s check all groups...');
      return;
    }

    const group = groups[0];
    console.log(`Found group: ${group.subject} with ${group.members.length} members`);

    // Get recommended students
    const recommendedRes = await fetch(`http://localhost:5000/api/groups/${group._id}/recommended`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Recommended response status:', recommendedRes.status);
    const recommendedText = await recommendedRes.text();
    console.log('Recommended response text:', recommendedText);
    let recommendedData;
    try {
      recommendedData = JSON.parse(recommendedText);
    } catch (e) {
      console.error('Failed to parse recommended JSON', e);
      return;
    }
    console.log(`Recommended students: ${recommendedData.recommended.length}`);

    if (recommendedData.recommended.length > 0) {
      const userToInvite = recommendedData.recommended[0];
      console.log(`Inviting ${userToInvite.name}...`);

      // Send invite
      const inviteRes = await fetch(`http://localhost:5000/api/groups/${group._id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ toUserId: userToInvite._id })
      });

      const inviteData = await inviteRes.json();
      console.log('Invite sent successfully:', inviteData);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testInviteMembers();