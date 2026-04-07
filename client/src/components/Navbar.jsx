import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../utils/api';

const Navbar = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    const handleNotificationUpdate = () => {
      if (user) {
        loadNotifications();
      }
    };

    window.addEventListener('notificationUpdate', handleNotificationUpdate);
    return () => window.removeEventListener('notificationUpdate', handleNotificationUpdate);
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const sessionsRes = await api.get('/sessions/upcoming');
      
      // Add session reminders for sessions starting within 1 hour
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      const sessionReminders = sessionsRes.data
        .filter(session => {
          const sessionTime = new Date(session.startTime);
          return sessionTime > now && sessionTime <= oneHourLater;
        })
        .map(session => ({
          _id: `session-${session._id}`,
          type: 'session_reminder',
          message: `Session "${session.groupName}" starts in less than 1 hour!`,
          createdAt: session.startTime,
          sessionId: session._id
        }));
      
      setNotifications([...sessionReminders, ...res.data]);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleAcceptInvite = async (notificationId, inviteId) => {
    try {
      await api.post(`/invites/${inviteId}/accept`);
      await api.delete(`/notifications/${notificationId}`);
      loadNotifications();
      alert('Invite accepted! Group created.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectInvite = async (notificationId, inviteId) => {
    try {
      await api.post(`/invites/${inviteId}/reject`);
      await api.delete(`/notifications/${notificationId}`);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/app" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-xl font-bold text-gray-800">Buddy_to_study</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/app"
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  isActive('/app')
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/app/groups"
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  isActive('/app/groups')
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Groups
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/app/admin"
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    isActive('/app/admin')
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => navigate('/app/notifications')}
                className="relative p-2 rounded-lg hover:bg-gray-50 transition"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>

            <Link
              to="/app/profile"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-semibold text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user?.name || 'User'}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
