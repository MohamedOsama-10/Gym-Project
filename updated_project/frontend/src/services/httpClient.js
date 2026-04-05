// src/services/httpClient.js
// Single source of truth for API base URL and token access.
// All components should import from here — never read localStorage directly
// or duplicate the VITE_API_URL fallback in page files.

const rawUrl = import.meta.env.VITE_API_URL;

if (!rawUrl && import.meta.env.PROD) {
  throw new Error(
    '[httpClient] VITE_API_URL is not set. ' +
    'Add it to your .env file or Railway / Netlify environment variables.'
  );
}

export const API_CONFIG = {
  BASE_URL: rawUrl || 'http://127.0.0.1:8000/api/v1',
  ORIGIN:   (rawUrl || 'http://127.0.0.1:8000/api/v1').replace('/api/v1', ''),
};

// FIX: Named convenience export so callers write `import { API_ORIGIN }`
// instead of repeating `const API_ORIGIN = API_CONFIG.ORIGIN` in every file.
export const API_ORIGIN = API_CONFIG.ORIGIN;

// ─── Single token key ────────────────────────────────────────────────────────
// The auth context writes under 'access_token'. All reads must go through here.
export const TOKEN_KEY = 'access_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// ─── Shared fetch wrapper ────────────────────────────────────────────────────
export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

// ─── FormData variant (for file uploads) ────────────────────────────────────
export async function apiUpload(endpoint, formData, method = 'PUT') {
  const token = getToken();
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}
