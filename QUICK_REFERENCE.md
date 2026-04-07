# 🚀 Quick Reference Card

## Installation (Choose One)

### Windows Automated
```bash
setup.bat
```

### Manual
```bash
cd server && npm install
cd ../client && npm install
cd .. && npm install
```

## Configuration

### Required: MongoDB Setup
Edit `server/.env`:
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/buddy_to_study
JWT_SECRET=your_random_32_character_secret_key_here
```

## Running the App

### Development Mode
```bash
npm run dev          # Runs both client and server
```

### Separate Terminals
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

## Access Points
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000/api/health

## Project Structure
```
client/src/
├── components/      # Logo, ProtectedRoute
├── context/         # AuthContext
├── pages/           # 7 pages
├── utils/           # API client
└── App.jsx          # Router

server/src/
├── models/          # User, Group, Session, Task
├── routes/          # auth, users, match, groups, sessions
├── middleware/      # auth
├── utils/           # matching
└── server.js        # Entry
```

## Key Files to Edit

### Add MongoDB Credentials
- `server/.env` - MONGODB_URI and JWT_SECRET

### Customize Theme
- `client/tailwind.config.js` - Colors
- `client/src/index.css` - Background gradient

### Modify Matching Logic
- `server/src/utils/matching.js` - Clustering & scoring

### Add New Routes
- `server/src/routes/` - Backend routes
- `client/src/pages/` - Frontend pages
- `client/src/App.jsx` - Add to router

## Common Commands

```bash
# Install dependencies
npm install

# Run development
npm run dev

# Build for production
cd client && npm run build

# Start production server
cd server && npm start
```

## Testing Flow

1. **Register** → http://localhost:5173/register
2. **Onboarding** → Complete 4 steps
3. **Dashboard** → Select subject, view matches
4. **Create Group** → Click on recommended partner
5. **Group Dashboard** → Create session, add task
6. **Join Session** → Auto-marks attendance
7. **Complete Task** → Toggle completion
8. **Evaluate Health** → Check group health score

## API Quick Reference

```javascript
// Auth
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

// Users
PUT    /api/users/onboarding
GET    /api/users/profile

// Matching
GET    /api/match/recommendations?subject=DSA

// Groups
POST   /api/groups
GET    /api/groups
GET    /api/groups/:id
POST   /api/groups/:id/sessions
POST   /api/groups/:id/tasks
POST   /api/groups/:id/evaluate-week

// Sessions & Tasks
POST   /api/sessions/:sessionId/join
PUT    /api/groups/:id/tasks/:taskId/complete
```

## Environment Variables

### Server (.env)
```env
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<random_32_char_string>
PORT=5000
NODE_ENV=development
```

### Client (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## Troubleshooting

### MongoDB Connection Failed
- Check MONGODB_URI in server/.env
- Verify IP whitelist in MongoDB Atlas
- Ensure database user has permissions

### Port Already in Use
- Change PORT in server/.env
- Update VITE_API_URL in client/.env

### CORS Errors
- Ensure server is running
- Check VITE_API_URL matches server URL

### Module Not Found
- Delete node_modules in client and server
- Run npm install again

## Documentation Files

- **README.md** - Project overview & quick start
- **SETUP.md** - Detailed setup & troubleshooting
- **FEATURES.md** - Complete feature checklist
- **PROJECT_SUMMARY.md** - Technical summary

## Tech Stack

**Frontend:** React 18, Vite, TailwindCSS, React Router, Axios
**Backend:** Node.js, Express, Mongoose, JWT, bcrypt
**Database:** MongoDB Atlas
**Dev:** Concurrently, dotenv, express-validator

## Color Palette

```css
Primary (Teal):
- 500: #14b8a6
- 600: #0d9488

Accent (Green):
- 500: #22c55e
- 600: #16a34a

Background:
- Gradient: teal-50 → green-50
```

## Default Ports

- Client: 5173 (Vite)
- Server: 5000 (Express)
- Database: MongoDB Atlas (cloud)

## Security Notes

- ✅ JWT tokens expire in 7 days
- ✅ Passwords hashed with bcrypt
- ✅ Protected routes require auth
- ✅ Input validation on all endpoints
- ✅ CORS enabled for frontend
- ⚠️ Change JWT_SECRET in production
- ⚠️ Use strong MongoDB password
- ⚠️ Never commit .env files

## Production Deployment

### Frontend (Vercel/Netlify)
1. Build: `cd client && npm run build`
2. Deploy `dist` folder
3. Set VITE_API_URL to production backend

### Backend (Heroku/Railway/Render)
1. Set environment variables
2. Set NODE_ENV=production
3. Deploy from server folder

---

**Need Help?** Check SETUP.md for detailed instructions
**Found a Bug?** Check FEATURES.md for implementation status
**Want Overview?** Read PROJECT_SUMMARY.md
