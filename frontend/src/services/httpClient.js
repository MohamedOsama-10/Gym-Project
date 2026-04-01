// src/services/httpClient.js
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
        if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
        return data.access_token;
      }
      return null;
    } catch {
      return null;
    } finally {
      _refreshing = null;
    }
  })();
  return _refreshing;
};

const clearSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const apiRequest = async (endpoint, options = {}, _retried = false) => {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !_retried) {
    const newToken = await refreshAccessToken();
    if (newToken) return apiRequest(endpoint, options, true);
    clearSession();
    throw new Error('Session expired — please log in again');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let detail = errorData.detail || `HTTP ${response.status}`;
    if (Array.isArray(detail)) detail = detail.map(e => e.msg || JSON.stringify(e)).join(', ');
    const err = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    err.status = response.status;
    throw err;
  }

  return response.status === 204 ? null : response.json();
};

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ORIGIN: API_BASE_URL.replace('/api/v1', ''),
};
