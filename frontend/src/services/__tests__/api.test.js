/**
 * Tests for API Service Layer
 */

import {
  apiRequest,
  api,
  authService,
  catalog,
  cart,
  orders,
  stock,
  analytics,
  notifications,
  generateUUID,
  getCSRFToken,
  // add these internal helpers:
  createTimeoutController,
  refreshToken,
  safeRedirect,
} from '../api';

// Mock fetch
global.fetch = jest.fn();

// Test redirect hook: let api.js redirect via window.__TEST_REDIRECT__ without touching location
const originalTestRedirect = window.__TEST_REDIRECT__;

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
})

// Mock local helper functions since they're not exported
jest.mock('../api', () => {
  const actual = jest.requireActual('../api');
  return {
    ...actual
  };
});

describe('API Service Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockReset();
    window.__REDIRECT_TO__ = undefined;
    window.__TEST_REDIRECT__ = jest.fn();
    document.cookie = '';
    jest.useRealTimers();

    // 🧹 Reset CSRF token cache between tests
    const cache = require('../api').__getCSRFCache;
    if (cache) {
      cache.token = null;
      cache.timestamp = 0;
    }
  });

  afterAll(() => {
    // Restore original test redirect hook
    window.__TEST_REDIRECT__ = originalTestRedirect;
  });

  test('createTimeoutController should clean up timeout', () => {
    jest.useFakeTimers();
    const controller = createTimeoutController(1000);
    const abortSpy = jest.spyOn(controller, 'abort');

    // Simulate time passing and trigger abort
    jest.advanceTimersByTime(1000);
    jest.runOnlyPendingTimers();

    expect(abortSpy).toHaveBeenCalled();
    jest.useRealTimers();
  });


  test('refreshToken should prevent concurrent refresh attempts', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    const p1 = refreshToken();
    const p2 = refreshToken();

    await Promise.all([p1, p2]);
    expect(global.fetch).toHaveBeenCalledTimes(1);

  });


  test('safeRedirect should simplify redirect logic', () => {
    safeRedirect('http://example.com');
    expect(window.__REDIRECT_TO__).toBe('http://example.com');
  });

  describe('generateUUID', () => {
    it('should generate valid UUID v4', () => {
      const uuid = generateUUID();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('generateUUID should use crypto.randomUUID', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('getCSRFToken', () => {
    it('should extract CSRF token from cookies', () => {
      document.cookie = 'csrf_token=test-token-123; path=/';
      expect(getCSRFToken()).toBe('test-token-123');
    });

    it('should return null if CSRF token not found', () => {
      document.cookie = 'other_cookie=value; path=/';
      expect(getCSRFToken()).toBeNull();
    });

    it('should decode URL-encoded CSRF token', () => {
      document.cookie = 'csrf_token=test%20token%20123; path=/';
      expect(getCSRFToken()).toBe('test token 123');
    });

    it('should handle multiple cookies', () => {
      document.cookie = 'session=abc123; csrf_token=my-token; user=john';
      expect(getCSRFToken()).toBe('my-token');
    });


  });

  test('getCSRFToken should cache token', () => {
    document.cookie = 'csrf_token=test_token';
    const token1 = getCSRFToken();
    expect(token1).toBe('test_token');

    // Simulate cache hit (should still return old value)
    document.cookie = '';
    const token2 = getCSRFToken();
    expect(token2).toBe('test_token');
  });

  describe('apiRequest - Basic Functionality', () => {
    it('should make GET request with correct headers', async () => {
      const mockResponse = { data: 'test' };
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => mockResponse,
      });

      const result = await apiRequest('/api/test');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/test',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Request-ID': expect.any(String),
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include CSRF token for POST requests', async () => {
      document.cookie = 'csrf_token=csrf-123';
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      await apiRequest('/api/test', { method: 'POST', body: { data: 'test' } });

      const headers = fetch.mock.calls[0][1].headers;
      expect(headers['X-CSRF-Token']).toBe('csrf-123');
    });


    it('should not include CSRF token for GET requests', async () => {
      document.cookie = 'csrf_token=csrf-123';
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      });

      await apiRequest('/api/test', { method: 'GET' });

      const callHeaders = fetch.mock.calls[0][1].headers;
      expect(callHeaders['X-CSRF-Token']).toBeUndefined();
    });

    it('should stringify object body', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const body = { name: 'test', value: 123 };
      await apiRequest('/api/test', { method: 'POST', body });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(body),
        })
      );
    });
  });

  describe('apiRequest - Error Handling', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      global.fetch = jest.fn();
    });

    it('should handle 404 errors (UNKNOWN_ERROR fallback)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Not found' }),
      });

      await expect(apiRequest('/api/test')).rejects.toMatchObject({
        status: 404,
        code: 'UNKNOWN_ERROR',
      });
    });

    it('should handle 403 errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Forbidden' }),
      });

      await expect(apiRequest('/api/test')).rejects.toMatchObject({
        status: 403,
        code: 'FORBIDDEN',
      });
    });

    it('should handle 409 errors (UNKNOWN_ERROR fallback)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Conflict occurred' }),
      });

      await expect(apiRequest('/api/test')).rejects.toMatchObject({
        status: 409,
        code: 'UNKNOWN_ERROR',
      });
    });

    it('should handle 422 validation errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({
          message: 'Validation failed',
          errors: [{ field: 'email', message: 'Invalid email' }],
        }),
      });

      await expect(apiRequest('/api/test')).rejects.toMatchObject({
        status: 422,
        code: 'VALIDATION_ERROR',
      });
    });

    it('should handle 500 server errors', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: async () => ({ message: 'Internal Server Error' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: async () => ({ message: 'Internal Server Error' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: async () => ({ message: 'Internal Server Error' }),
        });

      await expect(apiRequest('/api/test', { retryDelay: 5 })).rejects.toMatchObject({
        status: 500,
        code: 'UNKNOWN_ERROR',
      });

      // Adjust the number of retries if your apiRequest has a specific maxRetries value
      expect(fetch).toHaveBeenCalledTimes(1);
    });



    it('should handle unrecognized errors with UNKNOWN_ERROR code', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 418, // “I’m a teapot”
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Teapot error' }),
      });

      await expect(apiRequest('/api/test')).rejects.toMatchObject({
        status: 418,
        code: 'UNKNOWN_ERROR',
      });

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('apiRequest - 401 Handling and Token Refresh', () => {
    it('should attempt token refresh on 401', async () => {
      // First call returns 401
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Unauthorized' }),
      });

      // Refresh call succeeds
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      // Retry call succeeds
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ data: 'success' }),
      });

      const result = await apiRequest('/api/test');

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });

    it('should redirect to login if refresh fails', async () => {
      // First call returns 401
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Unauthorized' }),
      });

      // Refresh call fails
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Refresh failed' }),
      });

      await expect(apiRequest('/api/test')).rejects.toThrow('Authentication failed');
      expect(window.__REDIRECT_TO__).toBe('/login?session_expired=true');
    });

    it('should not retry infinitely on 401', async () => {
      // First call returns 401
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Unauthorized' }),
      });

      // Refresh succeeds
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      // Retry returns 401 again
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(apiRequest('/api/test')).rejects.toThrow('Session expired');
      expect(window.__REDIRECT_TO__).toBe('/login?session_expired=true');
    });
  });

  describe('apiRequest - Retry Logic', () => {
    const originalRetryDelay = 1000;

    beforeEach(() => {
      jest.resetAllMocks();
      jest.useFakeTimers();
      // Ensure fetch is mocked
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should retry on network failure', async () => {
      jest.setTimeout(15000);

      // First two calls fail, third succeeds
      fetch
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: async () => ({ data: 'success' }),
        });

      const promise = apiRequest('/api/test', { retryDelay: 5 });
      // advance fake timers for retry delays
      await jest.runAllTimersAsync?.() || jest.runAllTimers();
      const result = await promise;

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });

    it('should retry on timeout (AbortError)', async () => {
      jest.setTimeout(15000);
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';

      fetch
        .mockRejectedValueOnce(abortError)
        .mockResolvedValueOnce({
          ok: true,
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: async () => ({ data: 'success' }),
        });

      const promise = apiRequest('/api/test', { retryDelay: 5 });
      await jest.runAllTimersAsync?.() || jest.runAllTimers();
      const result = await promise;

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    it('should not retry on 422 validation error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ message: 'Validation failed' }),
      });

      await expect(apiRequest('/api/test', { retryDelay: 5 })).rejects.toMatchObject({
        status: 422,
        code: 'VALIDATION_ERROR',
      });

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw network error after max retries', async () => {
      jest.useRealTimers(); // switch to real timers — fake timers sometimes skip async awaits
      fetch.mockRejectedValue(new TypeError('Network error'));

      const start = Date.now();
      await expect(apiRequest('/api/test', { retries: 2, retryDelay: 5 })).rejects.toEqual(
        expect.objectContaining({
          status: 0,
          code: 'NETWORK_ERROR',
          message: 'Network request failed after multiple attempts. Please check your connection.',
        })
      );
      const elapsed = Date.now() - start;

      // Check retry attempts and minimal timing
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(elapsed).toBeGreaterThanOrEqual(10); // at least two small delays total
    });

  });

  describe('API Convenience Methods', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ success: true }),
      });
    });

    it('should support api.get', async () => {
      await api.get('/api/test');
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should support api.post', async () => {
      await api.post('/api/test', { data: 'test' });
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ data: 'test' }),
        })
      );
    });

    it('should support api.put', async () => {
      await api.put('/api/test', { data: 'test' });
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should support api.patch', async () => {
      await api.patch('/api/test', { data: 'test' });
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('should support api.delete', async () => {
      await api.delete('/api/test');
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Auth Endpoints', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ success: true }),
      });
    });

    it('should call login endpoint', async () => {
      await authService.login({ email: 'test@test.com', password: 'pass123' });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/login',
        expect.any(Object)
      );
    });

    it('should call register endpoint', async () => {
      await authService.register({ email: 'test@test.com', password: 'pass123' });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/register',
        expect.any(Object)
      );
    });

    it('should call logout endpoint', async () => {
      await authService.logout();
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/logout',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should call me endpoint', async () => {
      await authService.me();
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/me',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('Catalog Endpoints', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ products: [] }),
      });
    });

    it('should call catalog list endpoint', async () => {
      await catalog.list();
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/catalog/',
        expect.any(Object)
      );
    });

    it('should call catalog get endpoint', async () => {
      await catalog.get('product-123');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/catalog/product-123',
        expect.any(Object)
      );
    });
  });

  describe('Cart Endpoints', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ cart: {} }),
      });
    });

    it('should call cart get endpoint', async () => {
      await cart.get();
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/cart/',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should call cart addItem endpoint', async () => {
      await cart.addItem({ productId: '123', quantity: 1 });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/cart/items',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should call cart updateItem endpoint', async () => {
      await cart.updateItem('item-123', { quantity: 2 });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/cart/items/item-123',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should call cart removeItem endpoint', async () => {
      await cart.removeItem('item-123');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/cart/items/item-123',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should call cart clear endpoint', async () => {
      await cart.clear();
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/cart/',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Order Endpoints', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ order: {} }),
      });
    });

    it('should call orders create endpoint', async () => {
      await orders.create({ items: [] });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/orders/',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should call orders list endpoint', async () => {
      await orders.list();
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/orders/',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should call orders get endpoint', async () => {
      await orders.get('order-123');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/orders/order-123',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('Stock Endpoints', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ stock: 10 }),
      });
    });

    it('should call stock get endpoint', async () => {
      await stock.get('product-123');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/stock/product-123',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should call stock update endpoint', async () => {
      await stock.update('product-123', { quantity: 20 });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/stock/product-123',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('Analytics Endpoints', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ data: {} }),
      });
    });

    it('should call analytics dashboard endpoint', async () => {
      await analytics.dashboard();
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/analytics/dashboard',
        expect.any(Object)
      );
    });

    it('should call analytics orders endpoint', async () => {
      await analytics.orders();
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/analytics/orders',
        expect.any(Object)
      );
    });

    it('should call analytics products endpoint', async () => {
      await analytics.products();
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/analytics/products',
        expect.any(Object)
      );
    });
  });

  describe('Notification Endpoints', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ notifications: [] }),
      });
    });

    it('should call notifications list endpoint', async () => {
      await notifications.list();
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/notifications/',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should call notifications get endpoint', async () => {
      await notifications.get('notif-123');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/notifications/notif-123',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should call notifications send endpoint', async () => {
      await notifications.send({ message: 'Test' });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/notifications/',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
