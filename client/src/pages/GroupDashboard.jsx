import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import CommunicationTab from '../components/CommunicationTab';
import InviteMembersModal from '../components/InviteMembersModal';
import api from '../utils/api';

const GroupDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [group, setGroup] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    loadGroup();
    loadUser();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'sessions' && group) {
      loadSessions();
    }
    if (activeTab === 'tasks' && group) {
      loadTasks();
    }
  }, [activeTab, group]);

  const loadGroup = async () => {
    try {
      setError(null);
      const res = await api.get(`/groups/${id}`);
      setGroup(res.data);
    } catch (err) {
      console.error('Failed to load group:', err);
      if (err.response?.status === 404) {
        setError('Group not found');
      } else if (err.response?.status === 401) {
        setError('You are not authorized to view this group');
      } else {
        setError('Failed to load group. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const loadSessions = async () => {
    try {
      const res = await api.get(`/groups/${id}/sessions`);
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const loadTasks = async () => {
    try {
      const res = await api.get(`/groups/${id}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const createTask = async (taskData) => {
    try {
      const res = await api.post(`/groups/${id}/tasks`, taskData);
      setTasks(prev => [res.data, ...prev]);
      setShowTaskModal(false);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const toggleTaskCompletion = async (taskId) => {
    try {
      const res = await api.put(`/groups/${id}/tasks/${taskId}/complete`);
      setTasks(prev => prev.map(task => 
        task._id === taskId ? res.data : task
      ));
      // Trigger notification reload in navbar
      window.dispatchEvent(new Event('notificationUpdate'));
    } catch (err) {
      console.error('Failed to toggle task completion:', err);
    }
  };

  const createSession = async (sessionData) => {
    try {
      const res = await api.post(`/groups/${id}/sessions`, sessionData);
      setSessions(prev => [res.data, ...prev]);
      setShowSessionModal(false);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const joinSession = async (sessionId) => {
    try {
      const res = await api.post(`/sessions/${sessionId}/join`);
      setSessions(prev => prev.map(s => s._id === sessionId ? res.data.session : s));
      // Trigger notification reload in navbar
      window.dispatchEvent(new Event('notificationUpdate'));
    } catch (err) {
      console.error('Failed to join session:', err);
    }
  };

  if (loading || !group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
        <Navbar user={user} />
        <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {error ? (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                  <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Group</h3>
                  <p className="text-red-700">{error}</p>
                  <button
                    onClick={() => window.history.back()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading group...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const latestHealth = group.weeklyHealthHistory?.[group.weeklyHealthHistory.length - 1];
  const status = group.isDissolved ? 'Dissolved' : latestHealth?.status || 'Healthy';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navbar user={user} />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Dissolved Banner */}
          {group.isDissolved && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-800">Group Dissolved</h3>
                  <p className="text-sm text-red-700">This group was auto-dissolved due to low health for 3 consecutive weeks.</p>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.subject} Study Group</h1>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  status === 'Healthy' ? 'bg-green-100 text-green-700' :
                  status === 'Warning' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">At-Risk Streak</p>
                <p className="text-2xl font-bold text-gray-900">{group.atRiskStreak}/3</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Members</p>
                  <p className="text-lg font-semibold text-gray-900">{group.members.length}/5</p>
                </div>
                {group.members.length < 5 && !group.isDissolved && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                  >
                    Invite Members
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {group.members.map((member) => (
                  <div key={member._id} title={member.name}>
                    <Avatar user={member} size="sm" />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                {group.members.map(member => member.name).join(', ')}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-md mb-6">
            <div className="border-b border-gray-200">
              <div className="flex gap-1 p-2">
{['dashboard', 'sessions', 'tasks', 'progress', 'communication'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 rounded-lg font-medium transition capitalize ${
                      activeTab === tab
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab === 'communication' ? 'Communication' : tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'dashboard' && (
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Attendance Rate</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {latestHealth ? `${Math.round(latestHealth.attendanceRate * 100)}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Task Completion</h3>
                    <p className="text-3xl font-bold text-blue-600">
                      {latestHealth ? `${Math.round(latestHealth.taskCompletionRate * 100)}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-primary-50 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Health Score</h3>
                    <p className="text-3xl font-bold text-primary-600">
                      {latestHealth ? `${latestHealth.score}/100` : 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'sessions' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Sessions</h2>
                    <button
                      onClick={() => setShowSessionModal(true)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                    >
                      + New Session
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {sessions.length === 0 ? (
                      <p className="text-gray-600 text-center py-8">No sessions yet. Create your first session!</p>
                    ) : (
                      sessions.map((session) => {
                        const attendanceCount = session.attendance.filter(a => a.status === 'present').length;
                        const totalMembers = group.members.length;
                        const hasJoined = session.attendance.some(a => a.userId._id === user?._id && a.status === 'present');
                        
                        return (
                          <div key={session._id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  Study Session - {new Date(session.startTime).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.durationMinutes} minutes
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Attendance: {attendanceCount}/{totalMembers} members
                                </p>
                              </div>
                              <button
                                onClick={() => joinSession(session._id)}
                                disabled={hasJoined}
                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                  hasJoined
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : 'bg-accent-600 text-white hover:bg-accent-700'
                                }`}
                              >
                                {hasJoined ? 'Joined' : 'Join'}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Tasks</h2>
                    <button
                      onClick={() => setShowTaskModal(true)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                    >
                      + Add Task
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {tasks.length === 0 ? (
                      <p className="text-gray-600 text-center py-8">No tasks yet. Create your first task!</p>
                    ) : (
                      tasks.map((task) => {
                        const completedCount = task.completion.filter(c => c.done).length;
                        const totalMembers = task.completion.length;
                        const userCompletion = task.completion.find(c => c.userId._id === user?._id);
                        const isCompleted = userCompletion?.done || false;
                        
                        return (
                          <div key={task._id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{task.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  Created by {task.createdBy.name} • Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                </p>
                              </div>
                              <button
                                onClick={() => toggleTaskCompletion(task._id)}
                                className={`px-3 py-1 rounded text-sm font-medium transition ${
                                  isCompleted
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {isCompleted ? '✓ Done' : 'Mark Done'}
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-accent-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${totalMembers > 0 ? (completedCount / totalMembers) * 100 : 0}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{completedCount}/{totalMembers} completed</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'progress' && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Weekly Health History</h3>
                    <div className="space-y-3">
                      {group.weeklyHealthHistory && group.weeklyHealthHistory.length > 0 ? (
                        group.weeklyHealthHistory.slice(-3).reverse().map((health, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-900">
                              {new Date(health.weekStart).toLocaleDateString()}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              health.status === 'Healthy' ? 'bg-green-100 text-green-700' :
                              health.status === 'Warning' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {health.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600 text-center py-4">No health history available yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'communication' && (
                <CommunicationTab group={group} user={user} refreshGroup={loadGroup} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Task</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const title = formData.get('title');
              const dueDate = formData.get('dueDate') || null;
              if (title.trim()) {
                createTask({ title: title.trim(), dueDate });
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date (Optional)</label>
                  <input
                    name="dueDate"
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Session</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const startTime = new Date(formData.get('startTime'));
              const durationMinutes = parseInt(formData.get('durationMinutes')) || 60;
              createSession({ startTime, durationMinutes });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    name="durationMinutes"
                    defaultValue={60}
                    min={15}
                    max={480}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowSessionModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                  >
                    Create Session
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Invite Members Modal */}
      <InviteMembersModal
        group={group}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
};

export default GroupDashboard;
