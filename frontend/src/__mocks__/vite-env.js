// Mock Vite's import.meta.env for Jest
global.window = global.window || {};
window.__ENV__ = {
  VITE_API_URL: 'http://localhost:8000',  // Default for tests; override as needed
  // Add other Vite env vars here if needed
};
