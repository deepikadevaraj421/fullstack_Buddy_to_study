import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import InviteModal from '../components/InviteModal';
import api from '../utils/api';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [allSubjects, setAllSubjects] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [analytics, setAnalytics] = useState({ sessionsThisWeek: 0, attendanceRate: 0, activityScore: 0 });
  const [insights, setInsights] = useState([]);
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [inviteeProfile, setInviteeProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const navigate = useNavigate();

  const DUMMY_RECOMMENDATIONS = [
    { userId: 'd1', name: 'Alice Johnson', clusterLabel: 'Consistent Planner', skillLevel: 'Advanced', compatibilityScore: 92, overlapPct: 75, subject: 'DSA', reasons: ['Same study pattern', 'Complementary skill levels', '75% schedule overlap'] },
    { userId: 'd2', name: 'Bob Smith', clusterLabel: 'Night Owl', skillLevel: 'Intermediate', compatibilityScore: 85, overlapPct: 60, subject: 'DBMS', reasons: ['Similar commitment level', '60% schedule overlap', 'Complementary skill levels'] },
    { userId: 'd3', name: 'Carol Davis', clusterLabel: 'Weekend Warrior', skillLevel: 'Advanced', compatibilityScore: 78, overlapPct: 50, subject: 'Machine Learning', reasons: ['Complementary skill levels', '50% schedule overlap', 'Basic compatibility'] },
    { userId: 'd4', name: 'David Lee', clusterLabel: 'Balanced Learner', skillLevel: 'Intermediate', compatibilityScore: 74, overlapPct: 65, subject: 'Web Dev', reasons: ['65% schedule overlap', 'Similar commitment level'] },
    { userId: 'd5', name: 'Emma Wilson', clusterLabel: 'Casual Learner', skillLevel: 'Advanced', compatibilityScore: 70, overlapPct: 45, subject: 'OS', reasons: ['Complementary skill levels', 'Basic compatibility'] },
    { userId: 'd6', name: 'Frank Miller', clusterLabel: 'Sprint Learner', skillLevel: 'Beginner', compatibilityScore: 66, overlapPct: 55, subject: 'Math', reasons: ['55% schedule overlap', 'Basic compatibility'] },
  ];

  useEffect(() => {
    loadUser();
    loadGroups();
    loadUpcomingSessions();
    loadAnalytics();
    loadRecommendationsOnMount();
    loadInsights();
  }, []);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [selectedSubject, user]);

  const loadUser = async () => {
    try {
      const res = await api.get('/auth/me');
      console.log('User loaded:', res.data);
      console.log('User subjects:', res.data.subjects);
      setUser(res.data);
    } catch (err) {
      console.error('Failed to load user:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  const loadRecommendationsOnMount = async () => {
    try {
      const usersRes = await api.get('/users');
      const allUsers = usersRes.data.map(u => ({
        userId: u._id,
        name: u.name,
        clusterLabel: u.cluster?.label || 'Not assigned',
        skillLevel: u.subjects?.[0]?.skill || 'N/A',
        compatibilityScore: 85,
        overlapPct: 70,
        reasons: ['Available for study sessions', 'Similar study patterns', 'Good skill match']
      }));
      // Use real users if available, else dummy
      setAllMatches(allUsers.length > 0 ? allUsers : DUMMY_RECOMMENDATIONS);

      // Collect all unique subjects from all users
      const subjectSet = new Set();
      usersRes.data.forEach(u => u.subjects?.forEach(s => subjectSet.add(s.name)));
      // Also add dummy subjects
      DUMMY_RECOMMENDATIONS.forEach(d => subjectSet.add(d.subject));
      setAllSubjects([...subjectSet].sort());

      await loadRecommendations();
    } catch (err) {
      console.error('Failed to load users:', err);
      setAllMatches(DUMMY_RECOMMENDATIONS);
      setRecommendations(DUMMY_RECOMMENDATIONS.slice(0, 3));
      // Fallback: use dummy subjects
      setAllSubjects([...new Set(DUMMY_RECOMMENDATIONS.map(d => d.subject))].sort());
    }
  };

  const loadRecommendations = async () => {
    try {
      const url = selectedSubject
        ? `/match/recommendations?subject=${selectedSubject}`
        : '/match/recommendations';
      const res = await api.get(url);
      if (res.data.length > 0) {
        setRecommendations(res.data);
      } else {
        // Filter dummy by subject if selected
        const filtered = selectedSubject
          ? DUMMY_RECOMMENDATIONS.filter(d => d.subject === selectedSubject)
          : DUMMY_RECOMMENDATIONS.slice(0, 3);
        setRecommendations(filtered.length > 0 ? filtered : DUMMY_RECOMMENDATIONS.slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      const filtered = selectedSubject
        ? DUMMY_RECOMMENDATIONS.filter(d => d.subject === selectedSubject)
        : DUMMY_RECOMMENDATIONS.slice(0, 3);
      setRecommendations(filtered.length > 0 ? filtered : DUMMY_RECOMMENDATIONS.slice(0, 3));
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

  const loadUpcomingSessions = async () => {
    try {
      console.log('📅 Fetching upcoming sessions...');
      const res = await api.get('/sessions/upcoming');
      console.log('✅ Sessions loaded:', res.data);
      setUpcomingSessions(res.data.slice(0, 3));
    } catch (err) {
      console.error('❌ Error loading sessions:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const res = await api.get('/users/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadInsights = async () => {
    try {
      const res = await api.get('/match/insights');
      setInsights(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewProfile = async (match) => {
    try {
      const res = await api.get(`/users/${match.userId}`);
      setSelectedProfile(res.data);
      setShowProfileModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvite = async (match) => {
    setSelectedMatch(match);
    setInviteeProfile(null);
    // Fetch full profile if it's a real user (not dummy)
    if (match.userId && !match.userId.toString().startsWith('d')) {
      try {
        const res = await api.get(`/users/${match.userId}`);
        setInviteeProfile(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    setShowInviteModal(true);
  };

  const createGroup = async () => {
    // Removed - now handled by invite system
  };

  const joinSession = async (sessionId) => {
    try {
      await api.post(`/sessions/${sessionId}/join`);
      alert('Attendance marked!');
      loadUpcomingSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-orange-100 text-orange-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navbar user={user} />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Dashboard</h1>

          {/* Behavior Cluster Card */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-medium text-gray-600">Your Behavior Cluster</h2>
              <div className="group relative">
                <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="hidden group-hover:block absolute left-0 top-6 bg-gray-800 text-white text-xs rounded p-2 w-48 z-10">
                  Based on your onboarding + recent activity
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold text-primary-600 mb-1">
                  {user?.cluster?.label || 'Not assigned'}
                </h3>
                <p className="text-gray-600">Confidence: {user?.cluster?.confidence || 0}%</p>
                <p className="text-sm text-gray-500 mt-2">
                  {user?.cluster?.label === 'Consistent Planner' && 'You prefer regular study sessions with high commitment and structured planning.'}
                  {user?.cluster?.label === 'Night Owl' && 'You study best during late night hours with focused sessions.'}
                  {user?.cluster?.label === 'Sprint Learner' && 'You prefer intense study bursts with high commitment but less frequency.'}
                  {user?.cluster?.label === 'Weekend Warrior' && 'You maximize weekend study time with longer sessions.'}
                  {user?.cluster?.label === 'Casual Learner' && 'You prefer flexible, low-pressure study sessions.'}
                </p>
              </div>
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Personal Analytics */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Sessions This Week</h3>
              <p className="text-3xl font-bold text-gray-900">{analytics.sessionsThisWeek}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Attendance Rate</h3>
              <p className="text-3xl font-bold text-accent-600">{analytics.attendanceRate}%</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Activity Score</h3>
              <p className="text-3xl font-bold text-primary-600">{analytics.activityScore}/10</p>
            </div>
          </div>

          {/* DS-Powered Insights */}
          {insights.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🧠</span>
                <h2 className="text-xl font-bold text-gray-900">Study Insights</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                    <span className="text-2xl flex-shrink-0">{insight.icon}</span>
                    <p className="text-sm text-gray-700">{insight.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-1 gap-8">
            {/* Recommended Matches - Top 3 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recommended Matches</h2>
                  <p className="text-sm text-gray-600 mt-1">Top 3 study buddies from your network</p>
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor="subject-select" className="text-sm font-medium text-gray-700">Filter by subject:</label>
                  <select
                    id="subject-select"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  >
                    <option value="">All subjects</option>
                    {allSubjects.map((subject, idx) => (
                      <option key={idx} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </div>

              {recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((match, idx) => (
                    <div key={match.userId} className="border border-gray-200 rounded-lg p-5 hover:border-primary-300 transition">
                      <div className="flex items-start gap-4">
                        {/* Identity Block */}
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xl">
                              {match.name.charAt(0)}
                            </span>
                          </div>
                        </div>

                        {/* Compatibility Details */}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{match.name}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              {match.skillLevel} in {match.subject || selectedSubject || 'Study'}
                            </span>
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                              {match.clusterLabel}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                              {match.overlapPct}% schedule overlap
                            </span>
                          </div>
                          {/* Cluster behavior description */}
                          <div className="mt-2 text-xs text-gray-600">
                            {match.clusterLabel === 'Consistent Planner' && '📅 Regular study schedule with high commitment'}
                            {match.clusterLabel === 'Night Owl' && '🦉 Prefers late-night study sessions'}
                            {match.clusterLabel === 'Weekend Warrior' && '🎯 Maximizes weekend study time'}
                            {match.clusterLabel === 'Sprint Learner' && '⚡ Intense study bursts with focus'}
                            {match.clusterLabel === 'Casual Learner' && '😌 Flexible, low-pressure learning'}
                            {match.clusterLabel === 'Balanced Learner' && '⚖️ Steady, well-rounded approach'}
                            {!['Consistent Planner', 'Night Owl', 'Weekend Warrior', 'Sprint Learner', 'Casual Learner', 'Balanced Learner'].includes(match.clusterLabel) && '🤔 Learning style analysis in progress'}
                          </div>
                        </div>

                        {/* Score + CTA */}
                        <div className="flex-shrink-0 text-right">
                          <div className={`inline-block px-4 py-2 rounded-full font-bold text-lg mb-3 ${getScoreColor(match.compatibilityScore)}`}>
                            {match.compatibilityScore}/100
                          </div>
                          <button
                            onClick={() => handleInvite(match)}
                            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium text-sm"
                          >
                            Invite
                          </button>
                        </div>
                      </div>

                      {/* Why this match? */}
                      <div className="mt-4">
                        <button
                          onClick={() => setExpandedMatch(expandedMatch === match.userId ? null : match.userId)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                        >
                          {expandedMatch === match.userId ? '▼' : '▶'} Why this match?
                        </button>
                        
                        {expandedMatch === match.userId && (
                          <ul className="mt-3 space-y-2 bg-gray-50 rounded-lg p-4">
                            {match.reasons.map((reason, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-green-600 font-bold">✓</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 font-medium">No recommendations available</p>
                </div>
              )}
            </div>

            {/* All Matches */}
            {allMatches.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">All Matches</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allMatches.map((match) => (
                    <div key={match.userId} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition cursor-pointer" onClick={() => handleViewProfile(match)}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-semibold">
                            {match.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{match.name}</h3>
                          <p className="text-xs text-gray-600">{match.clusterLabel}</p>
                        </div>
                      </div>
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                        {match.skillLevel}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mt-8">
              {/* Upcoming Sessions */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Upcoming Sessions</h2>
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSessions.map((session) => (
                      <div key={session._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition">
                        <div>
                          <p className="font-semibold text-gray-900">{session.groupName}</p>
                          <p className="text-sm text-gray-600">
                            🕐 {new Date(session.startTime).toLocaleString()} • {session.durationMinutes} min
                          </p>
                        </div>
                        <button
                          onClick={() => joinSession(session._id)}
                          className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition font-medium text-sm"
                        >
                          Join
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">No upcoming sessions</p>
                    <p className="text-xs text-gray-400">Sessions you're invited to will appear here</p>
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{selectedProfile.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedProfile.name}</h3>
                  <p className="text-gray-600">{selectedProfile.email}</p>
                </div>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Behavior Cluster</h4>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">{selectedProfile.cluster?.label || 'Not assigned'}</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Subjects & Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.subjects?.map((sub, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{sub.name} - {sub.skill}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => { handleInvite({ userId: selectedProfile._id, name: selectedProfile.name }); setShowProfileModal(false); }} className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold">Send Invite</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && selectedMatch && (
        <InviteModal
          isOpen={showInviteModal}
          invitee={selectedMatch}
          inviteeProfile={inviteeProfile}
          currentUser={user}
          subject={selectedSubject}
          onClose={() => setShowInviteModal(false)}
          onSendInvite={async (payload) => {
            try {
              // Transform payload from InviteModal format to API format
              const apiPayload = {
                toUserId: payload.inviteeId,
                subject: selectedSubject || 'Study',
                groupName: payload.groupName,
                proposedSchedule: payload.proposedSchedules,
                message: payload.message
              };
              await api.post('/invites', apiPayload);
              alert(`Invite sent to ${selectedMatch.name}!`);
              setShowInviteModal(false);
            } catch (err) {
              console.error(err);
              alert(err.response?.data?.error || 'Failed to send invite');
            }
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
