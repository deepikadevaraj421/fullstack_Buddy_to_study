import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import InviteModal from '../components/InviteModal';
import Achievements from '../components/Achievements';
import api from '../utils/api';

const DUMMY_RECOMMENDATIONS = [
  { userId: 'd1', name: 'Alice Johnson', clusterLabel: 'Consistent Planner', skillLevel: 'Advanced', compatibilityScore: 92, overlapPct: 75, subject: 'DSA', reasons: ['Same study pattern', 'Complementary skill levels', '75% schedule overlap'] },
  { userId: 'd2', name: 'Bob Smith', clusterLabel: 'Night Owl', skillLevel: 'Intermediate', compatibilityScore: 85, overlapPct: 60, subject: 'DBMS', reasons: ['Similar commitment level', '60% schedule overlap', 'Complementary skill levels'] },
  { userId: 'd3', name: 'Carol Davis', clusterLabel: 'Weekend Warrior', skillLevel: 'Advanced', compatibilityScore: 78, overlapPct: 50, subject: 'Machine Learning', reasons: ['Complementary skill levels', '50% schedule overlap'] },
  { userId: 'd4', name: 'David Lee', clusterLabel: 'Balanced Learner', skillLevel: 'Intermediate', compatibilityScore: 74, overlapPct: 65, subject: 'Web Dev', reasons: ['65% schedule overlap', 'Similar commitment level'] },
  { userId: 'd5', name: 'Emma Wilson', clusterLabel: 'Casual Learner', skillLevel: 'Advanced', compatibilityScore: 70, overlapPct: 45, subject: 'OS', reasons: ['Complementary skill levels'] },
  { userId: 'd6', name: 'Frank Miller', clusterLabel: 'Sprint Learner', skillLevel: 'Beginner', compatibilityScore: 66, overlapPct: 55, subject: 'Math', reasons: ['55% schedule overlap'] },
];

const clusterColors = {
  'Consistent Planner': 'bg-gray-100 text-gray-700',
  'Night Owl': 'bg-gray-100 text-gray-700',
  'Weekend Warrior': 'bg-gray-100 text-gray-700',
  'Sprint Learner': 'bg-gray-100 text-gray-700',
  'Casual Learner': 'bg-gray-100 text-gray-700',
  'Balanced Learner': 'bg-gray-100 text-gray-700',
};

const clusterDesc = {
  'Consistent Planner': 'Regular schedule, high commitment and structured planning.',
  'Night Owl': 'Study best during late night hours with focused sessions.',
  'Sprint Learner': 'Intense study bursts with high commitment.',
  'Weekend Warrior': 'Maximize weekend study time with longer sessions.',
  'Casual Learner': 'Flexible, low-pressure study sessions.',
  'Balanced Learner': 'Steady, well-rounded study approach.',
};

const ScoreBadge = ({ score }) => {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-yellow-400' : 'bg-gray-400';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Low';
  return (
    <div className="flex flex-col items-center">
      <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center shadow`}>
        <span className="text-white font-bold text-base">{score}</span>
      </div>
      <span className="text-sm text-gray-500 mt-1 font-medium">{label}</span>
    </div>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [allSubjects, setAllSubjects] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [analytics, setAnalytics] = useState({ sessionsThisWeek: 0, attendanceRate: 0, activityScore: 0 });
  const [insights, setInsights] = useState([]);
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [inviteeProfile, setInviteeProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [joinedSessions, setJoinedSessions] = useState(new Set());
  const [sessionJoinStatus, setSessionJoinStatus] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
    loadUpcomingSessions();
    loadAnalytics();
    loadRecommendationsOnMount();
    loadInsights();
  }, []);

  useEffect(() => { if (user) loadRecommendations(); }, [selectedSubject, user]);

  const loadUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem('token'); navigate('/login'); }
    }
  };

  const loadRecommendationsOnMount = async () => {
    try {
      const usersRes = await api.get('/users');
      const allUsers = usersRes.data.map(u => ({
        userId: u._id, name: u.name, profilePicture: u.profilePicture || '',
        clusterLabel: u.cluster?.label || 'Not assigned',
        skillLevel: u.subjects?.[0]?.skill || 'N/A',
        compatibilityScore: 85, overlapPct: 70,
        reasons: ['Available for study sessions', 'Similar study patterns', 'Good skill match']
      }));
      setAllMatches(allUsers.length > 0 ? allUsers : DUMMY_RECOMMENDATIONS);
      const subjectSet = new Set();
      usersRes.data.forEach(u => u.subjects?.forEach(s => subjectSet.add(s.name)));
      DUMMY_RECOMMENDATIONS.forEach(d => subjectSet.add(d.subject));
      setAllSubjects([...subjectSet].sort());
      await loadRecommendations();
    } catch {
      setAllMatches(DUMMY_RECOMMENDATIONS);
      setRecommendations(DUMMY_RECOMMENDATIONS.slice(0, 3));
      setAllSubjects([...new Set(DUMMY_RECOMMENDATIONS.map(d => d.subject))].sort());
    }
  };

  const loadRecommendations = async () => {
    try {
      const url = selectedSubject ? `/match/recommendations?subject=${selectedSubject}` : '/match/recommendations';
      const res = await api.get(url);
      if (res.data.length > 0) { setRecommendations(res.data); return; }
    } catch {}
    const filtered = selectedSubject ? DUMMY_RECOMMENDATIONS.filter(d => d.subject === selectedSubject) : DUMMY_RECOMMENDATIONS.slice(0, 3);
    setRecommendations(filtered.length > 0 ? filtered : DUMMY_RECOMMENDATIONS.slice(0, 3));
  };

  const loadUpcomingSessions = async () => {
    try {
      const res = await api.get('/sessions/upcoming');
      setUpcomingSessions(res.data.slice(0, 5));
      // Backend now sends attended:true/false per session
      const alreadyJoined = new Set(
        res.data.filter(s => s.attended).map(s => s._id)
      );
      setJoinedSessions(alreadyJoined);
    } catch {}
  };

  const loadNotifications = async () => {
    try {
      const [notifRes, invitesRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/invites')
      ]);
      const inviteMap = {};
      invitesRes.data.receivedInvites?.forEach(inv => { inviteMap[inv._id] = inv; });
      const merged = notifRes.data.map(n => ({
        ...n,
        invite: n.type === 'group_invite' && n.inviteId ? inviteMap[n.inviteId] : null
      })).filter(n => {
        if (n.type === 'group_invite') return n.invite != null;
        return true;
      });
      setNotifications(merged.slice(0, 5));
    } catch {}
  };

  const loadAnalytics = async () => {
    try { const res = await api.get('/users/analytics'); setAnalytics(res.data); } catch {}
  };

  const loadInsights = async () => {
    try { const res = await api.get('/match/insights'); setInsights(res.data); } catch {}
  };

  const handleViewProfile = async (match) => {
    if (match.userId?.toString().startsWith('d')) {
      setSelectedProfile({ _id: match.userId, name: match.name, profilePicture: match.profilePicture, cluster: { label: match.clusterLabel }, subjects: [{ name: match.subject, skill: match.skillLevel }] });
    } else {
      try { const res = await api.get(`/users/${match.userId}`); setSelectedProfile(res.data); } catch { return; }
    }
    setShowProfileModal(true);
  };

  const handleInvite = async (match) => {
    setSelectedMatch(match); setInviteeProfile(null);
    if (match.userId && !match.userId.toString().startsWith('d')) {
      try { const res = await api.get(`/users/${match.userId}`); setInviteeProfile(res.data); } catch {}
    }
    setShowInviteModal(true);
  };

  const joinSession = async (sessionId) => {
    setSessionJoinStatus(prev => ({ ...prev, [sessionId]: 'loading' }));
    try {
      await api.post(`/sessions/${sessionId}/join`);
      if (user?.id) await api.post(`/analytics/streak/${user.id}`).catch(() => {});
      setJoinedSessions(prev => new Set([...prev, sessionId]));
      setSessionJoinStatus(prev => ({ ...prev, [sessionId]: 'joined' }));
      window.dispatchEvent(new Event('notificationUpdate'));
    } catch (err) {
      console.error(err);
      setSessionJoinStatus(prev => ({ ...prev, [sessionId]: null }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* ── Hero Banner ── */}
          <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 rounded-2xl p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center gap-5">
              <Avatar user={user} size="2xl" className="ring-4 ring-white/30" />
              <div className="flex-1">
                <p className="text-white/70 text-sm font-medium">Welcome back</p>
                <h1 className="text-2xl font-bold">{user?.name || 'Student'}</h1>
                {user?.college && <p className="text-white/80 text-sm mt-0.5">{user.college}{user.dept ? ` · ${user.dept}` : ''}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white`}>
                    {user?.cluster?.label || 'Cluster not assigned'}
                  </span>
                  {user?.streak > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                      {user.streak} day streak
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/app/analytics"
                  className="hidden sm:block px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition">
                  View Analytics
                </Link>
                <Link to="/app/planner"
                  className="hidden sm:block px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition">
                  Planner
                </Link>
              </div>
            </div>
          </div>

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Sessions This Week', value: analytics.sessionsThisWeek, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { label: 'Attendance Rate', value: `${analytics.attendanceRate}%`, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: 'Activity Score', value: `${analytics.activityScore}/10`, icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              { label: 'Study Streak', value: `${user?.streak || 0} days`, icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-200">
                <svg className="w-4 h-4 mb-1.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* ── Main Grid ── */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">

            {/* Recommended Matches — 2/3 width */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recommended Matches</h2>
                  <p className="text-sm text-gray-500 mt-1">Top study buddies matched for you</p>
                </div>
                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-gray-50">
                  <option value="">All subjects</option>
                  {allSubjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Color ratio legend */}
              <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-bold text-gray-600">Match Score:</span>
                {[
                  { label: 'Excellent', color: 'bg-emerald-500', range: '80–100' },
                  { label: 'Good', color: 'bg-blue-500', range: '60–79' },
                  { label: 'Fair', color: 'bg-yellow-400', range: '40–59' },
                  { label: 'Low', color: 'bg-gray-400', range: '0–39' },
                ].map(({ label, color, range }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-3.5 h-3.5 rounded-full ${color}`} />
                    <span className="text-sm text-gray-700 font-medium">{label} <span className="text-gray-400 font-normal">({range})</span></span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {recommendations.map(match => (
                  <div key={match.userId} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition cursor-pointer group"
                    onClick={() => handleViewProfile(match)}>
                    <Avatar user={{ name: match.name, profilePicture: match.profilePicture }} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-lg">{match.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">{match.skillLevel} · {match.subject || 'Study'}</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">{match.clusterLabel}</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">{match.overlapPct}% overlap</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <ScoreBadge score={match.compatibilityScore} />
                      <button onClick={e => { e.stopPropagation(); handleInvite(match); }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition">
                        Invite
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">

              {/* Upcoming Sessions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Upcoming Sessions</h2>
                  {upcomingSessions.length > 0 && (
                    <span className="text-xs bg-primary-50 text-primary-700 font-semibold px-2 py-1 rounded-full">
                      {upcomingSessions.length}
                    </span>
                  )}
                </div>
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingSessions.map(session => {
                      const isJoined = joinedSessions.has(session._id) || sessionJoinStatus[session._id] === 'joined';
                      const isLoading = sessionJoinStatus[session._id] === 'loading';
                      const isPast = new Date(session.startTime) < new Date();
                      return (
                        <div key={session._id}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300 ${
                            isJoined
                              ? 'bg-green-50 border-green-200'
                              : isPast
                              ? 'bg-orange-50 border-orange-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                          {/* Left indicator dot */}
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isJoined ? 'bg-green-500' : isPast ? 'bg-orange-400' : 'bg-primary-500'
                          }`} />

                          {/* Session info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{session.groupName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(session.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                              {' · '}
                              {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {' · '}{session.durationMinutes} min
                            </p>
                          </div>

                          {/* Action — right side */}
                          {isJoined ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full flex-shrink-0">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                              Attended
                            </span>
                          ) : (
                            <button
                              onClick={() => joinSession(session._id)}
                              disabled={isLoading}
                              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5
                                ${isLoading
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-accent-600 text-white hover:bg-accent-700 active:scale-95'
                                }`}>
                              {isLoading ? (
                                <>
                                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                  </svg>
                                  Marking
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  {isPast ? 'Mark Attended' : 'Mark'}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-400 mb-1">No sessions right now</p>
                    <p className="text-xs text-gray-400">Sessions appear here when scheduled in your groups</p>
                  </div>
                )}
              </div>



              {/* Study Insights */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Study Insights</h2>
                {insights.length > 0 ? (
                  <div className="space-y-3">
                    {insights.map((insight, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                        <div className="w-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                        <p className="text-base text-gray-700 leading-relaxed">{insight.tip}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="text-base text-gray-400">Complete sessions to get insights</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Achievements ── */}
          <div className="mb-6">
            <Achievements user={user} leaderboard={[]} rank={0} />
          </div>

          {/* ── All Matches ── */}
          {allMatches.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">All Study Matches</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allMatches.map(match => (
                  <div key={match.userId}
                    className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-primary-400 hover:shadow-md transition text-center">
                    <Avatar user={{ name: match.name, profilePicture: match.profilePicture }} size="lg" className="mb-3" />
                    <p className="font-semibold text-gray-900 text-base truncate w-full">{match.name}</p>
                    <p className="text-sm text-gray-500 truncate w-full mb-1">{match.clusterLabel}</p>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-sm rounded-full mb-3">{match.skillLevel}</span>
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleViewProfile(match)}
                        className="flex-1 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                        Profile
                      </button>
                      <button
                        onClick={() => handleInvite(match)}
                        className="flex-1 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition">
                        Invite
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Profile Modal ── */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">

            {/* Header */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 rounded-t-2xl p-6 relative">
              <button onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center gap-4">
                <Avatar user={selectedProfile} size="xl" className="ring-4 ring-white/30" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white">{selectedProfile.name}</h3>
                  {selectedProfile.email && <p className="text-white/70 text-sm mt-0.5">{selectedProfile.email}</p>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProfile.college && <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">{selectedProfile.college}</span>}
                    {selectedProfile.dept && <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">{selectedProfile.dept}</span>}
                    {selectedProfile.year && <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">Year {selectedProfile.year}</span>}
                  </div>
                </div>
              </div>
              {/* Quick stats row */}
              <div className="flex gap-4 mt-4 pt-4 border-t border-white/20">
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{selectedProfile.streak || 0}</p>
                  <p className="text-white/60 text-xs">Day Streak</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{selectedProfile.longestStreak || 0}</p>
                  <p className="text-white/60 text-xs">Best Streak</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{selectedProfile.subjects?.length || 0}</p>
                  <p className="text-white/60 text-xs">Subjects</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg capitalize">{selectedProfile.preferences?.mode || '—'}</p>
                  <p className="text-white/60 text-xs">Study Mode</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">

              {/* Bio */}
              {selectedProfile.bio && (
                <div className="bg-gray-50 rounded-xl p-3 border-l-4 border-primary-400">
                  <p className="text-sm text-gray-600 italic leading-relaxed">"{selectedProfile.bio}"</p>
                </div>
              )}

              {/* Contact */}
              {selectedProfile.phone && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contact</p>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {selectedProfile.phone}
                  </div>
                </div>
              )}

              {/* Study Pattern */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Study Pattern</p>
                <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold flex-shrink-0 ${ clusterColors[selectedProfile.cluster?.label] || 'bg-indigo-100 text-indigo-700' }`}>
                    {selectedProfile.cluster?.label || 'Not assigned'}
                  </span>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                    {clusterDesc[selectedProfile.cluster?.label] || 'Study pattern not yet determined.'}
                  </p>
                </div>
              </div>

              {/* Subjects */}
              {selectedProfile.subjects?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.subjects.map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {s.name} <span className="opacity-60">· {s.skill}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability */}
              {selectedProfile.availability?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Availability</p>
                  <div className="flex flex-col gap-1.5">
                    {selectedProfile.availability.map((a, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-green-50 rounded-lg border border-green-100">
                        <span className="text-sm font-semibold text-green-700">{a.day}</span>
                        {(a.startTime || a.endTime) && (
                          <span className="text-xs text-green-600">{a.startTime || '?'} – {a.endTime || '?'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferences */}
              {selectedProfile.preferences && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Study Preferences</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-0.5">Group Size</p>
                      <p className="text-sm font-semibold text-gray-800">{selectedProfile.preferences.groupSize || '—'} members</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-0.5">Mode</p>
                      <p className="text-sm font-semibold text-gray-800 capitalize">{selectedProfile.preferences.mode || '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-0.5">Communication</p>
                      <p className="text-sm font-semibold text-gray-800 capitalize">{selectedProfile.preferences.communication || '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-0.5">Session Duration</p>
                      <p className="text-sm font-semibold text-gray-800">{selectedProfile.preferences.sessionDuration || '—'} min</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Behavior */}
              {selectedProfile.behavior && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Study Behavior</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-center">
                      <p className="text-lg font-bold text-amber-600">{selectedProfile.behavior.frequencyTarget || '—'}</p>
                      <p className="text-xs text-amber-500 mt-0.5">Sessions/week</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-center">
                      <p className="text-sm font-bold text-amber-600 capitalize">{selectedProfile.behavior.timeWindow || '—'}</p>
                      <p className="text-xs text-amber-500 mt-0.5">Preferred Time</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-center">
                      <p className="text-lg font-bold text-amber-600">{selectedProfile.behavior.commitment || '—'}<span className="text-xs">/10</span></p>
                      <p className="text-xs text-amber-500 mt-0.5">Commitment</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Invite Button */}
              <button
                onClick={() => { setShowProfileModal(false); handleInvite({ userId: selectedProfile._id, name: selectedProfile.name, profilePicture: selectedProfile.profilePicture }); }}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-xl hover:opacity-90 font-bold transition text-base shadow-md">
                Invite to Study Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invite Modal ── */}
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
              await api.post('/invites', {
                toUserId: payload.inviteeId,
                subject: selectedSubject || 'Study',
                groupName: payload.groupName,
                proposedSchedule: payload.proposedSchedules,
                message: payload.message
              });
              alert(`Invite sent to ${selectedMatch.name}!`);
              setShowInviteModal(false);
            } catch (err) {
              alert(err.response?.data?.error || 'Failed to send invite');
            }
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
