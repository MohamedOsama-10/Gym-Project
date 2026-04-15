import { apiRequest } from './httpClient';

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
