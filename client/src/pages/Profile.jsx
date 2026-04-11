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

const SKILL_COLORS = {
  Beginner: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Intermediate: 'bg-blue-100 text-blue-700 border-blue-200',
  Advanced: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const DAY_SHORT = { Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu', Friday:'Fri', Saturday:'Sat', Sunday:'Sun' };

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
        <p className="text-gray-500">Loading profile...</p>
      </div>
    </div>
  );

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const TABS = ['info', 'subjects', 'schedule', 'achievements'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <canvas ref={canvasRef} className="hidden" />

      <div className="pt-16">
        {/* ── Cover + Avatar Banner ── */}
        <div className="relative h-44 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500">
          {/* Abstract pattern overlay */}
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          {/* Edit / Save buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white rounded-xl text-sm font-semibold transition border border-white/30">
                Edit Profile
              </button>
            ) : (
              <>
                <button onClick={() => { initForm(user); setEditing(false); }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium border border-white/20 transition">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 bg-white text-primary-700 rounded-xl text-sm font-bold hover:bg-primary-50 transition shadow">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-12">

          {/* ── Avatar + Name Row ── */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                {(editing ? form.profilePicture : user?.profilePicture) ? (
                  <img src={editing ? form.profilePicture : user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-3xl">{initials}</span>
                )}
              </div>
              {editing && (
                <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-1">
                  <button onClick={() => fileInputRef.current.click()}
                    className="px-2 py-0.5 bg-gray-900 text-white text-xs rounded-full hover:bg-gray-700 transition">
                    Upload
                  </button>
                  <button onClick={startCamera}
                    className="px-2 py-0.5 bg-gray-900 text-white text-xs rounded-full hover:bg-gray-700 transition">
                    Camera
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              )}
            </div>

            {/* Name + info */}
            <div className="flex-1 pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                  <p className="text-sm text-gray-500">
                    {[user?.dept, user?.college, user?.year ? `Year ${user.year}` : null].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {user?.cluster?.label && (
                  <span className="sm:ml-3 inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">
                    {user.cluster.label}
                  </span>
                )}
              </div>
            </div>

            {/* Stats pills */}
            <div className="flex gap-3 sm:pb-1">
              {[
                { label: 'Sessions', value: analytics.sessionsThisWeek },
                { label: 'Attendance', value: `${analytics.attendanceRate}%` },
                { label: 'Score', value: `${analytics.activityScore}/10` },
                { label: 'Streak', value: `${user?.streak || 0}d` },
              ].map(({ label, value }) => (
                <div key={label} className="text-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm min-w-[60px]">
                  <p className="text-base font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bio strip ── */}
          {(user?.bio || editing) && (
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-5 shadow-sm">
              {editing ? (
                <textarea value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  rows={2} placeholder="Tell others about yourself — your goals, study style, interests..."
                  className="w-full text-sm text-gray-700 focus:outline-none resize-none" />
              ) : (
                <p className="text-sm text-gray-700">{user.bio || <span className="text-gray-400 italic">No bio yet.</span>}</p>
              )}
            </div>
          )}

          {/* ── Tabs ── */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-5 shadow-sm w-fit">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition ${
                  activeTab === tab
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}>
                {tab === 'achievements' ? '🏅 Badges' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* ── Tab: Info ── */}
          {activeTab === 'info' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">Personal Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', key: 'name', type: 'text', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                  { label: 'Email', key: 'email', type: 'email', readOnly: true, icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                  { label: 'College / University', key: 'college', type: 'text', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
                  { label: 'Department', key: 'dept', type: 'text', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                  { label: 'Year of Study', key: 'year', type: 'number', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                  { label: 'Phone', key: 'phone', type: 'tel', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
                ].map(({ label, key, type, readOnly, icon }) => (
                  <div key={key} className={`${key === 'college' ? 'sm:col-span-2' : ''}`}>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                      </svg>
                      {label}
                    </label>
                    {editing && !readOnly ? (
                      <input type={type} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50" />
                    ) : (
                      <p className={`text-sm font-medium px-3 py-2.5 rounded-xl ${readOnly ? 'bg-gray-100 text-gray-500' : 'text-gray-900'}`}>
                        {user?.[key] || <span className="text-gray-400 italic">Not set</span>}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Study Pattern */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Study Pattern</h3>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-100">
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-primary-800 text-base">{user?.cluster?.label || 'Not assigned yet'}</p>
                    <p className="text-xs text-primary-600">Confidence: {user?.cluster?.confidence || 0}%</p>
                    <div className="w-full bg-primary-200 rounded-full h-1.5 mt-1.5">
                      <div className="bg-primary-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${user?.cluster?.confidence || 0}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Study Time</p>
                    <p className="font-semibold text-gray-900 capitalize text-sm">{user?.behavior?.timeWindow || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Study Preferences row */}
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Study Preferences</h3>
                {editing ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Study Mode', key: 'mode', parent: 'preferences', options: [['online','Online'],['offline','Offline'],['hybrid','Hybrid']] },
                      { label: 'Communication', key: 'communication', parent: 'preferences', options: [['chat','Text Chat'],['voice','Voice'],['both','Both']] },
                      { label: 'Study Time', key: 'timeWindow', parent: 'behavior', options: [['morning','Morning'],['afternoon','Afternoon'],['evening','Evening'],['night','Night']] },
                    ].map(({ label, key, parent, options }) => (
                      <div key={key}>
                        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                        <select value={form[parent]?.[key] || ''} onChange={e => setForm(f => ({ ...f, [parent]: { ...f[parent], [key]: e.target.value } }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-gray-50">
                          {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                    ))}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Group Size</p>
                      <input type="number" min={2} max={8} value={form.preferences?.groupSize || 4}
                        onChange={e => setForm(f => ({ ...f, preferences: { ...f.preferences, groupSize: parseInt(e.target.value) } }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 bg-gray-50" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Mode', value: user?.preferences?.mode, icon: '🖥' },
                      { label: 'Communication', value: user?.preferences?.communication, icon: '💬' },
                      { label: 'Group Size', value: user?.preferences?.groupSize ? `${user.preferences.groupSize} people` : null, icon: '👥' },
                      { label: 'Study Time', value: user?.behavior?.timeWindow, icon: '🕐' },
                    ].map(({ label, value, icon }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="text-xs text-gray-400 mb-1">{icon} {label}</p>
                        <p className="font-semibold text-gray-800 capitalize text-sm">{value || <span className="text-gray-400">—</span>}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Subjects ── */}
          {activeTab === 'subjects' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">Subjects & Skills</h2>
              {editing ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {SUBJECT_OPTIONS.map(sub => (
                      <button key={sub} onClick={() => toggleSubject(sub)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          form.subjects.find(s => s.name === sub)
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-primary-300'
                        }`}>
                        {sub}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={customSubject} onChange={e => setCustomSubject(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCustomSubject()}
                      placeholder="Add custom subject..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500" />
                    <button onClick={addCustomSubject} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700">+ Add</button>
                  </div>
                  <div className="space-y-2 mt-2">
                    {form.subjects.map(sub => (
                      <div key={sub.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-sm font-semibold text-gray-900">{sub.name}</span>
                        <div className="flex items-center gap-2">
                          <select value={sub.skill} onChange={e => setForm(f => ({ ...f, subjects: f.subjects.map(s => s.name === sub.name ? { ...s, skill: e.target.value } : s) }))}
                            className="px-2 py-1 border border-gray-200 rounded-lg text-sm bg-white">
                            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                          </select>
                          <button onClick={() => toggleSubject(sub.name)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition text-lg">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : user?.subjects?.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {user.subjects.map((s, i) => (
                    <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${SKILL_COLORS[s.skill] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                      <span className="font-semibold text-sm">{s.name}</span>
                      <span className="text-xs font-bold opacity-80 bg-white/60 px-2 py-0.5 rounded-full">{s.skill}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm">No subjects added yet. Click Edit Profile to add your subjects.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Schedule ── */}
          {activeTab === 'schedule' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">Weekly Availability</h2>
              {editing ? (
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map(day => {
                    const isSelected = form.availability?.some(a => a.day === day);
                    return (
                      <button key={day} onClick={() => toggleDay(day)}
                        className={`flex flex-col items-center py-3 px-1 rounded-xl border-2 transition font-semibold text-sm ${
                          isSelected
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-600'
                        }`}>
                        <span>{DAY_SHORT[day]}</span>
                      </button>
                    );
                  })}
                </div>
              ) : user?.availability?.length > 0 ? (
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map(day => {
                    const isAvailable = user.availability.some(a => a.day === day);
                    return (
                      <div key={day} className={`flex flex-col items-center py-3 px-1 rounded-xl border-2 text-sm font-semibold ${
                        isAvailable ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-100 text-gray-300'
                      }`}>
                        {DAY_SHORT[day]}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm">No availability set. Click Edit Profile to set your schedule.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Achievements ── */}
          {activeTab === 'achievements' && (
            <Achievements user={user} leaderboard={[]} rank={0} />
          )}

        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Take a Photo</h3>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl mb-4 bg-black" />
            <div className="flex gap-3">
              <button onClick={capturePhoto} className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold transition">Capture</button>
              <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setShowCamera(false); }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
