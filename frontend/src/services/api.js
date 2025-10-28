/**
 * API Service Layer for ShopLaunch Frontend
 * Handles all HTTP requests with authentication, CSRF protection, retry logic, and error handling
 */

/**
 * Safely get environment variables, compatible with Vite, CRA, and Jest
 */
const getEnvVar = (key) => {
  // Check for Vite-style env vars (mocked in tests)
  if (typeof window !== 'undefined' && window.__ENV__?.[key]) {
    return window.__ENV__[key];
  }
  // Fallback to process.env for CRA and Jest, but only if process is defined
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  return null;
};

const API_BASE_URL = getEnvVar('VITE_API_URL') || getEnvVar('REACT_APP_API_URL') || 'http://localhost:8000';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second fixed delay

/**
 * Generate UUID v4 for request tracking
 * @returns {string} UUID v4
 */
export function generateUUID() {
  return crypto.randomUUID();
}

// Added CSRF token caching
const csrfTokenCache = { token: null, timestamp: 0 };
const CSRF_TOKEN_CACHE_TTL = 180000; // 3 minutes

export function getCSRFToken() {
  const now = Date.now();
  if (csrfTokenCache.token && now - csrfTokenCache.timestamp < CSRF_TOKEN_CACHE_TTL) {
    return csrfTokenCache.token;
  }

  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf_token') {
      csrfTokenCache.token = decodeURIComponent(value);
      csrfTokenCache.timestamp = now;
      return csrfTokenCache.token;
    }
  }
  return null;
}

/**
 * Check if HTTP method is safe (doesn't require CSRF token)
 * @param {string} method - HTTP method
 * @returns {boolean} True if method is safe
 */
function isSafeMethod(method) {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

/**
 * Create an AbortController with timeout
 * @param {number} timeout - Timeout in milliseconds
 * @returns {AbortController} AbortController instance
 */
function createTimeoutController(timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  controller.signal.addEventListener('abort', () => {
    clearTimeout(timeoutId);
  }, { once: true });
  return controller;
}

/**
 * Delay execution for retry logic
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attempt to refresh authentication token
 * @returns {Promise<boolean>} True if refresh successful
 */
let refreshPromise = null;

async function refreshToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const controller = createTimeoutController(DEFAULT_TIMEOUT);
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': generateUUID(),
        },
        signal: controller.signal,
      });

      if (response.ok) {
        refreshPromise = null;
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    refreshPromise = null;
    return false;
  })();

  return refreshPromise;
}

/**
 * Handle 401 Unauthorized responses with token refresh
 * @param {string} endpoint - Original endpoint
 * @param {Object} options - Original request options
 * @returns {Promise<Response>} Retried response or throws error
 */
async function handle401(endpoint, options) {
  // Prevent infinite retry loops
  if (options._retry) {
    // Redirect to login with session expired flag
    safeRedirect('/login?session_expired=true');
    throw new Error('Session expired');
  }

  // Attempt token refresh
  const refreshed = await refreshToken();

  if (refreshed) {
    // Retry original request once
    return apiRequest(endpoint, { ...options, _retry: true });
  } else {
    // Refresh failed, redirect to login
    safeRedirect('/login?session_expired=true');
    throw new Error('Authentication failed');
  }
}

/**
 * Safe redirect helper that works in tests and production
 */
function safeRedirect(url) {
  window.__REDIRECT_TO__ = url;

  // Test hook: if set, call it instead of real navigation
  if (window.__TEST_REDIRECT__) {
    window.__TEST_REDIRECT__(url);
    return;
  }

  // Production: attempt navigation
  if (typeof window.location?.assign === 'function') {
    window.location.assign(url);
  } else {
    window.location.href = url;
  }
}

/**
 * APIError class for standardized API error handling
 */
export class APIError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Handle different HTTP error responses
 * @param {Response} response - Fetch response object
 * @param {Object} data - Parsed response data
 * @param {string} endpoint - Request endpoint
 * @param {Object} options - Request options
 * @returns {Promise<any>} Response data or throws specific error
 */
async function handleErrorResponse(response, data, endpoint, options) {
  switch (response.status) {
    case 401:
      // Unauthorized - attempt token refresh
      return handle401(endpoint, options);

    case 403:
      // Forbidden - likely CSRF failure or insufficient permissions
      throw new APIError(403, 'FORBIDDEN', data.message || 'Access forbidden. Please refresh the page and try again.');

    case 422:
      throw new APIError(422, 'VALIDATION_ERROR', data.message || 'Validation failed.', data);


    default:
      // Generic error
      throw new APIError(response.status, 'UNKNOWN_ERROR', data.message || 'An unknown error occurred.', data);
  }
}

/**
 * Core API request function with retry logic, timeout, and error handling
 * @param {string} endpoint - API endpoint (e.g., '/api/catalog')
 * @param {Object} options - Fetch options
 * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param {Object} options.headers - Additional headers
 * @param {any} options.body - Request body (will be JSON stringified if object)
 * @param {number} options.timeout - Request timeout in ms (default: 30000)
 * @param {number} options.retries - Number of retries (default: 3)
 * @param {boolean} options._retry - Internal flag to prevent infinite loops
 * @returns {Promise<any>} Response data
 */
export async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    timeout = DEFAULT_TIMEOUT,
    retries = MAX_RETRIES,
    _retry = false,
    ...fetchOptions
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;
  const requestId = generateUUID();

  // Build headers
  const requestHeaders = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    ...headers,
  };

  // Add CSRF token for state-changing requests
  if (!isSafeMethod(method)) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      requestHeaders['X-CSRF-Token'] = csrfToken;
    }
  }

  // Prepare request body
  let requestBody = body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    requestBody = JSON.stringify(body);
  }

  // Retry logic for network failures
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create timeout controller
      const controller = createTimeoutController(timeout);

      // Make request
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        credentials: 'include', // Required for cookie authentication
        signal: controller.signal,
        ...fetchOptions,
      });

      // Parse response
      let data = null;
      const contentType = response.headers.get('Content-Type');

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.warn('Failed to parse JSON response:', parseError);
          data = { message: 'Invalid JSON response from server' };
        }
      } else {
        // Non-JSON response
        const text = await response.text();
        data = { message: text || 'No response body' };
      }

      // Handle successful response
      if (response.ok) {
        return data;
      }

      // Handle error responses
      return await handleErrorResponse(response, data, endpoint, {
        method,
        headers,
        body,
        timeout,
        retries,
        _retry,
        ...fetchOptions,
      });
    } catch (error) {
      lastError = error;

      // Don't retry on specific errors
      if (error.status && [401, 403, 404, 422].includes(error.status)) {
        throw error;
      }

      // Don't retry if this was already a retry attempt from 401 handler
      if (_retry) {
        throw error;
      }

      // Check if it's a network error or timeout
      const isNetworkError =
        error.name === 'AbortError' ||
        error.name === 'TypeError' ||
        error.message.includes('network') ||
        error.message.includes('fetch');

      if (!isNetworkError) {
        throw error;
      }

      // Log retry attempt
      console.warn(
        `Request failed (attempt ${attempt + 1}/${retries + 1}):`,
        error.message
      );

      // Wait before retrying (except on last attempt)
      if (attempt < retries) {
        await delay(RETRY_DELAY);
      }
    }
  }

  // All retries exhausted
  throw new APIError(
    0, // status
    'NETWORK_ERROR', // code
    'Network request failed after multiple attempts. Please check your connection.', // message
    lastError // details
  );
}

// Export convenience methods for common HTTP verbs
export const api = {
  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Response data
   */
  get: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'GET' }),

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {any} body - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Response data
   */
  post: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'POST', body }),

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {any} body - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Response data
   */
  put: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'PUT', body }),

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {any} body - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Response data
   */
  patch: (endpoint, body, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'PATCH', body }),

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Response data
   */
  delete: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

// Auth endpoints
export const authService = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: () => api.post('/api/auth/logout'),
  refresh: () => api.post('/api/auth/refresh'),
  me: () => api.get('/api/auth/me'),
};

// Catalog endpoints
export const catalog = {
  list: () => api.get('/api/catalog/'),
  get: (id) => api.get(`/api/catalog/${id}`),
};

// Cart endpoints
export const cart = {
  get: () => api.get('/api/cart/'),
  addItem: (item) => api.post('/api/cart/items', item),
  updateItem: (id, updates) => api.put(`/api/cart/items/${id}`, updates),
  removeItem: (id) => api.delete(`/api/cart/items/${id}`),
  clear: () => api.delete('/api/cart/'),
};

// Order endpoints
export const orders = {
  create: (orderData) => api.post('/api/orders/', orderData),
  list: () => api.get('/api/orders/'),
  get: (id) => api.get(`/api/orders/${id}`),
};

// Stock endpoints
export const stock = {
  get: (productId) => api.get(`/api/stock/${productId}`),
  update: (productId, stockData) => api.put(`/api/stock/${productId}`, stockData),
};

// Analytics endpoints
export const analytics = {
  dashboard: () => api.get('/api/analytics/dashboard'),
  orders: () => api.get('/api/analytics/orders'),
  products: () => api.get('/api/analytics/products'),
};

// Notification endpoints
export const notifications = {
  list: () => api.get('/api/notifications/'),
  get: (id) => api.get(`/api/notifications/${id}`),
  send: (notificationData) => api.post('/api/notifications/', notificationData),
};

export { safeRedirect, createTimeoutController, refreshToken };

// for testing purposes
export const __getCSRFCache = csrfTokenCache;

export function clearCSRFCache() {
  csrfTokenCache.token = null;
  csrfTokenCache.timestamp = 0;
}

// Export default API object
export default {
  apiRequest,
  api,
  authService,
  catalog,
  cart,
  orders,
  stock,
  analytics,
  notifications,
  // Utility functions
  generateUUID,
  getCSRFToken,
  APIError
};
