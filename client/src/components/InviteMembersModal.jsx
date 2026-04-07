import { useState, useEffect } from 'react';
import api from '../utils/api';

const InviteMembersModal = ({ group, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('recommended');
  const [recommended, setRecommended] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(null);

  useEffect(() => {
    if (isOpen && group) {
      loadRecommended();
      loadAllUsers();
      loadPendingInvites();
    }
  }, [isOpen, group]);

  const loadRecommended = async () => {
    try {
      setLoading(true);
      const res = await api.get('/match/recommendations');
      // Filter out existing members and pending invites
      const filtered = res.data.filter(u => {
        if (group.members.some(m => m._id === u.userId)) return false;
        if (pendingInvites.includes(u.userId)) return false;
        return true;
      }).slice(0, 3); // Take top 3
      setRecommended(filtered);
    } catch (err) {
      console.error('Failed to load recommended:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const res = await api.get('/users');
      setAllUsers(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadPendingInvites = async () => {
    try {
      const res = await api.get('/invites');
      const pending = res.data.sentInvites
        .filter(i => i.groupId === group._id && i.status === 'pending')
        .map(i => i.toUserId);
      setPendingInvites(pending);
    } catch (err) {
      console.error('Failed to load pending invites:', err);
    }
  };

  const inviteUser = async (userId) => {
    try {
      setInviting(userId);
      await api.post(`/groups/${group._id}/invite`, { toUserId: userId });
      setRecommended(prev => prev.filter(u => u._id !== userId));
      setAllUsers(prev => prev.filter(u => u._id !== userId));
      setPendingInvites(prev => [...prev, userId]);
    } catch (err) {
      console.error('Failed to invite user:', err);
    } finally {
      setInviting(null);
    }
  };

  const generateInviteLink = () => {
    // For now, just return a placeholder. In a real app, this would generate a unique invite code/link
    return `https://buddy-to-study.com/join/${group._id}`;
  };

  const filteredAllUsers = allUsers.filter(u => {
    if (group.members.some(m => m._id === u._id)) return false;
    if (pendingInvites.includes(u._id)) return false;
    if (searchTerm && !u.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredRecommended = recommended.filter(u => {
    if (group.members.some(m => m._id === u._id)) return false;
    if (pendingInvites.includes(u._id)) return false;
    return true;
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen || !group) return null;

  const memberCount = group.members?.length || 0;
  const schedule = group.schedule || {};
  const days = schedule.days?.join(', ') || 'Not set';
  const time = schedule.startTime || 'Not set';
  const duration = schedule.durationMinutes ? `${schedule.durationMinutes} min` : 'Not set';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Invite Members</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Group Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">{group.subject} Study Group</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Members:</span> {memberCount}/5
              </div>
              <div>
                <span className="font-medium">Schedule:</span> {days} at {time} ({duration})
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('recommended')}
                className={`px-4 py-2 rounded-t-lg font-medium ${
                  activeTab === 'recommended'
                    ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Recommended Matches
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-t-lg font-medium ${
                  activeTab === 'all'
                    ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => setActiveTab('link')}
                className={`px-4 py-2 rounded-t-lg font-medium ${
                  activeTab === 'link'
                    ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Invite Link
              </button>
            </div>
          </div>

          {/* Recommended Matches Tab */}
          {activeTab === 'recommended' && (
            <div>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading recommendations...</p>
                </div>
              ) : filteredRecommended.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No recommendations available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecommended.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-semibold">{user.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.cluster?.label || 'Student'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => inviteUser(user._id)}
                        disabled={inviting === user._id}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {inviting === user._id ? 'Inviting...' : 'Invite'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Users Tab */}
          {activeTab === 'all' && (
            <div>
              <div className="mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              {filteredAllUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No users found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAllUsers.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-semibold">{user.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.cluster?.label || 'Student'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => inviteUser(user._id)}
                        disabled={inviting === user._id}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {inviting === user._id ? 'Inviting...' : 'Invite'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Invite Link Tab */}
          {activeTab === 'link' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Invite Message Preview</h4>
                <p className="text-blue-800 text-sm">
                  "We are studying <strong>{group.subject}</strong> on <strong>{days}</strong> at <strong>{time}</strong> for <strong>{duration}</strong>. Join if interested."
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invite Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={generateInviteLink()}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <button
                      onClick={() => copyToClipboard(generateInviteLink())}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invite Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={group._id.slice(-8).toUpperCase()}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <button
                      onClick={() => copyToClipboard(group._id.slice(-8).toUpperCase())}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Copy Code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteMembersModal;