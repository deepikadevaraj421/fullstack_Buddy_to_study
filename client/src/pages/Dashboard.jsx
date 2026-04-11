import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import InviteModal from '../components/InviteModal';
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
  'Consistent Planner': 'bg-blue-100 text-blue-700',
  'Night Owl': 'bg-indigo-100 text-indigo-700',
  'Weekend Warrior': 'bg-orange-100 text-orange-700',
  'Sprint Learner': 'bg-red-100 text-red-700',
  'Casual Learner': 'bg-green-100 text-green-700',
  'Balanced Learner': 'bg-teal-100 text-teal-700',
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
  const color = score >= 80 ? 'bg-red-500' : score >= 60 ? 'bg-orange-400' : score >= 40 ? 'bg-yellow-400' : 'bg-green-500';
  const label = score >= 80 ? 'Critical' : score >= 60 ? 'High' : score >= 40 ? 'Medium' : 'Low';
  return (
    <div className="flex flex-col items-center">
      <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center shadow`}>
        <span className="text-white font-bold text-sm">{score}</span>
      </div>
      <span className="text-xs text-gray-400 mt-1">{label}</span>
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
    try { const res = await api.get('/sessions/upcoming'); setUpcomingSessions(res.data.slice(0, 3)); } catch {}
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
    try {
      await api.post(`/sessions/${sessionId}/join`);
      if (user?.id) await api.post(`/analytics/streak/${user.id}`).catch(() => {});
      alert('Attendance marked!'); loadUpcomingSessions();
    } catch (err) { console.error(err); }
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
              <Link to="/app/analytics"
                className="hidden sm:block px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition">
                View Analytics
              </Link>
            </div>
          </div>

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Sessions This Week', value: analytics.sessionsThisWeek, color: 'from-blue-500 to-blue-600', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { label: 'Attendance Rate', value: `${analytics.attendanceRate}%`, color: 'from-green-500 to-green-600', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: 'Activity Score', value: `${analytics.activityScore}/10`, color: 'from-purple-500 to-purple-600', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              { label: 'Study Streak', value: `${user?.streak || 0} days`, color: 'from-orange-500 to-orange-600', icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className={`bg-gradient-to-br ${color} rounded-xl p-5 text-white shadow-md`}>
                <svg className="w-6 h-6 mb-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-white/80 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* ── Main Grid ── */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">

            {/* Recommended Matches — 2/3 width */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Recommended Matches</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Top study buddies matched for you</p>
                </div>
                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-gray-50">
                  <option value="">All subjects</option>
                  {allSubjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Color ratio legend */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
                <span className="text-xs font-semibold text-gray-500">Match Score:</span>
                {[
                  { label: 'Critical', color: 'bg-red-500', range: '80–100' },
                  { label: 'High', color: 'bg-orange-400', range: '60–79' },
                  { label: 'Medium', color: 'bg-yellow-400', range: '40–59' },
                  { label: 'Low', color: 'bg-green-500', range: '0–39' },
                ].map(({ label, color, range }) => (
                  <div key={label} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-xs text-gray-600">{label} <span className="text-gray-400">({range})</span></span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {recommendations.map(match => (
                  <div key={match.userId} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition cursor-pointer group"
                    onClick={() => handleViewProfile(match)}>
                    <Avatar user={{ name: match.name, profilePicture: match.profilePicture }} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{match.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{match.skillLevel} · {match.subject || 'Study'}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${clusterColors[match.clusterLabel] || 'bg-gray-100 text-gray-600'}`}>{match.clusterLabel}</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{match.overlapPct}% overlap</span>
                      </div>
                    </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                      <ScoreBadge score={match.compatibilityScore} />
                      <button onClick={e => { e.stopPropagation(); handleInvite(match); }}
                        className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition">
                        Invite
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">

              {/* Upcoming Sessions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Sessions</h2>
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSessions.map(session => (
                      <div key={session._id} className="p-3 bg-gray-50 rounded-xl">
                        <p className="font-semibold text-gray-900 text-sm">{session.groupName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(session.startTime).toLocaleString()} · {session.durationMinutes} min</p>
                        <button onClick={() => joinSession(session._id)}
                          className="mt-2 w-full py-1.5 bg-accent-600 text-white rounded-lg text-xs font-semibold hover:bg-accent-700 transition">
                          Join & Mark Attendance
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-400">No upcoming sessions</p>
                  </div>
                )}
              </div>

              {/* Study Insights */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Study Insights</h2>
                {insights.length > 0 ? (
                  <div className="space-y-2">
                    {insights.map((insight, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                        <div className="w-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                        <p className="text-xs text-gray-700 leading-relaxed">{insight.tip}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="text-sm text-gray-400">Complete sessions to get insights</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── All Matches ── */}
          {allMatches.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">All Study Matches</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {allMatches.map(match => (
                  <div key={match.userId} onClick={() => handleViewProfile(match)}
                    className="flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-primary-300 hover:shadow-md transition cursor-pointer text-center group">
                    <Avatar user={{ name: match.name, profilePicture: match.profilePicture }} size="lg" className="mb-2 group-hover:ring-2 group-hover:ring-primary-400" />
                    <p className="font-semibold text-gray-900 text-sm truncate w-full">{match.name}</p>
                    <p className="text-xs text-gray-500 truncate w-full">{match.clusterLabel}</p>
                    <span className="mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{match.skillLevel}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Profile Modal ── */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-t-2xl p-6 relative">
              <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-white/80 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="flex items-center gap-4">
                <Avatar user={selectedProfile} size="xl" className="ring-4 ring-white/30" />
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedProfile.name}</h3>
                  {selectedProfile.college && <p className="text-white/80 text-sm">{selectedProfile.college}</p>}
                  {selectedProfile.dept && <p className="text-white/70 text-sm">{selectedProfile.dept}{selectedProfile.year ? ` · Year ${selectedProfile.year}` : ''}</p>}
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {selectedProfile.bio && <p className="text-sm text-gray-600 italic bg-gray-50 rounded-xl p-3">"{selectedProfile.bio}"</p>}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Study Pattern</p>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${clusterColors[selectedProfile.cluster?.label] || 'bg-gray-100 text-gray-700'}`}>
                  {selectedProfile.cluster?.label || 'Not assigned'}
                </span>
              </div>
              {selectedProfile.subjects?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.subjects.map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{s.name} — {s.skill}</span>
                    ))}
                  </div>
                </div>
              )}
              {selectedProfile.availability?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Available Days</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.availability.map((a, i) => (
                      <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">{a.day}</span>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => { setShowProfileModal(false); handleInvite({ userId: selectedProfile._id, name: selectedProfile.name, profilePicture: selectedProfile.profilePicture }); }}
                className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold transition">
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
