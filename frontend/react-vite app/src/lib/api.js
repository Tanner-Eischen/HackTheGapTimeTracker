/**
 * API Client Wrapper
 * 
 * A minimal, framework-free API helper for the application.
 * Centralizes API calls and handles authentication and error handling.
 * Uses Vite environment variables for configuration.
 */

// Uses Vite env var: VITE_API_BASE_URL ("" by default = same origin)
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? '';

/**
 * Ensures exactly one slash between base URL and path
 * @param {string} path - The API endpoint path
 * @returns {string} The complete URL with base
 */
function withBase(path) {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/**
 * Core fetch wrapper with authentication and error handling
 * @param {string} path - API endpoint path
 * @param {Object} options - Fetch options
 * @param {boolean} [options.auth=true] - Whether to include auth token
 * @param {boolean} [options.json=true] - Whether to handle JSON
 * @returns {Promise<any>} Response data
 * @throws {Error} Standardized error with status and details
 */
export async function apiFetch(path, { auth = true, json = true, ...init } = {}) {
  const headers = new Headers(init.headers || {});
  
  if (json && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Reuse localStorage token convention
  const token = auth ? localStorage.getItem('token') : null;
  if (auth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(withBase(path), { ...init, headers });
  const isJSON = res.headers.get('content-type')?.includes('application/json');

  if (!res.ok) {
    // Standardize errors
    const errBody = isJSON ? await res.json().catch(() => ({})) : await res.text();
    const message = (errBody && errBody.message) || res.statusText || 'Request failed';
    const error = new Error(message);
    error.status = res.status;
    error.details = errBody;
    throw error;
  }

  return isJSON ? res.json() : res.text();
}

// Small convenience shorthands
export const api = {
  get: (p, o) => apiFetch(p, { method: 'GET', ...o }),
  post: (p, body, o) => apiFetch(p, { method: 'POST', body: body && JSON.stringify(body), ...o }),
  put: (p, body, o) => apiFetch(p, { method: 'PUT', body: body && JSON.stringify(body), ...o }),
  del: (p, o) => apiFetch(p, { method: 'DELETE', ...o }),
};

export { API_BASE_URL };