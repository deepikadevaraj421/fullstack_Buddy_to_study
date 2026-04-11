import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../utils/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM – 8 PM

const SUBJECT_COLORS = [
  { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  { bg: 'bg-pink-500', light: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  { bg: 'bg-teal-500', light: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
];

const formatHour = (h) => {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h;
  return `${display}:00 ${suffix}`;
};

const Planner = () => {
  const [user, setUser] = useState(null);
  const [slots, setSlots] = useState(() => {
    try { return JSON.parse(localStorage.getItem('studySlots') || '[]'); } catch { return []; }
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [weeklyGoal, setWeeklyGoal] = useState(() => parseInt(localStorage.getItem('weeklyGoal') || '10'));
  const [editingGoal, setEditingGoal] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ subject: '', duration: 60, note: '' });

  useEffect(() => {
    api.get('/auth/me').then(res => {
      setUser(res.data);
      setSubjects(res.data.subjects?.map(s => s.name) || []);
    }).catch(() => {});
  }, []);

  useEffect(() => { localStorage.setItem('studySlots', JSON.stringify(slots)); }, [slots]);
  useEffect(() => { localStorage.setItem('weeklyGoal', weeklyGoal); }, [weeklyGoal]);

  const totalPlannedHours = slots.reduce((sum, s) => sum + (s.duration / 60), 0);
  const goalPct = Math.min(100, Math.round((totalPlannedHours / weeklyGoal) * 100));
  const getSlotAt = (day, hour) => slots.find(s => s.day === day && s.hour === hour);
  const getSubjectColor = (subject) => {
    const idx = subjects.indexOf(subject);
    return SUBJECT_COLORS[idx >= 0 ? idx % SUBJECT_COLORS.length : 0];
  };
  const openAdd = (day, hour) => {
    if (getSlotAt(day, hour)) return;
    setSelectedCell({ day, hour });
    setForm({ subject: subjects[0] || '', duration: 60, note: '' });
    setShowModal(true);
  };
  const addSlot = () => {
    if (!form.subject) return;
    setSlots(prev => [...prev, { day: selectedCell.day, hour: selectedCell.hour, ...form, id: Date.now() }]);
    setShowModal(false);
  };
  const removeSlot = (id) => setSlots(prev => prev.filter(s => s.id !== id));
  const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Header — compact */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Study Planner</h1>
              <p className="text-sm text-gray-500 mt-0.5">Plan your week and hit your study goals</p>
            </div>

            {/* Goal widget — compact */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 flex items-center gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-primary-600 leading-tight">{totalPlannedHours.toFixed(1)}h</p>
                <p className="text-xs text-gray-400">planned</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              {editingGoal ? (
                <div className="flex items-center gap-2">
                  <input type="number" value={weeklyGoal} min={1} max={80}
                    onChange={e => setWeeklyGoal(parseInt(e.target.value) || 1)}
                    className="w-14 px-2 py-1 border rounded-lg text-sm text-center" />
                  <button onClick={() => setEditingGoal(false)}
                    className="text-xs text-primary-600 font-bold">Save</button>
                </div>
              ) : (
                <div className="text-center cursor-pointer" onClick={() => setEditingGoal(true)}>
                  <p className="text-lg font-bold text-gray-700 leading-tight">{weeklyGoal}h</p>
                  <p className="text-xs text-gray-400">goal (edit)</p>
                </div>
              )}
              <div className="w-20">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span><span>{goalPct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                    style={{ width: `${goalPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Subject legend */}
          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {subjects.map((s, i) => {
                const c = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
                return (
                  <span key={s} className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.light} ${c.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.bg}`} />
                    {s}
                  </span>
                );
              })}
            </div>
          )}

          {/* Grid — compact rows */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-auto">
            <div className="grid" style={{ gridTemplateColumns: `52px repeat(7, 1fr)`, minWidth: '640px' }}>

              {/* Header row */}
              <div className="border-b border-r border-gray-100" />
              {DAYS.map(day => (
                <div key={day}
                  className={`border-b border-r border-gray-100 py-1.5 text-center text-xs font-bold
                    ${day === today ? 'bg-primary-50 text-primary-700' : 'text-gray-500'}`}>
                  {day.slice(0, 3)}
                  {day === today && <span className="block text-[10px] font-normal text-primary-400">Today</span>}
                </div>
              ))}

              {/* Hour rows */}
              {HOURS.map(hour => (
                <>
                  <div key={`h-${hour}`}
                    className="border-b border-r border-gray-100 text-[10px] text-gray-400 text-right pr-1.5 leading-none select-none flex items-center justify-end">
                    {formatHour(hour)}
                  </div>
                  {DAYS.map(day => {
                    const slot = getSlotAt(day, hour);
                    return (
                      <div key={`${day}-${hour}`}
                        className={`border-b border-r border-gray-100 p-0.5 h-9 relative transition
                          ${!slot ? 'hover:bg-primary-50/40 cursor-pointer' : ''}`}
                        onClick={() => openAdd(day, hour)}>
                        {slot && (() => {
                          const c = getSubjectColor(slot.subject);
                          return (
                            <div className={`h-full rounded ${c.light} ${c.text} border ${c.border} px-1.5 flex items-center justify-between group`}>
                              <span className="font-semibold text-[10px] truncate flex-1">{slot.subject}</span>
                              <button onClick={e => { e.stopPropagation(); removeSlot(slot.id); }}
                                className="opacity-0 group-hover:opacity-100 text-red-400 text-[10px] ml-1 flex-shrink-0 transition">
                                x
                              </button>
                            </div>
                          );
                        })()}
                        {!slot && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                            <span className="text-primary-400 text-sm font-light">+</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>

          {/* Slots summary */}
          {slots.length > 0 && (
            <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h2 className="text-base font-bold text-gray-900 mb-3">This Week's Plan</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {slots.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.hour - b.hour)
                  .map(slot => {
                    const c = getSubjectColor(slot.subject);
                    return (
                      <div key={slot.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${c.light} ${c.border}`}>
                        <div className={`w-1.5 self-stretch rounded-full ${c.bg} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-xs ${c.text}`}>{slot.subject}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{slot.day} · {formatHour(slot.hour)} · {slot.duration}m</p>
                          {slot.note && <p className="text-[11px] text-gray-400 italic mt-0.5 truncate">"{slot.note}"</p>}
                        </div>
                        <button onClick={() => removeSlot(slot.id)}
                          className="text-gray-300 hover:text-red-400 transition text-xs flex-shrink-0">x</button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Slot Modal */}
      {showModal && selectedCell && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-0.5">Add Study Block</h3>
            <p className="text-xs text-gray-500 mb-4">{selectedCell.day} at {formatHour(selectedCell.hour)}</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
                {subjects.length > 0 ? (
                  <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-gray-50">
                    {subjects.map(s => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. DSA, Machine Learning..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Duration</label>
                <div className="flex gap-2">
                  {[30, 60, 90, 120].map(d => (
                    <button key={d} onClick={() => setForm(f => ({ ...f, duration: d }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition border
                        ${form.duration === d ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {d}m
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Note (optional)</label>
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. Chapter 5 revision..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={addSlot}
                className="flex-1 py-2 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition">
                Add Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner;
