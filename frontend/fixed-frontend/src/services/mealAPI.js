// src/services/mealAPI.js
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
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(!isFormData && { 'Content-Type': 'application/json' }),
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
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
};

export const mealAPI = {
  getMeals: (filters = {}) => {
    const p = new URLSearchParams();
    if (filters.type && filters.type !== 'all') p.append('meal_type', filters.type);
    if (filters.favoritesOnly) p.append('favorites_only', 'true');
    const qs = p.toString();
    return apiRequest(`/meals/library${qs ? '?' + qs : ''}`);
  },
  createCustomMeal: (mealData) => apiRequest('/meals/custom', { method: 'POST', body: JSON.stringify(mealData) }),
  uploadImage:      (formData) => apiRequest('/meals/upload-image', { method: 'POST', body: formData }),
  toggleFavorite:   (mealId)   => apiRequest(`/meals/${mealId}/favorite`, { method: 'PUT' }),
  deleteMeal:       (mealId)   => apiRequest(`/meals/${mealId}`, { method: 'DELETE' }),
  logMeal: (mealId, servings = 1, notes = '') =>
    apiRequest('/meals/log', { method: 'POST', body: JSON.stringify({ meal_id: mealId, servings, notes }) }),
  getTodayLogs: () => apiRequest('/meals/logs/today'),
  getHistory:   (days = 7) => apiRequest(`/meals/logs/history?days=${days}`),
  deleteLog:    (logId) => apiRequest(`/meals/logs/${logId}`, { method: 'DELETE' }),
  getGoals:     () => apiRequest('/meals/goals'),
  updateGoals:  (goals) => apiRequest('/meals/goals', { method: 'PUT', body: JSON.stringify(goals) }),
};

export default mealAPI;
