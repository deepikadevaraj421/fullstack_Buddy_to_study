import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
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

const Section = ({ title, children }) => (
  <div className="border-t border-gray-100 pt-5 mt-5">
    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
    {children}
  </div>
);

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [form, setForm] = useState({});
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      initForm(res.data);
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navbar />
      <div className="pt-20 flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <Navbar user={user} />
      <canvas ref={canvasRef} className="hidden" />

      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">

          {/* Single Card */}
          <div className="bg-white rounded-2xl shadow-md p-8">

            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              {!editing ? (
                <button onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm">
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { initForm(user); setEditing(false); }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {/* Avatar + Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="flex-shrink-0 text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto">
                  {(editing ? form.profilePicture : user?.profilePicture) ? (
                    <img src={editing ? form.profilePicture : user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-3xl">{user?.name?.charAt(0)}</span>
                  )}
                </div>
                {editing && (
                  <div className="flex gap-1 mt-2 justify-center">
                    <button onClick={() => fileInputRef.current.click()}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200">Upload</button>
                    <button onClick={startCamera}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200">Camera</button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                )}
              </div>

              <div className="flex-1 w-full grid sm:grid-cols-2 gap-3">
                {[
                  { label: 'Full Name', key: 'name', type: 'text' },
                  { label: 'Email', key: 'email', type: 'email', readOnly: true },
                  { label: 'College / University', key: 'college', type: 'text' },
                  { label: 'Department', key: 'dept', type: 'text' },
                  { label: 'Year of Study', key: 'year', type: 'number' },
                  { label: 'Phone', key: 'phone', type: 'tel' },
                ].map(({ label, key, type, readOnly }) => (
                  <div key={key}>
                    <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                    {editing && !readOnly ? (
                      <input type={type} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{user?.[key] || <span className="text-gray-400 italic">Not set</span>}</p>
                    )}
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-gray-500 mb-1">Bio</p>
                  {editing ? (
                    <textarea value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                      rows={2} placeholder="Tell others about yourself..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 resize-none" />
                  ) : (
                    <p className="text-sm text-gray-900">{user?.bio || <span className="text-gray-400 italic">No bio added</span>}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Study Pattern */}
            <Section title="Study Pattern">
              <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg">
                <div>
                  <p className="font-bold text-primary-700">{user?.cluster?.label || 'Not assigned'}</p>
                  <p className="text-xs text-gray-500">Confidence: {user?.cluster?.confidence || 0}%</p>
                </div>
              </div>
            </Section>

            {/* Subjects */}
            <Section title="Subjects & Skills">
              {editing ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {SUBJECT_OPTIONS.map(sub => (
                      <button key={sub} onClick={() => toggleSubject(sub)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${form.subjects.find(s => s.name === sub) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {sub}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={customSubject} onChange={e => setCustomSubject(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCustomSubject()}
                      placeholder="Add custom subject..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
                    <button onClick={addCustomSubject} className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">+ Add</button>
                  </div>
                  {form.subjects.map(sub => (
                    <div key={sub.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">{sub.name}</span>
                      <div className="flex items-center gap-2">
                        <select value={sub.skill} onChange={e => setForm(f => ({ ...f, subjects: f.subjects.map(s => s.name === sub.name ? { ...s, skill: e.target.value } : s) }))}
                          className="px-2 py-1 border border-gray-300 rounded text-sm">
                          <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                        </select>
                        <button onClick={() => toggleSubject(sub.name)} className="text-red-400 hover:text-red-600">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                user?.subjects?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.subjects.map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">{s.name} — {s.skill}</span>
                    ))}
                  </div>
                ) : <p className="text-gray-400 italic text-sm">No subjects added</p>
              )}
            </Section>

            {/* Availability */}
            <Section title="Weekly Availability">
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <label key={day} className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input type="checkbox" checked={form.availability?.some(a => a.day === day)} onChange={() => toggleDay(day)}
                        className="w-4 h-4 text-primary-600 rounded" />
                      <span className="text-sm font-medium text-gray-900">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              ) : (
                user?.availability?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.availability.map((a, i) => (
                      <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">{a.day}</span>
                    ))}
                  </div>
                ) : <p className="text-gray-400 italic text-sm">No availability set</p>
              )}
            </Section>

            {/* Preferences */}
            <Section title="Study Preferences">
              {editing ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Study Mode', key: 'mode', parent: 'preferences', options: [['online','Online'],['offline','Offline'],['hybrid','Hybrid']] },
                    { label: 'Communication', key: 'communication', parent: 'preferences', options: [['chat','Text Chat'],['voice','Voice'],['both','Both']] },
                    { label: 'Study Time', key: 'timeWindow', parent: 'behavior', options: [['morning','Morning (6am–12pm)'],['afternoon','Afternoon (12pm–6pm)'],['evening','Evening (6pm–10pm)'],['night','Night (10pm–6am)']] },
                  ].map(({ label, key, parent, options }) => (
                    <div key={key}>
                      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                      <select value={form[parent]?.[key] || ''} onChange={e => setForm(f => ({ ...f, [parent]: { ...f[parent], [key]: e.target.value } }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  ))}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Group Size</p>
                    <input type="number" min={2} max={8} value={form.preferences?.groupSize || 4}
                      onChange={e => setForm(f => ({ ...f, preferences: { ...f.preferences, groupSize: parseInt(e.target.value) } }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Mode', value: user?.preferences?.mode },
                    { label: 'Communication', value: user?.preferences?.communication },
                    { label: 'Group Size', value: user?.preferences?.groupSize },
                    { label: 'Study Time', value: user?.behavior?.timeWindow },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="font-medium text-gray-900 capitalize text-sm">{value || <span className="text-gray-400 italic">—</span>}</p>
                    </div>
                  ))}
                </div>
              )}
            </Section>

          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Take a Photo</h3>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg mb-4 bg-black" />
            <div className="flex gap-3">
              <button onClick={capturePhoto} className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">Capture</button>
              <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setShowCamera(false); }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
