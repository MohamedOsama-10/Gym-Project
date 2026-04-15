// src/services/api.js
import { apiRequest } from './httpClient';

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login:  (data) => apiRequest('/auth/login',  { method: 'POST', body: JSON.stringify(data) }),
  logout: () => {
    const refreshToken = localStorage.getItem('refresh_token');
    return apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },
  refresh: (refreshToken) => apiRequest('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  }),
};

// ── Profile API ───────────────────────────────────────────────────────────────
export const profileAPI = {
  getCustomerProfile:  () => apiRequest('/users/me/profile'),
  updateCustomerProfile: (data) => apiRequest('/users/me/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getCoachProfile:     () => apiRequest('/users/me/coach-profile'),
  updateCoachProfile:  (data) => apiRequest('/users/me/coach-profile', { method: 'PUT', body: JSON.stringify(data) }),

  uploadAvatar: (formData) => apiRequest('/users/me/avatar', { method: 'POST', body: formData }),
  uploadCoachAvatar: (formData) => apiRequest('/users/me/coach-avatar', { method: 'POST', body: formData }),
  uploadCoachCV: (formData) => apiRequest('/users/me/coach-cv', { method: 'POST', body: formData }),

  addCertification:    (data) => apiRequest('/users/me/certifications', { method: 'POST', body: JSON.stringify(data) }),
  deleteCertification: (id)   => apiRequest(`/users/me/certifications/${id}`, { method: 'DELETE' }),
  addEducation:        (data) => apiRequest('/users/me/education', { method: 'POST', body: JSON.stringify(data) }),
  deleteEducation:     (id)   => apiRequest(`/users/me/education/${id}`, { method: 'DELETE' }),
  addExperience:       (data) => apiRequest('/users/me/experience', { method: 'POST', body: JSON.stringify(data) }),
  deleteExperience:    (id)   => apiRequest(`/users/me/experience/${id}`, { method: 'DELETE' }),
};

// ── Staff / Admin API ─────────────────────────────────────────────────────────
export const staffAPI = {
  getMyAdminProfile:    () => apiRequest('/staff/admins/me'),
  updateMyAdminProfile: (data) => apiRequest('/staff/admins/me', { method: 'PUT', body: JSON.stringify(data) }),
  listAllAdmins:        () => apiRequest('/staff/admins'),
  getMyOwnerProfile:    () => apiRequest('/staff/owners/me'),
  updateMyOwnerProfile: (data) => apiRequest('/staff/owners/me', { method: 'PUT', body: JSON.stringify(data) }),
  listAllOwners:        () => apiRequest('/staff/owners'),
};

// ── Bookings API ──────────────────────────────────────────────────────────────
export const bookingsAPI = {
  getMyBookings: (filters = {}) => {
    const p = new URLSearchParams();
    if (filters.status)   p.append('booking_status', filters.status);
    if (filters.dateFrom) p.append('date_from', filters.dateFrom);
    if (filters.dateTo)   p.append('date_to', filters.dateTo);
    if (filters.page)     p.append('page', filters.page);
    if (filters.limit)    p.append('limit', filters.limit);
    const qs = p.toString();
    return apiRequest(`/bookings/my-bookings${qs ? '?' + qs : ''}`);
  },
  createBooking:  (data) => apiRequest('/bookings/', { method: 'POST', body: JSON.stringify(data) }),
  cancelBooking:  (id)   => apiRequest(`/bookings/${id}/cancel`, { method: 'POST' }),
  rescheduleBooking: (bookingId, newSlotId, reason = null, newCoachId = null) =>
    apiRequest(`/bookings/${bookingId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ new_availability_slot_id: newSlotId, new_coach_id: newCoachId, reschedule_reason: reason }),
    }),
  getCoachBookings: (filters = {}) => {
    const p = new URLSearchParams();
    if (filters.status)   p.append('booking_status', filters.status);
    if (filters.dateFrom) p.append('date_from', filters.dateFrom);
    if (filters.dateTo)   p.append('date_to', filters.dateTo);
    if (filters.limit)    p.append('limit', Math.min(filters.limit, 100));
    if (filters.page)     p.append('page', filters.page);
    const qs = p.toString();
    return apiRequest(`/bookings/coach-bookings${qs ? '?' + qs : ''}`);
  },
  confirmBooking:  (id, coachNotes = null) => apiRequest(`/bookings/${id}/confirm`, { method: 'PUT', body: coachNotes ? JSON.stringify({ coach_notes: coachNotes }) : undefined }),
  completeBooking: (id, coachNotes = null) => apiRequest(`/bookings/${id}/complete`, { method: 'PUT', body: coachNotes ? JSON.stringify({ coach_notes: coachNotes }) : undefined }),
  markBookingMissed: (id) => apiRequest(`/bookings/${id}/miss`, { method: 'PUT' }),
  coachRescheduleBooking: (bookingId, newSlotId, reason = null, notifyCustomer = true) =>
    apiRequest(`/bookings/${bookingId}/coach-reschedule`, {
      method: 'POST',
      body: JSON.stringify({ new_availability_slot_id: newSlotId, reschedule_reason: reason, notify_customer: notifyCustomer }),
    }),
  getAllBookings: (filters = {}) => {
    const p = new URLSearchParams();
    if (filters.status)   p.append('booking_status', filters.status);
    if (filters.dateFrom) p.append('date_from', filters.dateFrom);
    if (filters.dateTo)   p.append('date_to', filters.dateTo);
    const qs = p.toString();
    return apiRequest(`/bookings/all${qs ? '?' + qs : ''}`);
  },
};

// ── Availability API ──────────────────────────────────────────────────────────
export const availabilityAPI = {
  getMyAvailability:   () => apiRequest('/coach/availability/'),
  createAvailability:  (data) => apiRequest('/coach/availability/', { method: 'POST', body: JSON.stringify(data) }),
  updateAvailability:  (id, data) => apiRequest(`/coach/availability/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAvailability:  (id)   => apiRequest(`/coach/availability/${id}`, { method: 'DELETE' }),
  getCoachAvailability: (coachId, availableOnly = true) =>
    apiRequest(`/coach/availability/coach/${coachId}?available_only=${availableOnly}`),
};

// ── Gyms API ──────────────────────────────────────────────────────────────────
export const gymsAPI = {
  listGyms:       () => apiRequest('/gyms/'),
  getGym:         (id) => apiRequest(`/gyms/${id}`),
  getGymCoaches:  (id) => apiRequest(`/gyms/${id}/coaches`),
  getGymBookings: (id, status = null) => apiRequest(`/gyms/${id}/bookings${status ? '?status=' + status : ''}`),
  createGym:      (data) => apiRequest('/gyms/', { method: 'POST', body: JSON.stringify(data) }),
  updateGym:      (id, data) => apiRequest(`/gyms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGym:      (id) => apiRequest(`/gyms/${id}`, { method: 'DELETE' }),
};

// ── Subscriptions API ─────────────────────────────────────────────────────────
export const subscriptionsAPI = {
  getMySubscriptions:   () => apiRequest('/subscriptions/my-subscriptions'),
  getSubscriptionDetail: (id) => apiRequest(`/subscriptions/my-subscriptions/${id}`),
};

// ── Meals API ─────────────────────────────────────────────────────────────────
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
  logMeal:          (mealId, servings = 1, notes = '') =>
    apiRequest('/meals/log', { method: 'POST', body: JSON.stringify({ meal_id: mealId, servings, notes }) }),
  getTodayLogs: () => apiRequest('/meals/logs/today'),
  getHistory:   (days = 7) => apiRequest(`/meals/logs/history?days=${days}`),
  deleteLog:    (logId) => apiRequest(`/meals/logs/${logId}`, { method: 'DELETE' }),
  getGoals:     () => apiRequest('/meals/goals'),
  updateGoals:  (goals) => apiRequest('/meals/goals', { method: 'PUT', body: JSON.stringify(goals) }),
};

// ── Workouts API ──────────────────────────────────────────────────────────────
export const workoutAPI = {
  getMyWorkouts: (filters = {}) => {
    const p = new URLSearchParams();
    if (filters.type) p.append('filter_type', filters.type);
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
  getWorkoutById:    (id) => apiRequest(`/workouts/my-workouts/${id}`),
  getWorkoutTemplates: (isPublic = true) => apiRequest(`/workouts/templates?is_public=${isPublic}`),
};

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

// ── Reviews API ───────────────────────────────────────────────────────────────
export const reviewsAPI = {
  createReview:    (data)    => apiRequest('/reviews/', { method: 'POST', body: JSON.stringify(data) }),
  getCoachReviews: (coachId) => apiRequest(`/reviews/coach/${coachId}`),
};

// ── Training Programs API ─────────────────────────────────────────────────────
export const programsAPI = {
  listPrograms:  ()       => apiRequest('/training-programs/'),
  getProgram:    (id)     => apiRequest(`/training-programs/${id}`),
  createProgram: (data)   => apiRequest('/training-programs/', { method: 'POST', body: JSON.stringify(data) }),
  updateProgram: (id, data) => apiRequest(`/training-programs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProgram: (id)     => apiRequest(`/training-programs/${id}`, { method: 'DELETE' }),
};

export default { auth: authAPI, profile: profileAPI, staff: staffAPI, bookings: bookingsAPI,
  availability: availabilityAPI, gyms: gymsAPI, subscriptions: subscriptionsAPI, meals: mealAPI,
  workouts: workoutAPI, coachWorkouts: coachWorkoutAPI, reviews: reviewsAPI, programs: programsAPI };
