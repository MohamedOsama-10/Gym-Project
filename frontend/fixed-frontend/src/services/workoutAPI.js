// src/services/workoutAPI.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const getToken = () => localStorage.getItem('access_token');

let _refreshing = null;
const refreshAccessToken = async () => {
  if (_refreshing) return _refreshing;
  _refreshing = (async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) return null;
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        return data.access_token;
      }
      return null;
    } catch { return null; }
    finally { _refreshing = null; }
  })();
  return _refreshing;
};

const clearSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

const apiRequest = async (endpoint, options = {}, _retried = false) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  if (response.status === 401 && !_retried) {
    const newToken = await refreshAccessToken();
    if (newToken) return apiRequest(endpoint, options, true);
    clearSession();
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.status === 204 ? null : response.json();
};

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
