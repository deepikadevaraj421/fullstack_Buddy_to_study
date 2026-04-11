import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Achievements from '../components/Achievements';
import api from '../utils/api';

const SUBJECT_OPTIONS = [
  'DSA', 'Web Dev', 'Machine Learning', 'DBMS', 'OS', 'Networks',
  'Math', 'Physics', 'Chemistry', 'Statistics', 'Python', 'Java',
  'C++', 'JavaScript', 'React', 'Node.js', 'Cloud Computing',
  'Cyber Security', 'Artificial Intelligence', 'Data Structures',
  'Algorithms', 'Software Engineering', 'Computer Architecture',
  'Compiler Design', 'Digital Electronics'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = { Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu', Friday:'Fri', Saturday:'Sat', Sunday:'Sun' };

const SKILL_COLORS = {
  Beginner:     { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400' },
  Intermediate: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',     dot: 'bg-blue-400' },
  Advanced:     { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',  dot: 'bg-emerald-400' },
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState({ sessionsThisWeek: 0, attendanceRate: 0, activityScore: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [form, setForm] = useState({});
  const [activeTab, setActiveTab] = useState('info');
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const [userRes, analyticsRes] = await Promise.allSettled([
        api.get('/auth/me'),
        api.get('/users/analytics'),
      ]);
      if (userRes.status === 'fulfilled') { setUser(userRes.value.data); initForm(userRes.value.data); }
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem('token'); navigate('/login'); }
    } finally { setLoading(false); }
  };

  const initForm = (u) => setForm({
    name: u.name || '', college: u.college || '', dept: u.dept || '',
    year: u.year || '', bio: u.bio || '', phone: u.phone || '',
    profilePicture: u.profilePicture || '',
    subjects: u.subjects ? [...u.subjects] : [],
    availability: u.availability ? [...u.availability] : [],
    preferences: { ...(u.preferences || {}) },
    behavior: { ...(u.behavior || {}) }
  });

  const handleSave = async () => {
    setSaving(true);
    try { const res = await api.put('/users/profile', form); setUser(res.data); setEditing(false); }
    catch (err) { alert(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, profilePicture: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch { alert('Camera not accessible'); setShowCamera(false); }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current, video = videoRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setForm(f => ({ ...f, profilePicture: canvas.toDataURL('image/jpeg') }));
    streamRef.current?.getTracks().forEach(t => t.stop()); setShowCamera(false);
  };

  const toggleSubject = (name) => {
    const exists = form.subjects.find(s => s.name === name);
    setForm(f => ({ ...f, subjects: exists ? f.subjects.filter(s => s.name !== name) : [...f.subjects, { name, skill: 'Intermediate' }] }));
  };

  const addCustomSubject = () => {
    const t = customSubject.trim();
    if (t && !form.subjects.find(s => s.name === t)) setForm(f => ({ ...f, subjects: [...f.subjects, { name: t, skill: 'Intermediate' }] }));
    setCustomSubject('');
  };

  const toggleDay = (day) => {
    const exists = form.availability?.find(a => a.day === day);
    setForm(f => ({ ...f, availability: exists ? f.availability.filter(a => a.day !== day) : [...(f.availability || []), { day, startTime: '09:00', endTime: '17:00' }] }));
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const pic = editing ? form.profilePicture : user?.profilePicture;

  const TABS = [
    { id: 'info', label: 'Info' },
    { id: 'subjects', label: 'Subjects' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'achievements', label: '🏅 Badges' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <canvas ref={canvasRef} className="hidden" />

      {/* Cover */}
      <div className="relative h-28" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #16a34a 100%)' }}>
        <div className="absolute top-4 right-4 flex gap-2">
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg border border-white/30 hover:bg-white/20 transition"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}>
              ✏️ Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { initForm(user); setEditing(false); }}
                className="px-3 py-1.5 text-xs text-white/80 rounded-lg hover:text-white transition"
                style={{ background: 'rgba(0,0,0,0.2)' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-3 py-1.5 text-xs font-bold rounded-lg shadow transition"
                style={{ background: '#fff', color: '#0d9488' }}>
                {saving ? 'Saving...' : '✓ Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-12 pb-10 relative z-10">

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center shadow"
                style={{ background: 'linear-gradient(135deg, #14b8a6, #22c55e)' }}>
                {pic
                  ? <img src={pic} alt="Profile" className="w-full h-full object-cover" />
                  : <span className="text-white font-black text-2xl">{initials}</span>
                }
              </div>
              {editing && (
                <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-1">
                  <button onClick={() => fileInputRef.current.click()}
                    className="px-1.5 py-0.5 text-[9px] font-bold text-white rounded-full"
                    style={{ background: '#0d9488' }}>Upload</button>
                  <button onClick={startCamera}
                    className="px-1.5 py-0.5 text-[9px] font-bold text-white rounded-full"
                    style={{ background: '#16a34a' }}>Camera</button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              )}
            </div>

            {/* Name + bio */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                <h1 className="text-base font-black text-gray-900">{user?.name || 'Your Name'}</h1>
                {user?.cluster?.label && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full"
                    style={{ background: '#ccfbf1', color: '#0f766e' }}>{user.cluster.label}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-1">
                {[user?.dept, user?.college, user?.year ? `Yr ${user.year}` : null].filter(Boolean).join(' · ') || 'Add your details'}
              </p>
              {editing ? (
                <textarea value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  rows={1} placeholder="Short bio..."
                  className="w-full px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-400 resize-none bg-gray-50" />
              ) : (
                <p className="text-xs text-gray-500 line-clamp-1">{user?.bio || <span className="italic">No bio</span>}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-2 flex-shrink-0">
              {[
                { label: 'Sessions', value: analytics.sessionsThisWeek ?? 0, bg: '#eff6ff', text: '#1d4ed8' },
                { label: 'Attend.', value: `${analytics.attendanceRate ?? 0}%`, bg: '#f0fdf4', text: '#15803d' },
                { label: 'Streak', value: `${user?.streak || 0}d`, bg: '#fff7ed', text: '#c2410c' },
              ].map(({ label, value, bg, text }) => (
                <div key={label} className="text-center rounded-xl px-3 py-2 border border-gray-100"
                  style={{ background: bg, minWidth: 52 }}>
                  <p className="text-sm font-black leading-tight" style={{ color: text }}>{value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-4">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
              style={activeTab === tab.id ? { background: 'linear-gradient(135deg,#0d9488,#16a34a)' } : {}}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── INFO TAB ── */}
        {activeTab === 'info' && (
          <div className="space-y-3">
            {/* Personal info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Personal Information</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Full Name', key: 'name', type: 'text' },
                  { label: 'Email', key: 'email', type: 'email', readOnly: true },
                  { label: 'College', key: 'college', type: 'text', full: true },
                  { label: 'Department', key: 'dept', type: 'text' },
                  { label: 'Year', key: 'year', type: 'number' },
                  { label: 'Phone', key: 'phone', type: 'tel' },
                ].map(({ label, key, type, readOnly, full }) => (
                  <div key={key} className={full ? 'col-span-2' : ''}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                    {editing && !readOnly ? (
                      <input type={type} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary-400 bg-gray-50" />
                    ) : (
                      <p className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg ${readOnly ? 'bg-gray-100 text-gray-400' : 'text-gray-800'}`}>
                        {user?.[key] || <span className="text-gray-400 italic font-normal">Not set</span>}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Study pattern */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Study Pattern</p>
              <div className="flex items-center gap-3 p-3 rounded-xl mb-3"
                style={{ background: 'linear-gradient(135deg,#f0fdfa,#f0fdf4)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#0d9488,#16a34a)' }}>🧩</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm leading-tight">{user?.cluster?.label || 'Not assigned'}</p>
                  <p className="text-[10px] text-gray-500 mb-1">Confidence: {user?.cluster?.confidence || 0}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${user?.cluster?.confidence || 0}%`, background: 'linear-gradient(90deg,#0d9488,#16a34a)' }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-gray-400">Study Time</p>
                  <p className="text-xs font-bold text-gray-700 capitalize">{user?.behavior?.timeWindow || '—'}</p>
                </div>
              </div>

              {/* Pref grid */}
              {editing ? (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Mode', key: 'mode', parent: 'preferences', options: [['online','Online'],['offline','Offline'],['hybrid','Hybrid']] },
                    { label: 'Communication', key: 'communication', parent: 'preferences', options: [['chat','Chat'],['voice','Voice'],['both','Both']] },
                    { label: 'Study Time', key: 'timeWindow', parent: 'behavior', options: [['morning','Morning'],['afternoon','Afternoon'],['evening','Evening'],['night','Night']] },
                    { label: 'Group Size', key: 'groupSize', parent: 'preferences', options: null },
                  ].map(({ label, key, parent, options }) => (
                    <div key={key}>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                      {options ? (
                        <select value={form[parent]?.[key] || ''} onChange={e => setForm(f => ({ ...f, [parent]: { ...f[parent], [key]: e.target.value } }))}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:ring-1 focus:ring-primary-400">
                          {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      ) : (
                        <input type="number" min={2} max={8} value={form.preferences?.groupSize || 4}
                          onChange={e => setForm(f => ({ ...f, preferences: { ...f.preferences, groupSize: parseInt(e.target.value) } }))}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:ring-1 focus:ring-primary-400" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Mode', value: user?.preferences?.mode, icon: '🖥️' },
                    { label: 'Comm.', value: user?.preferences?.communication, icon: '💬' },
                    { label: 'Group', value: user?.preferences?.groupSize ? `${user.preferences.groupSize}p` : null, icon: '👥' },
                    { label: 'Time', value: user?.behavior?.timeWindow, icon: '⏰' },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 text-center">
                      <p className="text-sm mb-0.5">{icon}</p>
                      <p className="text-xs font-bold text-gray-800 capitalize leading-tight">{value || '—'}</p>
                      <p className="text-[10px] text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SUBJECTS TAB ── */}
        {activeTab === 'subjects' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Subjects & Skills</p>
            {editing ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECT_OPTIONS.map(sub => {
                    const sel = !!form.subjects.find(s => s.name === sub);
                    return (
                      <button key={sub} onClick={() => toggleSubject(sub)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${sel ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 bg-gray-50 hover:border-primary-300'}`}
                        style={sel ? { background: 'linear-gradient(135deg,#0d9488,#16a34a)' } : {}}>
                        {sub}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={customSubject} onChange={e => setCustomSubject(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomSubject()}
                    placeholder="Custom subject..."
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-primary-400" />
                  <button onClick={addCustomSubject}
                    className="px-3 py-1.5 text-white text-xs font-bold rounded-lg"
                    style={{ background: '#0d9488' }}>+ Add</button>
                </div>
                <div className="space-y-1.5">
                  {form.subjects.map(sub => (
                    <div key={sub.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-xs font-semibold text-gray-800">{sub.name}</span>
                      <div className="flex gap-2 items-center">
                        <select value={sub.skill} onChange={e => setForm(f => ({ ...f, subjects: f.subjects.map(s => s.name === sub.name ? { ...s, skill: e.target.value } : s) }))}
                          className="px-2 py-0.5 border border-gray-200 rounded-lg text-xs bg-white">
                          <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                        </select>
                        <button onClick={() => toggleSubject(sub.name)} className="text-gray-400 hover:text-red-500 text-lg leading-none transition">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : user?.subjects?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {user.subjects.map((s, i) => {
                  const c = SKILL_COLORS[s.skill] || SKILL_COLORS.Intermediate;
                  return (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${c.bg} ${c.border}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                      <p className={`text-xs font-bold truncate flex-1 ${c.text}`}>{s.name}</p>
                      <span className={`text-[10px] font-semibold ${c.text} opacity-70`}>{s.skill.slice(0,3)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📚</p>
                <p className="text-sm text-gray-400">No subjects added yet</p>
              </div>
            )}
          </div>
        )}

        {/* ── SCHEDULE TAB ── */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Weekly Availability</p>
            <div className="grid grid-cols-7 gap-1.5 mb-4">
              {DAYS.map(day => {
                const active = (editing ? form.availability : user?.availability)?.some(a => a.day === day);
                return (
                  <button key={day} onClick={editing ? () => toggleDay(day) : undefined}
                    disabled={!editing}
                    className={`flex flex-col items-center py-2.5 rounded-xl border text-xs font-bold transition-all
                      ${active ? 'text-white shadow-sm' : 'border-gray-100 text-gray-300 bg-gray-50'}
                      ${editing ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                    style={active ? { background: 'linear-gradient(135deg,#0d9488,#16a34a)', borderColor: 'transparent' } : {}}>
                    {DAY_SHORT[day]}
                  </button>
                );
              })}
            </div>
            {(editing ? form.availability : user?.availability)?.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                {(editing ? form.availability : user.availability).map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: '#f0fdfa', border: '1px solid #d1fae5' }}>
                    <span className="text-xs font-semibold text-emerald-700">{a.day.slice(0,3)}</span>
                    {(a.startTime || a.endTime) && (
                      <span className="text-[10px] text-emerald-600 font-medium">{a.startTime}–{a.endTime}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!user?.availability?.length && !editing && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-sm text-gray-400">No schedule set</p>
              </div>
            )}
          </div>
        )}

        {/* ── ACHIEVEMENTS TAB ── */}
        {activeTab === 'achievements' && <Achievements user={user} leaderboard={[]} rank={0} />}

      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <h3 className="text-sm font-bold text-gray-900 mb-3">📷 Take a Photo</h3>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl mb-3 bg-black" />
            <div className="flex gap-2">
              <button onClick={capturePhoto}
                className="flex-1 py-2 text-white rounded-xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg,#0d9488,#16a34a)' }}>Capture</button>
              <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setShowCamera(false); }}
                className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
