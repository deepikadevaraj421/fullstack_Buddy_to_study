# Buddy_to_study - Complete Setup Guide

## 🚀 Quick Start

### Step 1: Install Dependencies

Open two terminals in the project root directory.

**Terminal 1 - Server:**
```bash
cd server
npm install
```

**Terminal 2 - Client:**
```bash
cd client
npm install
```

### Step 2: Configure MongoDB

1. Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier is fine)
3. Create a database user with username and password
4. Get your connection string (should look like: `mongodb+srv://username:password@cluster.mongodb.net/`)
5. Whitelist your IP address (or use 0.0.0.0/0 for development)

### Step 3: Configure Environment Variables

**Server Configuration:**

Edit `server/.env` and replace the placeholder values:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/buddy_to_study?retryWrites=true&w=majority
JWT_SECRET=your_random_secret_key_at_least_32_characters_long
PORT=5000
NODE_ENV=development
```

**Client Configuration:**

The `client/.env` file is already configured for local development:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 4: Run the Application

**Option A: Run in separate terminals**

Terminal 1 (Server):
```bash
cd server
npm run dev
```

Terminal 2 (Client):
```bash
cd client
npm run dev
```

**Option B: Run concurrently from root**

From the project root:
```bash
npm install
npm run dev
```

### Step 5: Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health

## 📋 Testing the Application

### 1. Register a New User
- Go to http://localhost:5173
- Click "Get Started" or "Register"
- Fill in your details
- Submit the form

### 2. Complete Onboarding
- After registration, you'll be redirected to onboarding
- Complete all 4 steps:
  - Step 1: Select goal and subjects with skill levels
  - Step 2: Choose available days
  - Step 3: Set group preferences
  - Step 4: Configure study behavior
- Click "Complete"

### 3. Find Study Partners
- On the dashboard, select a subject from the dropdown
- View recommended matches with compatibility scores
- Click "Why this match?" to see matching reasons
- Click "Create Group" to form a study group

### 4. Manage Groups
- View your groups in the right panel
- Click on a group to open the group dashboard
- Create sessions and tasks
- Join sessions to auto-mark attendance
- Mark tasks as complete

### 5. Evaluate Group Health
- In a group dashboard, click "Evaluate This Week"
- View attendance rate, task completion rate, and health status
- Groups with "At Risk" status for 3 consecutive weeks will auto-dissolve

## 🏗️ Project Structure

```
fullstack_project(BTS)/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   │   ├── Logo.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/             # React context
│   │   │   └── AuthContext.jsx
│   │   ├── pages/               # Page components
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Onboarding.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── GroupDashboard.jsx
│   │   │   └── Profile.jsx
│   │   ├── utils/               # Utilities
│   │   │   └── api.js
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env
│
├── server/                      # Express backend
│   ├── src/
│   │   ├── models/              # Mongoose models
│   │   │   ├── User.js
│   │   │   ├── Group.js
│   │   │   ├── Session.js
│   │   │   └── Task.js
│   │   ├── routes/              # API routes
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── match.js
│   │   │   ├── groups.js
│   │   │   └── sessions.js
│   │   ├── middleware/          # Middleware
│   │   │   └── auth.js
│   │   ├── utils/               # Utilities
│   │   │   └── matching.js
│   │   └── server.js            # Entry point
│   ├── package.json
│   └── .env
│
├── package.json                 # Root package for concurrently
└── README.md
```

## 🔑 Key Features Implemented

### Authentication & Authorization
- JWT-based authentication
- Protected routes
- Secure password hashing with bcrypt

### Smart Matching System
- Mock K-Means clustering (assigns study patterns)
- Mock compatibility scoring (weighted features)
- Top 3 recommendations with reasons
- Ready for ML model integration

### Group Management
- Create groups with matched partners
- Auto-attendance on session join
- Task management with per-member completion
- Weekly health evaluation
- Auto-dissolution after 3 at-risk weeks

### User Experience
- Professional teal/green theme
- Responsive design
- Clean white cards with shadows
- Logo on all pages
- Smooth transitions and hover states

## 🔧 Troubleshooting

### MongoDB Connection Issues
- Verify your connection string is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure database user has read/write permissions

### Port Already in Use
- Change PORT in `server/.env` to a different port (e.g., 5001)
- Update `VITE_API_URL` in `client/.env` accordingly

### Module Not Found Errors
- Delete `node_modules` folders in both client and server
- Run `npm install` again in both directories

### CORS Errors
- Ensure server is running on port 5000
- Check that `VITE_API_URL` in client/.env matches server URL

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Users
- `PUT /api/users/onboarding` - Complete onboarding (requires auth)
- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update profile (requires auth)

### Matching
- `GET /api/match/recommendations?subject=DSA` - Get study partner recommendations (requires auth)

### Groups
- `POST /api/groups` - Create group (requires auth)
- `GET /api/groups` - Get user's groups (requires auth)
- `GET /api/groups/:id` - Get group details (requires auth)
- `POST /api/groups/:id/sessions` - Create session (requires auth)
- `GET /api/groups/:id/sessions` - Get group sessions (requires auth)
- `POST /api/groups/:id/tasks` - Create task (requires auth)
- `GET /api/groups/:id/tasks` - Get group tasks (requires auth)
- `PUT /api/groups/:id/tasks/:taskId/complete` - Toggle task completion (requires auth)
- `POST /api/groups/:id/evaluate-week` - Evaluate weekly health (requires auth)

### Sessions
- `POST /api/sessions/:sessionId/join` - Join session and mark attendance (requires auth)

## 🎨 Design System

### Colors
- Primary (Teal): `#14b8a6` (primary-600)
- Accent (Green): `#22c55e` (accent-600)
- Background: Linear gradient from teal-50 to green-50

### Typography
- Headings: Bold, gray-900
- Body: Regular, gray-600
- Links: Primary-600 with hover states

### Components
- Cards: White background, rounded-xl, shadow-md
- Buttons: Rounded-lg, hover transitions
- Inputs: Border with focus ring

## 🚀 Production Deployment

### Backend (e.g., Heroku, Railway, Render)
1. Set environment variables in hosting platform
2. Ensure `NODE_ENV=production`
3. Update CORS settings if needed

### Frontend (e.g., Vercel, Netlify)
1. Build: `npm run build`
2. Set `VITE_API_URL` to production backend URL
3. Deploy `dist` folder

## 📝 License

MIT License - Feel free to use this project for learning and development.

## 🤝 Contributing

This is a complete production-ready application. Feel free to extend it with:
- Real ML models for clustering and scoring
- Video call integration
- Chat functionality
- Mobile app version
- Analytics dashboard
- Email notifications

---

**Built with ❤️ using React, Node.js, Express, MongoDB, and TailwindCSS**
