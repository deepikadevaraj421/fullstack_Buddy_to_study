import { useState, useEffect } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };
const DURATION_OPTIONS = [30, 45, 60, 90, 120];

const timeWindowLabel = {
  morning: 'Morning (6am – 12pm)',
  afternoon: 'Afternoon (12pm – 6pm)',
  evening: 'Evening (6pm – 10pm)',
  night: 'Night (10pm – 6am)',
};

const emptySlot = () => ({ days: [], startTime: '', durationMinutes: 60 });

export default function InviteModal({ isOpen, onClose, invitee, inviteeProfile, currentUser, subject, onSendInvite }) {
  const [groupName, setGroupName] = useState('');
  const [message, setMessage] = useState('');
  const [slots, setSlots] = useState([emptySlot()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setGroupName(subject ? `${subject} Study Group` : `${invitee?.name || 'Study'} Group`);
    setMessage('');
    setSlots([emptySlot()]);
    setActiveIdx(0);
    setError('');
  }, [isOpen, invitee, subject]);

  if (!isOpen) return null;

  // Invitee's default study info
  const inviteeDays = inviteeProfile?.availability?.map(a => a.day) || [];
  const inviteeTime = inviteeProfile?.behavior?.timeWindow;
  const inviteeStartTime = inviteeProfile?.availability?.[0]?.startTime || '';
  const inviteeDuration = inviteeProfile?.preferences?.sessionDuration || 60;

  const active = slots[activeIdx] || slots[0];

  const updateSlot = (patch) => {
    setSlots(prev => prev.map((s, i) => i === activeIdx ? { ...s, ...patch } : s));
  };

  const toggleDay = (day) => {
    updateSlot({ days: active.days.includes(day) ? active.days.filter(d => d !== day) : [...active.days, day] });
  };

  const addSlot = () => {
    if (slots.length >= 3) return;
    setSlots(prev => [...prev, emptySlot()]);
    setActiveIdx(slots.length);
  };

  const removeSlot = (idx) => {
    if (slots.length <= 1) return;
    setSlots(prev => prev.filter((_, i) => i !== idx));
    setActiveIdx(Math.max(0, activeIdx >= idx ? activeIdx - 1 : activeIdx));
  };

  // Pre-fill slot from invitee's schedule
  const prefillFromInvitee = () => {
    updateSlot({ days: inviteeDays, startTime: inviteeStartTime, durationMinutes: inviteeDuration });
  };

  const handleSend = async () => {
    if (!groupName.trim()) { setError('Group name is required.'); return; }
    const valid = slots.filter(s => s.days.length > 0 && s.startTime);
    if (valid.length === 0) { setError('Add at least one time option with days and start time.'); return; }
    setError('');
    await onSendInvite({
      groupName: groupName.trim(),
      inviteeId: invitee?._id || invitee?.userId,
      proposedSchedules: valid,
      message: message.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Invite {invitee?.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">Propose a study schedule</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Invitee's default schedule */}
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
            <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-2">
              {invitee?.name}'s Default Study Time
            </p>
            {inviteeDays.length > 0 || inviteeTime ? (
              <div className="space-y-1">
                {inviteeDays.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {inviteeDays.map(d => (
                      <span key={d} className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full text-xs font-medium">{DAY_SHORT[d] || d}</span>
                    ))}
                  </div>
                )}
                {inviteeTime && <p className="text-sm text-teal-800">⏰ {timeWindowLabel[inviteeTime] || inviteeTime}</p>}
                {inviteeStartTime && <p className="text-sm text-teal-800">🕐 Starts at {inviteeStartTime} • {inviteeDuration} min</p>}
                <button onClick={prefillFromInvitee} className="mt-2 text-xs font-semibold text-teal-700 hover:text-teal-900 underline">
                  Use this schedule as my proposal
                </button>
              </div>
            ) : (
              <p className="text-sm text-teal-700 italic">{invitee?.name} hasn't set a default schedule yet.</p>
            )}
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Group Name *</label>
            <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="e.g. DSA Study Group" />
          </div>

          {/* Time Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Proposed Time Options *</label>
              {slots.length < 3 && (
                <button onClick={addSlot} className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                  + Add another option
                </button>
              )}
            </div>

            {/* Slot tabs */}
            {slots.length > 1 && (
              <div className="flex gap-2 mb-3">
                {slots.map((_, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <button onClick={() => setActiveIdx(i)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${activeIdx === i ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      Option {i + 1}
                    </button>
                    {slots.length > 1 && (
                      <button onClick={() => removeSlot(i)} className="text-gray-400 hover:text-red-500 text-xs">×</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Active slot editor */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Select Days</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button key={day} onClick={() => toggleDay(day)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition ${active.days.includes(day) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'}`}>
                      {DAY_SHORT[day]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                  <input type="time" value={active.startTime} onChange={e => updateSlot({ startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                  <select value={active.durationMinutes} onChange={e => updateSlot({ durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-200">
                    {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Message (optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
              placeholder={`Hi ${invitee?.name}, let's study together!`}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
              maxLength={500} />
            <p className="text-xs text-gray-400 text-right mt-1">{message.length}/500</p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm">
            Cancel
          </button>
          <button onClick={handleSend} className="px-5 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold text-sm">
            Send Invite
          </button>
        </div>
      </div>
    </div>
  );
}
