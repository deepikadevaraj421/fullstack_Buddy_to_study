import { useState, useEffect } from 'react';
import Avatar from './Avatar';
import api from '../utils/api';

const LineChart = ({ data, color = '#0d9488' }) => {
  if (!data?.length) return <p className="text-gray-400 text-sm text-center py-6">No session data yet</p>;
  const W = 300, H = 90;
  const max = Math.max(...data.map(d => d.attendanceRate), 1);
  const pts = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * (W - 20) + 10,
    y: H - (d.attendanceRate / 100) * (H - 20) - 10,
    label: d.label,
    value: d.attendanceRate,
    sessions: d.sessions
  }));
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area = `M${pts[0].x},${H} ` + pts.map(p => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length - 1].x},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full">
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

const GroupAnalytics = ({ groupId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/analytics/group/${groupId}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [groupId]);

  if (loading) return <p className="text-gray-500 text-sm text-center py-8">Loading analytics...</p>;
  if (!data) return <p className="text-gray-400 text-sm text-center py-8">No analytics available</p>;

  return (
    <div className="space-y-6">
      {/* Attendance Trend */}
      <div className="bg-gray-50 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Attendance Trend (Last 4 Weeks)</h3>
        <LineChart data={data.weeklyTrend} />
        <div className="grid grid-cols-4 gap-2 mt-3">
          {data.weeklyTrend.map((w, i) => (
            <div key={i} className="text-center">
              <p className="text-xs text-gray-500">{w.label}</p>
              <p className="text-sm font-bold text-primary-600">{w.sessions} sessions</p>
            </div>
          ))}
        </div>
      </div>

      {/* Member Performance */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Member Performance</h3>
        <div className="space-y-3">
          {data.memberStats.map((m, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar user={m} size="sm" />
                <span className="font-medium text-gray-900 text-sm">{m.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Attendance</span>
                    <span className="font-semibold">{m.attendanceRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${m.attendanceRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Tasks Done</span>
                    <span className="font-semibold">{m.taskRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-accent-500 h-2 rounded-full transition-all" style={{ width: `${m.taskRate}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Health History */}
      {data.healthHistory?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Weekly Health History</h3>
          <div className="space-y-2">
            {data.healthHistory.slice().reverse().map((h, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{new Date(h.weekStart).toLocaleDateString()}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">Attendance: {Math.round(h.attendanceRate)}%</span>
                  <span className="text-xs text-gray-500">Tasks: {Math.round(h.taskCompletionRate)}%</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    h.status === 'Healthy' ? 'bg-green-100 text-green-700' :
                    h.status === 'Warning' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'}`}>
                    {h.status} · {Math.round(h.score)}/100
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupAnalytics;
