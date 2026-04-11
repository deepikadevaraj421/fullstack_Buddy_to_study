import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Notifications from './pages/Notifications';
import Groups from './pages/Groups';
import GroupDashboard from './pages/GroupDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="/app/notifications" element={<Notifications />} />
        <Route path="/app/groups" element={<Groups />} />
        <Route path="/app/groups/:id" element={<GroupDashboard />} />
        <Route path="/app/admin" element={<AdminDashboard />} />
        <Route path="/app/profile" element={<Profile />} />
        <Route path="/app/analytics" element={<Analytics />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
