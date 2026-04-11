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

const StatCard = ({ label, value, icon, accent }) => (
  <div className={`flex flex-col items-center justify-center py-3 px-4 rounded-2xl border bg-white shadow-sm min-w-[80px] ${accent}`}>
    <span className="text-lg mb-0.5">{icon}</span>
    <p className="text-xl font-extrabold text-gray-900 leading-tight">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

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
      if (userRes.status === 'fulfilled') {
        setUser(userRes.value.data);
        initForm(userRes.value.data);
      }
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
    try {
      const res = await api.put('/users/profile', form);
      setUser(res.data); setEditing(false);
    } catch (err) { alert(err.response?.data?.error || 'Failed to save'); }
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
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading your profile...</p>
      </div>
    </div>
  );

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const pic = editing ? form.profilePicture : user?.profilePicture;
  const TABS = [
    { id: 'info', label: 'Info', emoji: '👤' },
    { id: 'subjects', label: 'Subjects', emoji: '📚' },
    { id: 'schedule', label: 'Schedule', emoji: '📅' },
    { id: 'achievements', label: 'Badges', emoji: '🏅' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #f0fdf4 50%, #ecfdf5 100%)' }}>
      <Navbar user={user} />
      <canvas ref={canvasRef} className="hidden" />

      {/* ── COVER BANNER ── */}
      <div className="relative" style={{ height: '200px' }}>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 40%, #16a34a 100%)'
        }} />
        {/* Decorative circles */}
        <div className="absolute top-6 right-20 w-32 h-32 rounded-full opacity-10 bg-white" />
        <div className="absolute top-16 right-8 w-16 h-16 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-4 left-1/3 w-48 h-48 rounded-full opacity-5 bg-white" />
        <div className="absolute top-4 left-1/4 w-20 h-20 rounded-full opacity-10 bg-white" />

        {/* Action buttons */}
        <div className="absolute top-5 right-5 flex gap-2 z-10">
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          ) : (
            <>
              <button onClick={() => { initForm(user); setEditing(false); }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white/80 transition hover:text-white"
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.2)' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-bold shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-60"
                style={{ background: '#fff', color: '#0d9488' }}>
                {saving ? 'Saving...' : '✓ Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 pb-16 relative z-10">

        {/* ── HEADER CARD ── */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 mb-5">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #14b8a6, #22c55e)' }}>
                {pic ? (
                  <img src={pic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-black text-4xl select-none">{initials}</span>
                )}
              </div>
              {editing && (
                <div className="absolute -bottom-3 left-0 right-0 flex justify-center gap-1">
                  <button onClick={() => fileInputRef.current.click()}
                    className="px-2 py-1 text-[10px] font-bold text-white rounded-full shadow"
                    style={{ background: '#0d9488' }}>📁 Upload</button>
                  <button onClick={startCamera}
                    className="px-2 py-1 text-[10px] font-bold text-white rounded-full shadow"
                    style={{ background: '#16a34a' }}>📷 Camera</button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              )}
            </div>

            {/* Name + details */}
            <div className="flex-1 min-w-0 mt-2 sm:mt-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-gray-900">{user?.name || 'Your Name'}</h1>
                {user?.cluster?.label && (
                  <span className="px-3 py-1 text-xs font-bold rounded-full"
                    style={{ background: 'linear-gradient(90deg,#ccfbf1,#bbf7d0)', color: '#0f766e' }}>
                    {user.cluster.label}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-3">
                {[user?.dept, user?.college, user?.year ? `Year ${user.year}` : null].filter(Boolean).join(' · ') || 'Add your college & department'}
              </p>
              {/* Bio */}
              {editing ? (
                <textarea value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  rows={2} placeholder="Write something about yourself — goals, style, interests..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none bg-gray-50" />
              ) : user?.bio ? (
                <p className="text-sm text-gray-600 line-clamp-2">{user.bio}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">No bio yet — click Edit Profile to add one.</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <StatCard label="Sessions" value={analytics.sessionsThisWeek ?? 0} icon="📖" accent="border-blue-100" />
              <StatCard label="Attendance" value={`${analytics.attendanceRate ?? 0}%`} icon="✅" accent="border-green-100" />
              <StatCard label="Streak" value={`${user?.streak || 0}d`} icon="🔥" accent="border-orange-100" />
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                activeTab === tab.id
                  ? 'text-white shadow-md scale-105'
                  : 'bg-white text-gray-500 hover:text-gray-800 border border-gray-200'
              }`}
              style={activeTab === tab.id ? { background: 'linear-gradient(135deg, #0d9488, #16a34a)' } : {}}>
              <span>{tab.emoji}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: INFO ── */}
        {activeTab === 'info' && (
          <div className="space-y-4">

            {/* Personal Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: 'linear-gradient(135deg,#ccfbf1,#bbf7d0)' }}>👤</span>
                Personal Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', key: 'name', type: 'text' },
                  { label: 'Email', key: 'email', type: 'email', readOnly: true },
                  { label: 'College / University', key: 'college', type: 'text', full: true },
                  { label: 'Department', key: 'dept', type: 'text' },
                  { label: 'Year of Study', key: 'year', type: 'number' },
                  { label: 'Phone', key: 'phone', type: 'tel' },
                ].map(({ label, key, type, readOnly, full }) => (
                  <div key={key} className={full ? 'sm:col-span-2' : ''}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
                    {editing && !readOnly ? (
                      <input type={type} value={form[key] || ''}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-gray-50 text-gray-800 transition" />
                    ) : (
                      <div className={`px-3 py-2.5 rounded-xl text-sm font-semibold ${
                        readOnly ? 'bg-gray-100 text-gray-500' : 'text-gray-800'
                      }`}>
                        {user?.[key] || <span className="text-gray-400 font-normal italic">Not set</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Study Pattern */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)' }}>🧠</span>
                Study Pattern & Behavior
              </h2>
              <div className="flex items-center gap-4 p-4 rounded-2xl mb-4"
                style={{ background: 'linear-gradient(135deg, #f0fdfa, #f0fdf4)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #16a34a)' }}>🧩</div>
                <div className="flex-1">
                  <p className="font-black text-gray-900 text-lg leading-tight">{user?.cluster?.label || 'Not assigned'}</p>
                  <p className="text-xs text-gray-500 mb-2">Confidence: {user?.cluster?.confidence || 0}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all duration-700"
                      style={{ width: `${user?.cluster?.confidence || 0}%`, background: 'linear-gradient(90deg,#0d9488,#16a34a)' }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">Preferred Time</p>
                  <p className="font-bold text-gray-800 capitalize text-sm mt-0.5">{user?.behavior?.timeWindow || '—'}</p>
                </div>
              </div>

              {/* Preferences grid */}
              {editing ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Study Mode', key: 'mode', parent: 'preferences', options: [['online','Online'],['offline','Offline'],['hybrid','Hybrid']] },
                    { label: 'Communication', key: 'communication', parent: 'preferences', options: [['chat','Text Chat'],['voice','Voice'],['both','Both']] },
                    { label: 'Study Time', key: 'timeWindow', parent: 'behavior', options: [['morning','Morning'],['afternoon','Afternoon'],['evening','Evening'],['night','Night']] },
                  ].map(({ label, key, parent, options }) => (
                    <div key={key}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</p>
                      <select value={form[parent]?.[key] || ''} onChange={e => setForm(f => ({ ...f, [parent]: { ...f[parent], [key]: e.target.value } }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-400 bg-gray-50">
                        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  ))}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Group Size</p>
                    <input type="number" min={2} max={8} value={form.preferences?.groupSize || 4}
                      onChange={e => setForm(f => ({ ...f, preferences: { ...f.preferences, groupSize: parseInt(e.target.value) } }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-400 bg-gray-50" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Study Mode', value: user?.preferences?.mode, color: 'from-blue-50 to-blue-100', text: 'text-blue-700', icon: '🖥' },
                    { label: 'Communication', value: user?.preferences?.communication, color: 'from-purple-50 to-purple-100', text: 'text-purple-700', icon: '💬' },
                    { label: 'Group Size', value: user?.preferences?.groupSize ? `${user.preferences.groupSize} people` : null, color: 'from-pink-50 to-pink-100', text: 'text-pink-700', icon: '👥' },
                    { label: 'Study Time', value: user?.behavior?.timeWindow, color: 'from-amber-50 to-amber-100', text: 'text-amber-700', icon: '⏰' },
                  ].map(({ label, value, color, text, icon }) => (
                    <div key={label} className={`bg-gradient-to-br ${color} rounded-xl p-3 border border-white`}>
                      <p className="text-xs text-gray-500 mb-1">{icon} {label}</p>
                      <p className={`font-bold capitalize text-sm ${text}`}>{value || '—'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: SUBJECTS ── */}
        {activeTab === 'subjects' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ background: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' }}>📚</span>
              Subjects & Skills
            </h2>
            {editing ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {SUBJECT_OPTIONS.map(sub => {
                    const selected = !!form.subjects.find(s => s.name === sub);
                    return (
                      <button key={sub} onClick={() => toggleSubject(sub)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                          selected
                            ? 'border-transparent text-white scale-105 shadow'
                            : 'border-gray-200 text-gray-600 bg-gray-50 hover:border-primary-300'
                        }`}
                        style={selected ? { background: 'linear-gradient(135deg,#0d9488,#16a34a)' } : {}}>
                        {sub}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={customSubject} onChange={e => setCustomSubject(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomSubject()}
                    placeholder="Add a custom subject..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-400" />
                  <button onClick={addCustomSubject}
                    className="px-4 py-2 text-white text-sm font-bold rounded-xl"
                    style={{ background: 'linear-gradient(135deg,#0d9488,#16a34a)' }}>+ Add</button>
                </div>
                <div className="space-y-2">
                  {form.subjects.map(sub => (
                    <div key={sub.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-sm font-semibold text-gray-900">{sub.name}</span>
                      <div className="flex items-center gap-2">
                        <select value={sub.skill}
                          onChange={e => setForm(f => ({ ...f, subjects: f.subjects.map(s => s.name === sub.name ? { ...s, skill: e.target.value } : s) }))}
                          className="px-2 py-1 border border-gray-200 rounded-lg text-sm bg-white">
                          <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                        </select>
                        <button onClick={() => toggleSubject(sub.name)}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition text-xl">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : user?.subjects?.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {user.subjects.map((s, i) => {
                  const c = SKILL_COLORS[s.skill] || SKILL_COLORS.Intermediate;
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${c.bg} ${c.border}`}>
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm ${c.text} truncate`}>{s.name}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70 ${c.text}`}>{s.skill}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-5xl mb-3">📚</p>
                <p className="text-gray-500 font-semibold">No subjects added yet</p>
                <p className="text-sm text-gray-400 mt-1">Click Edit Profile to add your subjects and skill levels</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: SCHEDULE ── */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)' }}>📅</span>
              Weekly Availability
            </h2>
            <div className="grid grid-cols-7 gap-2 mb-6">
              {DAYS.map(day => {
                const isAvailable = (editing ? form.availability : user?.availability)?.some(a => a.day === day);
                return (
                  <button key={day}
                    onClick={editing ? () => toggleDay(day) : undefined}
                    disabled={!editing}
                    className={`flex flex-col items-center py-4 rounded-2xl border-2 transition-all font-bold text-sm
                      ${isAvailable
                        ? 'text-white shadow-md scale-105'
                        : 'border-gray-100 text-gray-300 bg-gray-50'
                      } ${editing ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                    style={isAvailable ? { background: 'linear-gradient(135deg,#0d9488,#16a34a)', borderColor: 'transparent' } : {}}>
                    {DAY_SHORT[day]}
                  </button>
                );
              })}
            </div>
            {/* Availability list */}
            {(editing ? form.availability : user?.availability)?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Available time slots</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {(editing ? form.availability : user.availability).map((a, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ background: 'linear-gradient(135deg,#f0fdfa,#f0fdf4)', border: '1px solid #d1fae5' }}>
                      <span className="font-semibold text-sm text-emerald-700">{a.day}</span>
                      {(a.startTime || a.endTime) && (
                        <span className="text-xs font-medium text-emerald-600 bg-white px-2 py-1 rounded-full">
                          {a.startTime} – {a.endTime}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!user?.availability?.length && !editing && (
              <div className="text-center py-8">
                <p className="text-5xl mb-3">📅</p>
                <p className="text-gray-500 font-semibold">No availability set</p>
                <p className="text-sm text-gray-400 mt-1">Click Edit Profile to set your weekly schedule</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: ACHIEVEMENTS ── */}
        {activeTab === 'achievements' && (
          <Achievements user={user} leaderboard={[]} rank={0} />
        )}

      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📷 Take a Photo</h3>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl mb-4 bg-black" />
            <div className="flex gap-3">
              <button onClick={capturePhoto}
                className="flex-1 py-2.5 text-white rounded-xl font-bold transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#0d9488,#16a34a)' }}>Capture</button>
              <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setShowCamera(false); }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
