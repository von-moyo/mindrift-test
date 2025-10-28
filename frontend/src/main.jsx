import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';
import App from './App.jsx';
import { Toaster } from 'sonner';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <Toaster richColors className="text-center" position="bottom-center" aria-live="polite" />
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);
