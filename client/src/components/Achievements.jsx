import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const BADGE_DEFS = [
  { id: 'first_session', icon: '🎯', label: 'First Session', desc: 'Attended your very first study session', color: 'from-blue-400 to-blue-600' },
  { id: 'streak_3', icon: '🔥', label: '3-Day Streak', desc: 'Studied 3 days in a row', color: 'from-orange-400 to-red-500' },
  { id: 'streak_7', icon: '⚡', label: 'Week Warrior', desc: 'Maintained a 7-day study streak', color: 'from-yellow-400 to-orange-500' },
  { id: 'streak_30', icon: '🏆', label: 'Monthly Master', desc: '30-day unbroken study streak', color: 'from-yellow-500 to-amber-600' },
  { id: 'top_3', icon: '🥇', label: 'Podium Finisher', desc: 'Reached top 3 on the leaderboard', color: 'from-yellow-300 to-yellow-500' },
  { id: 'tasks_5', icon: '✅', label: 'Task Crusher', desc: 'Completed 5 group tasks', color: 'from-green-400 to-teal-500' },
  { id: 'tasks_20', icon: '💪', label: 'Task Champion', desc: 'Completed 20 group tasks', color: 'from-teal-500 to-cyan-600' },
  { id: 'group_creator', icon: '👥', label: 'Group Creator', desc: 'Created your first study group', color: 'from-purple-400 to-purple-600' },
  { id: 'inviter', icon: '📨', label: 'Social Butterfly', desc: 'Sent 3+ study invites', color: 'from-pink-400 to-rose-500' },
  { id: 'multi_subject', icon: '📚', label: 'Polymath', desc: 'Added 3+ subjects to your profile', color: 'from-indigo-400 to-blue-500' },
  { id: 'perfect_attendance', icon: '🌟', label: 'Perfect Attendance', desc: '100% attendance in a group', color: 'from-amber-400 to-yellow-500' },
  { id: 'early_bird', icon: '🌅', label: 'Early Bird', desc: 'Joined a session before 8 AM', color: 'from-orange-300 to-pink-400' },
];

const computeBadges = (user, leaderboard, rank) => {
  const earned = new Set();
  if (!user) return earned;

  if ((user.streak || 0) >= 1) earned.add('first_session');
  if ((user.streak || 0) >= 3) earned.add('streak_3');
  if ((user.streak || 0) >= 7) earned.add('streak_7');
  if ((user.streak || 0) >= 30) earned.add('streak_30');
  if (rank > 0 && rank <= 3) earned.add('top_3');
  if ((user.subjects?.length || 0) >= 3) earned.add('multi_subject');
  return earned;
};

const Achievements = ({ user, leaderboard, rank, compact = false }) => {
  const [showAll, setShowAll] = useState(false);
  const earned = computeBadges(user, leaderboard, rank);
  const earnedBadges = BADGE_DEFS.filter(b => earned.has(b.id));
  const lockedBadges = BADGE_DEFS.filter(b => !earned.has(b.id));
  const display = showAll ? BADGE_DEFS : [...earnedBadges, ...lockedBadges].slice(0, compact ? 4 : 8);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {earnedBadges.slice(0, 6).map(b => (
          <div key={b.id} title={`${b.label}: ${b.desc}`}
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${b.color} flex items-center justify-center shadow-sm text-lg cursor-default`}>
            {b.icon}
          </div>
        ))}
        {earnedBadges.length === 0 && (
          <p className="text-sm text-gray-400">Complete sessions to earn badges!</p>
        )}
        {earnedBadges.length > 6 && (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
            +{earnedBadges.length - 6}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
          <p className="text-sm text-gray-500 mt-0.5">{earnedBadges.length}/{BADGE_DEFS.length} badges earned</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
              style={{ width: `${(earnedBadges.length / BADGE_DEFS.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {display.map(badge => {
          const isEarned = earned.has(badge.id);
          return (
            <div key={badge.id}
              className={`relative flex flex-col items-center p-3 rounded-xl border text-center transition
                ${isEarned
                  ? 'border-transparent bg-gradient-to-br ' + badge.color + ' shadow-md'
                  : 'border-gray-100 bg-gray-50 opacity-50 grayscale'
                }`}>
              <span className="text-3xl mb-1">{badge.icon}</span>
              <p className={`font-bold text-xs leading-tight ${isEarned ? 'text-white' : 'text-gray-700'}`}>
                {badge.label}
              </p>
              <p className={`text-xs mt-0.5 leading-tight ${isEarned ? 'text-white/80' : 'text-gray-400'}`}>
                {badge.desc}
              </p>
              {isEarned && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow">
                  <span className="text-[10px]">✓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {BADGE_DEFS.length > (compact ? 4 : 8) && (
        <button onClick={() => setShowAll(v => !v)}
          className="mt-4 w-full py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-xl transition">
          {showAll ? 'Show Less ↑' : `Show All ${BADGE_DEFS.length} Badges ↓`}
        </button>
      )}
    </div>
  );
};

export { BADGE_DEFS, computeBadges };
export default Achievements;
