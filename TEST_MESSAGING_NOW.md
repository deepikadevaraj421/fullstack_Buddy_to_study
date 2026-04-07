# QUICK START - TEST MESSAGING NOW

## Copy-Paste Commands (Windows PowerShell)

### Terminal 1: Start Backend
```powershell
cd C:\Users\deepi\Desktop\fullstack_project\(BTS\)\server
npm start
```
Wait for: `Server running on http://localhost:5000`

### Terminal 2: Start Frontend  
```powershell
cd C:\Users\deepi\Desktop\fullstack_project\(BTS\)\client
npm run dev
```
Wait for: `Local: http://localhost:5173`

## Test in Browser (Right Now!)

### Window 1: Alice's Account
1. Go to: http://localhost:5173
2. Login:
   - Email: `alice@test.com`
   - Password: `password123`
3. Click: Groups → DSA
4. Click: Communication tab
5. Type: `Hello Bob, can you see this?`
6. Click: Send (➤ button)
7. **Should show**: Message appears immediately in green message box

### Window 2: Bob's Account (Incognito/New Window)
1. Go to: http://localhost:5173
2. Login:
   - Email: `bob@test.com`  
   - Password: `password123`
3. Click: Groups → DSA
4. Click: Communication tab
5. **Should show**: Alice's message "Hello Bob, can you see this?" within 3 seconds
6. Type: `Yes! I can see your message!`
7. Click: Send

### Back to Window 1: Alice
- **Within 3 seconds**, Alice should see Bob's reply: "Yes! I can see your message!"

## Verify Database Persistence

### In Alice's window:
1. Reload the page (F5)
2. Login again
3. Go back to DSA → Communication
4. **Both messages should still be there!**

## If Something Goes Wrong

### Check 1: Is server running?
```powershell
curl http://localhost:5000/api/health
# Should show: {"status":"ok","timestamp":"..."}
```

### Check 2: Check browser console (F12)
Look for green logs like:
```
✓ Fetched 2 messages
```

### Check 3: Kill stuck processes and restart
```powershell
Get-Process -Name node | Stop-Process -Force
# Wait 2 seconds
# Start Terminal 1 again (npm start)
```

### Check 4: Clear browser cache
- Ctrl+Shift+Delete
- Clear all data
- Reload page

## Expected Console Logs (F12 → Console)

```
📥 Fetching messages for group 69a9ec3475ae16f23d9ad38e
✓ Fetched 0 messages

[After Alice sends message]
📤 Sending text message to group 69a9ec3475ae16f23d9ad38e
✓ Message sent (ID: 69aa855ae0734e4594186ade)

[Every 3 seconds]
📥 Fetching messages for group 69a9ec3475ae16f23d9ad38e
✓ Fetched 1 messages
```

## Troubleshooting Checklist

- [ ] Server running on 5000? (`npm start` in /server)
- [ ] Client running on 5173? (`npm run dev` in /client)
- [ ] Both users in same group? (Alice, Bob both in DSA group)
- [ ] Using correct credentials? (see above)
- [ ] Both browsers have same API URL? (should auto-detect localhost:5000)
- [ ] Console shows fetch logs every 3 seconds?
- [ ] Sync status shows "✓ Synced"?

## Advanced: Manual API Test

```bash
# Get Alice's token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"password123"}' \
  | jq '.token'

# [Copy token from above]

# Send message as Alice to DSA group (ID: 69a9ec3475ae16f23d9ad38e)
curl -X POST http://localhost:5000/api/groups/69a9ec3475ae16f23d9ad38e/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [PASTE_TOKEN]" \
  -d '{"type":"text","content":"Test message from API"}' \
  | jq

# Get all messages in group as Bob
curl -X GET http://localhost:5000/api/groups/69a9ec3475ae16f23d9ad38e/messages \
  -H "Authorization: Bearer [BOB_TOKEN]" \
  | jq
```

---

**That's it! The messaging should work now. Test it!**
