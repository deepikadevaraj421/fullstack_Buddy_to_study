# Buddy_to_study - Smart Peer Study Group Matcher

![Status](https://img.shields.io/badge/status-production--ready-green)
![License](https://img.shields.io/badge/license-MIT-blue)

A production-quality full-stack web application that solves the problem of unreliable study groups by matching students using AI-powered behavior clustering and compatibility scoring.

## 🎯 Problem Statement

Students struggle to find reliable study partners. Random WhatsApp groups fail because:
- Members have different study habits
- Inconsistent attendance
- Mismatched skill levels
- Low productivity and high dropout rates

## ✨ Solution

**Buddy_to_study** uses smart algorithms to form effective study groups:

1. **Behavior Clustering (K-Means)** - Groups students by study patterns:
   - Consistent Planner
   - Night Owl
   - Sprint Learner
   - Balanced Learner
   - Casual Learner

2. **Compatibility Scoring (Logistic Regression)** - Ranks matches using:
   - Availability overlap
   - Skill balance
   - Engagement similarity
   - Commitment level

3. **Auto-Management**:
   - Sessions with auto-attendance on join
   - Task tracking with per-member completion
   - Weekly group health scores
   - Auto-dissolution of at-risk groups (3 weeks)

## 🚀 Tech Stack

**Frontend:**
- React 18 with Vite
- TailwindCSS (Teal/Green theme)
- React Router v6
- Axios for API calls

**Backend:**
- Node.js + Express
- MongoDB Atlas + Mongoose
- JWT Authentication
- bcrypt for password hashing

**Dev Tools:**
- Concurrently for parallel dev servers
- dotenv for environment variables
- Express Validator

## 📦 Quick Setup

### Prerequisites
- Node.js v16 or higher
- MongoDB Atlas account (free tier works)

### Option 1: Automated Setup (Windows)

```bash
setup.bat
```

Then edit `server\.env` with your MongoDB credentials and run:
```bash
npm run dev
```

### Option 2: Manual Setup

```bash
# Install all dependencies
cd server && npm install
cd ../client && npm install
cd .. && npm install

# Configure MongoDB
# Edit server/.env and add your MongoDB URI

# Run the app
npm run dev
```

### Access the Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api/health

## 📖 Detailed Documentation

For complete setup instructions, troubleshooting, and API documentation, see [SETUP.md](SETUP.md)

## API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/users/onboarding` - Complete onboarding
- `GET /api/match/recommendations` - Get study partner recommendations
- `POST /api/groups` - Create study group
- `GET /api/groups` - Get user's groups
- `POST /api/sessions/:sessionId/join` - Join session (auto-attendance)
- `POST /api/groups/:id/tasks` - Add task
- `POST /api/groups/:id/evaluate-week` - Evaluate weekly health

## Project Structure
```
client/src/
├── components/     # Reusable UI components
├── pages/          # Route pages
├── context/        # Auth context
├── utils/          # API utilities
└── App.jsx         # Main app component

server/src/
├── models/         # Mongoose schemas
├── routes/         # Express routes
├── middleware/     # Auth middleware
├── utils/          # Matching logic
└── server.js       # Entry point
```

## License
MIT
