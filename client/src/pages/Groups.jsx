import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import api from '../utils/api';

const Groups = () => {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
    loadGroups();
  }, []);

  const loadUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (!subject.trim()) { setCreateError('Please enter a subject.'); return; }
    setCreating(true);
    setCreateError('');
    try {
      const res = await api.post('/groups', { subject: subject.trim(), members: [] });
      setGroups(prev => [res.data, ...prev]);
      setShowCreateModal(false);
      setSubject('');
      // Navigate directly to the new group
      navigate(`/app/groups/${res.data._id}`);
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create group. Try again.');
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Healthy') return 'bg-green-100 text-green-700';
    if (status === 'Warning') return 'bg-yellow-100 text-yellow-700';
    if (status === 'Dissolved') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-600';
  };

  const subjectSuggestions = [
    'DSA', 'Machine Learning', 'Web Development', 'DBMS', 'Operating Systems',
    'Computer Networks', 'Mathematics', 'Physics', 'Data Science', 'Python',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navbar user={user} />

      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Groups</h1>
              <p className="text-gray-500 mt-1 text-sm">{groups.length} group{groups.length !== 1 ? 's' : ''} joined</p>
            </div>
            <button
              onClick={() => { setShowCreateModal(true); setCreateError(''); setSubject(''); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-semibold shadow-md text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Group
            </button>
          </div>

          {/* Groups Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.length > 0 ? (
              groups.map((group) => {
                const latestHealth = group.weeklyHealthHistory?.[group.weeklyHealthHistory.length - 1];
                const status = group.isDissolved ? 'Dissolved' : latestHealth?.status || 'Healthy';

                return (
                  <div
                    key={group._id}
                    onClick={() => !group.isDissolved && navigate(`/app/groups/${group._id}`)}
                    className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition group
                      ${group.isDissolved ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary-200'}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-accent-400 rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-xl">{group.subject.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-700 transition">
                      {group.subject} Study Group
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">{group.members?.length || 0}/5 members</p>

                    <div className="flex items-center gap-1.5">
                      {group.members?.slice(0, 4).map(member => (
                        <Avatar key={member._id} user={member} size="xs" />
                      ))}
                      {group.members?.length > 4 && (
                        <span className="text-xs text-gray-500 ml-1">+{group.members.length - 4}</span>
                      )}
                    </div>

                    {group.atRiskStreak > 0 && !group.isDissolved && (
                      <p className="text-xs text-red-600 font-medium mt-3">
                        At-Risk: {group.atRiskStreak}/3 weeks
                      </p>
                    )}

                    {latestHealth && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                        <span>Attendance: <strong className="text-gray-700">{Math.round(latestHealth.attendanceRate * 100)}%</strong></span>
                        <span>Tasks: <strong className="text-gray-700">{Math.round(latestHealth.taskCompletionRate * 100)}%</strong></span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full">
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">No groups yet</h3>
                  <p className="text-sm text-gray-400 mb-6">Create your first group or accept an invite from a study buddy.</p>
                  <button
                    onClick={() => { setShowCreateModal(true); setCreateError(''); setSubject(''); }}
                    className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-semibold text-sm"
                  >
                    Create Your First Group
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary-600 to-accent-500 rounded-t-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Create Study Group</h3>
                  <p className="text-white/70 text-sm mt-0.5">Start a new group and invite your study buddies</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={createGroup} className="p-5 space-y-4">
              {/* Subject input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Subject / Topic <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => { setSubject(e.target.value); setCreateError(''); }}
                  placeholder="e.g. DSA, Machine Learning, Web Dev..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  autoFocus
                />
              </div>

              {/* Quick subject suggestions */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Quick select:</p>
                <div className="flex flex-wrap gap-2">
                  {subjectSuggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setSubject(s); setCreateError(''); }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition border
                        ${subject === s
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info note */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2.5">
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-600 leading-relaxed">
                  You'll be added as the first member. After creating, you can invite study buddies from your Dashboard.
                </p>
              </div>

              {/* Error */}
              {createError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {createError}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !subject.trim()}
                  className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating...
                    </>
                  ) : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
