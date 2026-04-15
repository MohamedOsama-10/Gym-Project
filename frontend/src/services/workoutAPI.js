// src/services/workoutAPI.js
import { apiRequest } from './httpClient';

// User Workout API
export const workoutAPI = {
  getMyWorkouts: (filters = {}) => {
    const p = new URLSearchParams();
    if (filters.type && filters.type !== 'all') p.append('filter_type', filters.type);
    if (filters.completed !== undefined) p.append('completed', filters.completed);
    const qs = p.toString();
    return apiRequest(`/workouts/my-workouts${qs ? '?' + qs : ''}`);
  },
  markWorkoutComplete: (workoutId, completed) => apiRequest(`/workouts/my-workouts/${workoutId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ completed, completedAt: completed ? new Date().toISOString() : null }),
  }),
  getWorkoutHistory:  (days = 7) => apiRequest(`/workouts/my-workouts/history?days=${days}`),
  getExerciseLibrary: (filters = {}) => {
    const p = new URLSearchParams();
    if (filters.category)   p.append('category', filters.category);
    if (filters.search)     p.append('search', filters.search);
    if (filters.difficulty) p.append('difficulty', filters.difficulty);
    const qs = p.toString();
    return apiRequest(`/workouts/exercises/library${qs ? '?' + qs : ''}`);
  },
  getWorkoutById: (workoutId) => apiRequest(`/workouts/my-workouts/${workoutId}`),
  getMyProgram:   () => apiRequest('/training-programs/my-program'),
};

// Coach Workout API
export const coachWorkoutAPI = {
  assignWorkout: (data) => apiRequest('/workouts/assign', {
    method: 'POST',
    body: JSON.stringify({
      customerId: data.customerId,
      workoutTemplateId: data.workoutId || data.workoutTemplateId,
      dueDate: data.dueDate,
      notes: data.notes,
    }),
  }),
  getCustomerWorkouts: (customerId) => apiRequest(`/workouts/coach/customers/${customerId}/workouts`),
  getWorkoutTemplates: () => apiRequest('/workouts/templates'),
};

// Admin/Owner Workout API
export const adminWorkoutAPI = {
  getAllWorkouts:        () => apiRequest('/workouts/all'),
  createWorkoutTemplate: (data) => apiRequest('/workouts/templates', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkoutTemplate: (id, data) => apiRequest(`/workouts/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWorkoutTemplate: (id) => apiRequest(`/workouts/templates/${id}`, { method: 'DELETE' }),
};

export default workoutAPI;
