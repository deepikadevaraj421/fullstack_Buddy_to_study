import { useEffect, useMemo, useState } from 'react';

/**
 * Data assumptions (based on server User model):
 * - user.availability: [{ day: 'Monday', startTime: '19:00', endTime: '21:00' }]
 * - user.preferences.sessionDuration: number (minutes)
 *
 * Proposed schedule payload expected by existing /invites endpoint usage:
 * - [{ days: ['Monday','Wednesday'], startTime: '19:00', durationMinutes: 60 }, ...]
 */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun'
};
const DURATION_OPTIONS = [30, 45, 60, 90, 120];

function minutesFromTimeStr(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const [hh, mm] = timeStr.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

function timeStrFromMinutes(totalMins) {
  if (totalMins == null || Number.isNaN(totalMins)) return '';
  const hh = Math.floor(totalMins / 60);
  const mm = totalMins % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Derive a "default schedule" from user profile.
 * Returns { days: string[], startTime: string, durationMinutes: number } | null
 */
function getDefaultScheduleFromProfile(profile) {
  if (!profile) return null;

  // Days from availability entries
  const availability = Array.isArray(profile.availability) ? profile.availability : [];
  const uniqDays = Array.from(
    new Set(
      availability
        .map(a => a?.day)
        .filter(Boolean)
        .filter(d => DAYS.includes(d))
    )
  );

  // Choose a representative start time: earliest available startTime
  const times = availability
    .map(a => a?.startTime)
    .filter(Boolean)
    .map(t => ({ t, mins: minutesFromTimeStr(t) }))
    .filter(x => x.mins != null)
    .sort((a, b) => a.mins - b.mins);

  const startTime = times.length ? times[0].t : '';

  // Duration: preferences.sessionDuration if exists; else compute from first availability (end-start); else 60
  let durationMinutes = typeof profile.preferences?.sessionDuration === 'number'
    ? profile.preferences.sessionDuration
    : null;

  if (durationMinutes == null) {
    const a0 = availability.find(a => a?.startTime && a?.endTime);
    if (a0) {
      const start = minutesFromTimeStr(a0.startTime);
      const end = minutesFromTimeStr(a0.endTime);
      if (start != null && end != null) {
        const diff = end - start;
        if (diff > 0) durationMinutes = diff;
      }
    }
  }

  if (durationMinutes == null) durationMinutes = 60;

  // If nothing meaningful set, return null
  const hasAny = uniqDays.length > 0 || !!startTime || !!durationMinutes;
  if (!hasAny) return null;

  return {
    days: uniqDays,
    startTime,
    durationMinutes
  };
}

function formatScheduleText(schedule) {
  if (!schedule) return '';
  const days = Array.isArray(schedule.days) ? schedule.days : [];
  const dayText = days.length ? days.map(d => DAY_SHORT[d] || d).join(', ') : 'No days selected';
  const timeText = schedule.startTime ? schedule.startTime : 'No time set';
  const durText = schedule.durationMinutes ? `${schedule.durationMinutes} min` : 'No duration set';
  return `${dayText} • ${timeText} • ${durText}`;
}

function DayChips({ selectedDays, onToggleDay, error }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {DAYS.map(day => {
          const selected = selectedDays.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => onToggleDay(day)}
              className={[
                'px-3 py-1 rounded-full text-xs font-medium border transition',
                selected
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:text-primary-700'
              ].join(' ')}
            >
              {DAY_SHORT[day]}
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function ReadonlyScheduleCard({ tone = 'teal', schedule, emptyText }) {
  const bg = tone === 'teal' ? 'bg-teal-50' : 'bg-gray-50';
  const border = tone === 'teal' ? 'border-teal-100' : 'border-gray-200';
  const text = tone === 'teal' ? 'text-teal-900' : 'text-gray-900';
  const subText = tone === 'teal' ? 'text-teal-700' : 'text-gray-600';

  return (
    <div className={`${bg} ${border} border rounded-xl p-4`}>
      {schedule ? (
        <div className="space-y-1">
          <p className={`text-sm font-semibold ${text}`}>{formatScheduleText(schedule)}</p>
          <p className={`text-xs ${subText}`}>
            Days, start time, and duration are taken from the profile default.
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-600">{emptyText}</p>
      )}
    </div>
  );
}

function ProposalCard({
  index,
  proposal,
  active,
  onSelect,
  onRemove,
  canRemove
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'w-full text-left border rounded-xl p-3 transition',
        active ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300 bg-white'
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-700">Option {index + 1}</p>
          <p className="text-sm font-medium text-gray-900">{formatScheduleText(proposal)}</p>
        </div>
        {canRemove ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-xs font-semibold text-gray-500 hover:text-red-600"
          >
            Remove
          </button>
        ) : null}
      </div>
    </button>
  );
}

export default function InviteModal({
  isOpen,
  onClose,
  invitee,
  currentUser,
  subject,
  onSendInvite
}) {
  const inviteeDefault = useMemo(() => getDefaultScheduleFromProfile(invitee), [invitee]);
  const yourDefault = useMemo(() => getDefaultScheduleFromProfile(currentUser), [currentUser]);

  const initialGroupName = useMemo(() => {
    const inviteeName = invitee?.name || 'Buddy';
    const sub = subject?.trim();
    if (sub) return `${sub} Study Group`;
    return `${inviteeName}'s Study Group`;
  }, [invitee, subject]);

  const initialProposal = useMemo(() => {
    return {
      days: yourDefault?.days?.length ? yourDefault.days : [],
      startTime: yourDefault?.startTime || '',
      durationMinutes: typeof yourDefault?.durationMinutes === 'number' ? yourDefault.durationMinutes : 60
    };
  }, [yourDefault]);

  const [groupName, setGroupName] = useState('');
  const [message, setMessage] = useState('');
  const [proposals, setProposals] = useState([{ days: [], startTime: '', durationMinutes: 60 }]);
  const [activeProposalIndex, setActiveProposalIndex] = useState(0);
  const [touched, setTouched] = useState({ groupName: false, proposal: false, message: false });
  const [errors, setErrors] = useState({ groupName: '', proposal: '' });

  // Reset + autofill on open
  useEffect(() => {
    if (!isOpen) return;
    setGroupName(initialGroupName);
    setMessage('');
    setProposals([initialProposal]);
    setActiveProposalIndex(0);
    setTouched({ groupName: false, proposal: false, message: false });
    setErrors({ groupName: '', proposal: '' });
  }, [isOpen, initialGroupName, initialProposal]);

  const activeProposal = proposals[activeProposalIndex] || proposals[0];

  const validate = (next = { groupName, proposals }) => {
    const nextErrors = { groupName: '', proposal: '' };

    if (!next.groupName || !next.groupName.trim()) {
      nextErrors.groupName = 'Group name is required.';
    }

    const hasAtLeastOneValidProposal = Array.isArray(next.proposals) && next.proposals.some(p => {
      const hasDays = Array.isArray(p.days) && p.days.length > 0;
      const hasTime = !!p.startTime;
      const hasDuration = typeof p.durationMinutes === 'number' && p.durationMinutes > 0;
      return hasDays && hasTime && hasDuration;
    });

    if (!hasAtLeastOneValidProposal) {
      nextErrors.proposal = 'Add at least one proposed schedule with days, time, and duration.';
    }

    return nextErrors;
  };

  const canSend = useMemo(() => {
    const nextErrors = validate();
    return !nextErrors.groupName && !nextErrors.proposal;
  }, [groupName, proposals]);

  const updateActiveProposal = (patch) => {
    setProposals(prev => {
      const copy = [...prev];
      const current = copy[activeProposalIndex] || copy[0] || { days: [], startTime: '', durationMinutes: 60 };
      copy[activeProposalIndex] = { ...current, ...patch };
      return copy;
    });
  };

  const toggleDay = (day) => {
    updateActiveProposal({
      days: activeProposal.days.includes(day)
        ? activeProposal.days.filter(d => d !== day)
        : [...activeProposal.days, day]
    });
  };

  const addProposal = () => {
    setProposals(prev => {
      if (prev.length >= 3) return prev;
      const base = prev[0] || initialProposal;
      const next = [
        ...prev,
        {
          days: Array.isArray(base.days) ? [...base.days] : [],
          startTime: base.startTime || '',
          durationMinutes: typeof base.durationMinutes === 'number' ? base.durationMinutes : 60
        }
      ];
      return next;
    });
    setActiveProposalIndex(prev => clamp(prev + 1, 0, 2));
  };

  const removeProposalAt = (idx) => {
    setProposals(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== idx);
      return next;
    });
    setActiveProposalIndex(prev => {
      if (idx === prev) return Math.max(0, prev - 1);
      if (idx < prev) return prev - 1;
      return prev;
    });
  };

  const handleSend = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    setTouched(t => ({ ...t, groupName: true, proposal: true }));

    if (nextErrors.groupName || nextErrors.proposal) return;

    const payload = {
      groupName: groupName.trim(),
      inviteeId: invitee?._id || invitee?.userId,
      proposedSchedules: proposals.map(p => ({
        days: p.days,
        startTime: p.startTime,
        durationMinutes: p.durationMinutes
      })),
      message: message?.trim() || ''
    };

    if (typeof onSendInvite === 'function') {
      await onSendInvite(payload);
    } else {
      // fallback if backend not connected
      console.log('Invite payload:', payload);
    }

    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                Invite {invitee?.name || 'User'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Propose a schedule based on your default study pattern.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close invite modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {/* 1) Group Name */}
          <section>
            <h4 className="text-sm font-bold text-gray-900 mb-3">Group Name</h4>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => {
                const v = e.target.value;
                setGroupName(v);
                if (touched.groupName) setErrors(prev => ({ ...prev, groupName: validate({ groupName: v, proposals }).groupName }));
              }}
              onBlur={() => {
                setTouched(t => ({ ...t, groupName: true }));
                setErrors(prev => ({ ...prev, groupName: validate({ groupName, proposals }).groupName }));
              }}
              className={[
                'w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200',
                errors.groupName ? 'border-red-300' : 'border-gray-200'
              ].join(' ')}
              placeholder="Group name"
            />
            {errors.groupName && touched.groupName ? (
              <p className="mt-2 text-xs text-red-600">{errors.groupName}</p>
            ) : null}
          </section>

          {/* 2) Invitee Default Schedule */}
          <section>
            <h4 className="text-sm font-bold text-gray-900 mb-3">Invitee’s Default Study Schedule</h4>
            <ReadonlyScheduleCard
              tone="teal"
              schedule={inviteeDefault && inviteeDefault.days?.length ? inviteeDefault : null}
              emptyText="Invitee has not set a default schedule yet."
            />
          </section>

          {/* 3) Your Default Schedule */}
          <section>
            <h4 className="text-sm font-bold text-gray-900 mb-3">Your Default Study Schedule</h4>
            <ReadonlyScheduleCard
              tone="gray"
              schedule={yourDefault && yourDefault.days?.length ? yourDefault : null}
              emptyText="You have not set a default schedule yet."
            />
          </section>

          {/* 4) Proposed Schedule */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h4 className="text-sm font-bold text-gray-900">Proposed Schedule (You can adjust)</h4>
              <button
                type="button"
                onClick={addProposal}
                disabled={proposals.length >= 3}
                className={[
                  'text-sm font-semibold',
                  proposals.length >= 3 ? 'text-gray-400 cursor-not-allowed' : 'text-primary-600 hover:text-primary-700'
                ].join(' ')}
              >
                + Add another option
              </button>
            </div>

            {/* Proposal list */}
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              {proposals.map((p, idx) => (
                <ProposalCard
                  key={idx}
                  index={idx}
                  proposal={p}
                  active={idx === activeProposalIndex}
                  onSelect={() => setActiveProposalIndex(idx)}
                  onRemove={() => removeProposalAt(idx)}
                  canRemove={proposals.length > 1}
                />
              ))}
            </div>

            {/* Editable fields */}
            <div className="border border-gray-200 rounded-2xl p-4 bg-white">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Days</label>
                  <DayChips
                    selectedDays={activeProposal?.days || []}
                    onToggleDay={(day) => {
                      setTouched(t => ({ ...t, proposal: true }));
                      toggleDay(day);
                      if (touched.proposal) setErrors(prev => ({ ...prev, proposal: validate({ groupName, proposals }).proposal }));
                    }}
                    error={errors.proposal && touched.proposal ? errors.proposal : ''}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={activeProposal?.startTime || ''}
                      onChange={(e) => {
                        setTouched(t => ({ ...t, proposal: true }));
                        updateActiveProposal({ startTime: e.target.value });
                        if (touched.proposal) setErrors(prev => ({ ...prev, proposal: validate({ groupName, proposals }).proposal }));
                      }}
                      onBlur={() => {
                        setTouched(t => ({ ...t, proposal: true }));
                        setErrors(prev => ({ ...prev, proposal: validate({ groupName, proposals }).proposal }));
                      }}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                    <select
                      value={activeProposal?.durationMinutes ?? 60}
                      onChange={(e) => {
                        setTouched(t => ({ ...t, proposal: true }));
                        updateActiveProposal({ durationMinutes: Number(e.target.value) });
                        if (touched.proposal) setErrors(prev => ({ ...prev, proposal: validate({ groupName, proposals }).proposal }));
                      }}
                      onBlur={() => {
                        setTouched(t => ({ ...t, proposal: true }));
                        setErrors(prev => ({ ...prev, proposal: validate({ groupName, proposals }).proposal }));
                      }}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      {DURATION_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>
                          {opt} minutes
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {errors.proposal && touched.proposal ? (
                  <p className="text-xs text-red-600">{errors.proposal}</p>
                ) : (
                  <p className="text-xs text-gray-500">
                    You can propose up to 3 options. Each option needs at least one day, a time, and a duration.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 5) Message */}
          <section>
            <h4 className="text-sm font-bold text-gray-900 mb-3">Message (optional)</h4>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setTouched(t => ({ ...t, message: true }));
              }}
              rows={3}
              placeholder="Add a message…"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200"
              maxLength={500}
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500">Optional</p>
              <p className="text-xs text-gray-500">{message.length}/500</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="sm:w-auto w-full px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-semibold text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={[
              'sm:w-auto w-full px-5 py-2 rounded-xl transition font-semibold text-white',
              canSend ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-300 cursor-not-allowed'
            ].join(' ')}
          >
            Send Invite
          </button>
        </div>
      </div>
    </div>
  );
}
