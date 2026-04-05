// src/services/workoutStorage.js
// Single source of truth for the completedWorkoutDays localStorage key.
// Previously this key string was duplicated across Workouts.jsx, Progress.jsx,
// and UserDashboard.jsx — any rename would have required three edits.

export const getWorkoutKey = (userId) =>
  `completedWorkoutDays_${userId || 'guest'}`;

export function readCompletedWorkoutDays(userId) {
  try {
    return JSON.parse(localStorage.getItem(getWorkoutKey(userId)) || '{}');
  } catch {
    return {};
  }
}

export function writeCompletedWorkoutDays(userId, data) {
  localStorage.setItem(getWorkoutKey(userId), JSON.stringify(data));
}
