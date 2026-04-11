import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import api from '../utils/api';

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
const BarChart = ({ data, color = '#0d9488', height = 160 }) => {
  if (!data?.length) return <p className="text-gray-400 text-sm text-center py-8">No data yet</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.floor(280 / data.length) - 8;
  return (
    <svg viewBox={`0 0 280 ${height + 40}`} className="w-full">
      {data.map((d, i) => {
        const barH = Math.max(4, (d.value / max) * height);
        const x = i * (barW + 8) + 4;
        const y = height - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill={color} opacity={0.85} />
            <text x={x + barW / 2} y={height + 14} textAnchor="middle" fontSize={9} fill="#6b7280">{d.label}</text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fill={color} fontWeight="bold">{d.value}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ── SVG Donut Chart ───────────────────────────────────────────────────────────
const DonutChart = ({ data }) => {
  if (!data?.length) return <p className="text-gray-400 text-sm text-center py-8">No data yet</p>;
  const COLORS = ['#0d9488', '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumAngle = -Math.PI / 2;
  const cx = 80, cy = 80, r = 60, inner = 35;

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const xi1 = cx + inner * Math.cos(cumAngle - angle);
    const yi1 = cy + inner * Math.sin(cumAngle - angle);
    const xi2 = cx + inner * Math.cos(cumAngle);
    const yi2 = cy + inner * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { path: `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${inner},${inner} 0 ${large},0 ${xi1},${yi1} Z`, color: COLORS[i % COLORS.length], label: d.label, value: d.value };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 160 160" className="w-36 flex-shrink-0">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={11} fill="#374151" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 17} textAnchor="middle" fontSize={8} fill="#6b7280">users</text>
      </svg>
      <div className="space-y-1.5 flex-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-gray-700 flex-1">{s.label}</span>
            <span className="text-xs font-semibold text-gray-900">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Line Chart ────────────────────────────────────────────────────────────────
const LineChart = ({ data, color = '#0d9488' }) => {
  if (!data?.length) return <p className="text-gray-400 text-sm text-center py-8">No data yet</p>;
  const W = 280, H = 100;
  const max = Math.max(...data.map(d => d.value), 1);
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * (W - 20) + 10,
    y: H - (d.value / max) * (H - 20) - 10,
    label: d.label,
    value: d.value
  }));
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area = `M${pts[0].x},${H} ` + pts.map(p => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1].x},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full">
      <path d={area} fill={color} opacity={0.1} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={color} />
          <text x={p.x} y={H + 16} textAnchor="middle" fontSize={9} fill="#6b7280">{p.label}</text>
          <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize={9} fill={color} fontWeight="bold">{p.value}%</text>
        </g>
      ))}
    </svg>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const Analytics = () => {
  const [user, setUser] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/auth/me'),
      api.get('/analytics/platform'),
      api.get('/analytics/leaderboard')
    ]).then(([uRes, pRes, lRes]) => {
      setUser(uRes.data);
      setPlatform(pRes.data);
      setLeaderboard(lRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navbar />
      <div className="pt-20 flex items-center justify-center"><p className="text-gray-500">Loading analytics...</p></div>
    </div>
  );

  const clusterData = platform?.clusterDist
    ? Object.entries(platform.clusterDist).map(([label, value]) => ({ label: label.split(' ')[0], value }))
    : [];

  const subjectData = platform?.topSubjects?.map(s => ({ label: s.name.length > 8 ? s.name.slice(0, 7) + '.' : s.name, value: s.count })) || [];

  const myRank = leaderboard.findIndex(s => s._id?.toString() === user?.id?.toString()) + 1;
  const myStats = leaderboard.find(s => s._id?.toString() === user?.id?.toString());

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navbar user={user} />
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics</h1>

          {/* Personal Stats */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {[
              { label: 'My Active Groups', value: platform?.totalUsers || 0, color: 'text-primary-600' },
              { label: 'Study Partners', value: platform?.totalGroups || 0, color: 'text-accent-600' },
              { label: 'Sessions Attended', value: platform?.totalSessions || 0, color: 'text-purple-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl shadow-md p-6 text-center">
                <p className={`text-4xl font-bold ${color}`}>{value}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* My Stats Card */}
          {myStats && (
            <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl shadow-md p-6 mb-8 text-white">
              <h2 className="text-lg font-bold mb-4">Your Performance</h2>
              <div className="flex items-center gap-4 mb-4">
                <Avatar user={user} size="lg" />
                <div>
                  <p className="text-xl font-bold">{user?.name}</p>
                  <p className="text-white/80 text-sm">{myStats.clusterLabel}</p>
                  {myRank > 0 && <p className="text-white/90 text-sm font-semibold mt-1">Rank #{myRank} on leaderboard</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Score', value: myStats.score },
                  { label: 'Attendance', value: `${myStats.attendanceRate}%` },
                  { label: 'Tasks Done', value: `${myStats.taskRate}%` },
                  { label: 'Streak', value: `${myStats.streak}d` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/20 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold">{value}</p>
                    <p className="text-xs text-white/80">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Study Behavior Distribution</h2>
              <DonutChart data={clusterData} />
            </div>

            {/* Subject Popularity */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Most Popular Subjects</h2>
              <BarChart data={subjectData} color="#6366f1" />
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Student Leaderboard</h2>
              {myRank > 0 && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                  Your rank: #{myRank}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {leaderboard.map((student, i) => {
                const isMe = student._id?.toString() === user?.id?.toString();
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                return (
                  <div key={student._id} className={`flex items-center gap-4 p-3 rounded-xl transition ${isMe ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <div className="w-8 text-center">
                      {medal ? <span className="text-xl">{medal}</span> : <span className="text-sm font-bold text-gray-500">#{i + 1}</span>}
                    </div>
                    <Avatar user={student} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{student.name} {isMe && <span className="text-primary-600 text-xs">(You)</span>}</p>
                      <p className="text-xs text-gray-500">{student.clusterLabel}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 text-xs text-gray-600">
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{student.attendanceRate}%</p>
                        <p>Attendance</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{student.taskRate}%</p>
                        <p>Tasks</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{student.streak}</p>
                        <p>Streak</p>
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${student.score >= 70 ? 'bg-green-100 text-green-700' : student.score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        {student.score}
                      </span>
                    </div>
                  </div>
                );
              })}
              {leaderboard.length === 0 && (
                <p className="text-center text-gray-400 py-8">No data yet. Complete sessions and tasks to appear on the leaderboard.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
