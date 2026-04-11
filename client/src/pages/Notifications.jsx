import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const Notifications = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
    loadNotifications();
  }, []);

  useEffect(() => {
    const handleNotificationUpdate = () => {
      loadNotifications();
    };

    window.addEventListener('notificationUpdate', handleNotificationUpdate);
    return () => window.removeEventListener('notificationUpdate', handleNotificationUpdate);
  }, []);

  const loadUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadNotifications = async () => {
    try {
      // Mark all as read when page is opened
      await api.put('/notifications/read-all').catch(() => {});
      window.dispatchEvent(new Event('notificationUpdate'));

      const [dbRes, invitesRes, sessionsRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/invites'),
        api.get('/sessions/upcoming')
      ]);

      // Map invites by id for quick lookup
      const inviteMap = {};
      invitesRes.data.receivedInvites.forEach(inv => { inviteMap[inv._id] = inv; });

      // DB notifications — attach invite object if it's a group_invite
      const dbNotifications = dbRes.data.map(n => ({
        ...n,
        isDbNotification: true,
        invite: n.type === 'group_invite' && n.inviteId ? inviteMap[n.inviteId] : null
      })).filter(n => {
        // Hide group_invite DB notifications whose invite is already responded
        if (n.type === 'group_invite') return n.invite != null;
        return true;
      });

      // Session reminders (within 1 hour)
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const sessionReminders = sessionsRes.data
        .filter(s => { const t = new Date(s.startTime); return t > now && t <= oneHourLater; })
        .map(s => ({
          _id: `session-${s._id}`,
          type: 'session_reminder',
          message: `Session "${s.groupName}" starts in less than 1 hour!`,
          createdAt: s.startTime,
          sessionId: s._id
        }));

      setNotifications([...dbNotifications, ...sessionReminders]);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleAcceptInvite = async (invite, scheduleIndex = 0) => {
    try {
      const res = await api.post(`/invites/${invite._id}/accept`, { selectedScheduleIndex: scheduleIndex });
      loadNotifications();
      alert('Group created!');
      navigate(`/app/groups/${res.data.group._id}`);
    } catch (err) {
      console.error('Accept error:', err);
      alert(err.response?.data?.error || 'Failed to accept invite');
    }
  };

  const handleRejectInvite = async (invite) => {
    try {
      await api.post(`/invites/${invite._id}/decline`);
      loadNotifications();
      alert('Invite declined');
    } catch (err) {
      console.error('Reject error:', err);
      alert(err.response?.data?.error || 'Failed to decline invite');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navbar user={user} />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Notifications</h1>

          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div key={notif._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {notif.type === 'session_reminder' && (
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                      {notif.type === 'group_invite' && (
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      )}
                      {notif.type === 'session_join' && (
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium mb-2">{notif.message}</p>
                      <p className="text-sm text-gray-500">{new Date(notif.createdAt).toLocaleString()}</p>
                      
                      {/* Show schedule for invites */}
                      {notif.type === 'group_invite' && notif.invite && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                          <p className="font-medium mb-1">Proposed Schedule:</p>
                          {notif.invite.proposedSchedule.map((schedule, idx) => (
                            <div key={idx} className="text-gray-600">
                              <p>• {schedule.days.join(', ')} at {schedule.startTime} ({schedule.durationMinutes} min)</p>
                            </div>
                          ))}
                          {notif.invite.message && (
                            <p className="mt-2 text-gray-600 italic">"{notif.invite.message}"</p>
                          )}
                        </div>
                      )}
                      
                      {/* Actions */}
                      {notif.type === 'group_invite' && (
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => handleAcceptInvite(notif.invite)}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectInvite(notif.invite)}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      
                      {notif.type === 'session_reminder' && (
                        <button
                          onClick={() => navigate('/app')}
                          className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
                        >
                          View Session
                        </button>
                      )}
                    </div>

                    {/* Delete Button */}
                    {notif.type !== 'group_invite' && notif.isDbNotification && (
                      <button
                        onClick={() => handleDeleteNotification(notif._id)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-gray-600 font-medium">No notifications</p>
              <p className="text-sm text-gray-500 mt-2">You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
