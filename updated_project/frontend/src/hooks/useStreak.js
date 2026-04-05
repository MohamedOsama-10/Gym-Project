// src/hooks/useStreak.js
// Shared login-streak hook used by CoachDashboard and UserDashboard.
//
// FIX: streak key is now scoped per userId so that multiple users sharing
// a browser (e.g. family device, public gym kiosk) don't bleed into each other.
// Pass the current user's id; falls back to 'guest' when not yet known.
//
// FIX: getStreakMessage is exported so both dashboards use identical milestone
// copy instead of each maintaining their own version.

import { useState, useEffect } from 'react';

const getStreakKey = (userId) => `streakData_${userId || 'guest'}`;

const getTodayKey = () => new Date().toISOString().split('T')[0];

function getStreakData(userId) {
  try {
    const stored = localStorage.getItem(getStreakKey(userId));
    return stored
      ? JSON.parse(stored)
      : { streak: 0, lastLoginDate: null, loginDates: [] };
  } catch {
    return { streak: 0, lastLoginDate: null, loginDates: [] };
  }
}

function saveStreakData(userId, data) {
  localStorage.setItem(getStreakKey(userId), JSON.stringify(data));
}

function computeStreak(userId) {
  const data = getStreakData(userId);
  const today = getTodayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split('T')[0];

  // Already logged in today — no change
  if (data.lastLoginDate === today) return data.streak;

  // Continuing an existing streak (logged in yesterday or first-ever login)
  if (data.lastLoginDate === yesterdayKey || data.lastLoginDate === null) {
    const newStreak = data.streak + 1;
    saveStreakData(userId, {
      streak: newStreak,
      lastLoginDate: today,
      loginDates: [...(data.loginDates || []), today],
    });
    return newStreak;
  }

  // Streak broken — reset to 1
  saveStreakData(userId, { streak: 1, lastLoginDate: today, loginDates: [today] });
  return 1;
}

/**
 * Returns a human-readable streak milestone label.
 * Shared between UserDashboard and CoachDashboard.
 */
export function getStreakMessage(streakCount) {
  if (streakCount === 1)   return 'First Day! 🎉';
  if (streakCount === 7)   return 'One Week! 🔥';
  if (streakCount === 30)  return 'One Month! 💪';
  if (streakCount === 100) return 'Century! 🏆';
  if (streakCount >= 365)  return 'One Year! 🌟';
  return 'Day Streak 🔥';
}

/**
 * Returns { streak, showStreakAnimation }.
 * showStreakAnimation is true for 3 s on the first login of a new day
 * when the streak has grown beyond 1.
 *
 * @param {string|number} [userId] - Current user's id for per-user isolation.
 */
export function useStreak(userId) {
  const [streak, setStreak] = useState(0);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);

  useEffect(() => {
    const prevData = getStreakData(userId);
    const wasAlreadyToday = prevData.lastLoginDate === getTodayKey();
    const currentStreak = computeStreak(userId);
    setStreak(currentStreak);

    if (!wasAlreadyToday && currentStreak > 1) {
      setShowStreakAnimation(true);
      const timer = setTimeout(() => setShowStreakAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { streak, showStreakAnimation };
}
