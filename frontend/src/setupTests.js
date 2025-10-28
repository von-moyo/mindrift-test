import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import fetch from 'node-fetch';
import { TextEncoder, TextDecoder } from 'util';

// Setup text encoder/decoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Vite environment variables in process.env for Jest
process.env.VITE_API_URL = 'http://localhost:8000';

// Mock window.matchMedia
window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Setup fetch
global.fetch = fetch;
global.Request = fetch.Request;
global.Response = fetch.Response;
global.Headers = fetch.Headers;

// Clean up after each test
afterEach(() => {
  cleanup();
});
