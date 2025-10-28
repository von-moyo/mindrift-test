import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import App from '../../App';
import { AuthProvider } from '../../context/AuthProvider';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/layout/Layout';
import ProtectedRoute from '../../components/common/ProtectedRoute';

// Import pages
import HomePage from '../../pages/HomePage';
import LoginPage from '../../pages/LoginPage';
import SignupPage from '../../pages/SignupPage';
import CatalogPage from '../../pages/CatalogPage';
import ProductDetailPage from '../../pages/ProductDetailPage';
import CartPage from '../../pages/CartPage';
import CheckoutPage from '../../pages/CheckoutPage';
import OrdersPage from '../../pages/OrdersPage';
import OrderDetailsPage from '../../pages/OrderDetailsPage';
import NotFoundPage from '../../pages/NotFoundPage';

// Mock the useAuth hook for protected routes testing
jest.mock('../../hooks/useAuth');

// Mock all page components
jest.mock('../../pages/HomePage', () => () => <div data-testid="home-page">Home Page</div>);
jest.mock('../../pages/LoginPage', () => () => <div data-testid="login-page">Login Page</div>);
jest.mock('../../pages/SignupPage', () => () => <div data-testid="signup-page">Signup Page</div>);
jest.mock('../../pages/CatalogPage', () => () => (
  <div data-testid="catalog-page">Catalog Page</div>
));
jest.mock('../../pages/ProductDetailPage', () => () => (
  <div data-testid="product-detail-page">Product Detail Page</div>
));
jest.mock('../../pages/CartPage', () => () => <div data-testid="cart-page">Cart Page</div>);
jest.mock('../../pages/CheckoutPage', () => () => (
  <div data-testid="checkout-page">Checkout Page</div>
));
jest.mock('../../pages/OrdersPage', () => () => <div data-testid="orders-page">Orders Page</div>);
jest.mock('../../pages/OrderDetailsPage', () => () => (
  <div data-testid="order-details-page">Order Details Page</div>
));
jest.mock('../../pages/NotFoundPage', () => () => <div data-testid="not-found-page">404 Page</div>);

// Mock useAuth hook
jest.mock('../../hooks/useAuth');

// Mock BrowserRouter with memory router
jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
  return {
    ...originalModule,
    BrowserRouter: ({ children }) => {
      const { MemoryRouter } = originalModule;
      return <MemoryRouter>{children}</MemoryRouter>;
    },
  };
});

const renderWithRouter = (initialRoute = '/', isAuthenticated = false) => {
  // Mock auth context
  useAuth.mockImplementation(() => ({
    user: isAuthenticated ? { email: 'test@example.com' } : null,
    login: jest.fn(),
    logout: jest.fn(),
  }));

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />

            {/* Protected Routes */}
            <Route
              path="cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetailsPage />
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('App Routing', () => {
  beforeEach(() => {
    useAuth.mockClear();
  });

  describe('Public Routes', () => {
    it('renders HomePage at /', () => {
      renderWithRouter('/');
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });

    it('renders LoginPage at /login', () => {
      renderWithRouter('/login');
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('renders SignupPage at /signup', () => {
      renderWithRouter('/signup');
      expect(screen.getByTestId('signup-page')).toBeInTheDocument();
    });

    it('renders CatalogPage at /catalog', () => {
      renderWithRouter('/catalog');
      expect(screen.getByTestId('catalog-page')).toBeInTheDocument();
    });

    it('renders ProductDetailPage at /products/:id', () => {
      renderWithRouter('/products/1');
      expect(screen.getByTestId('product-detail-page')).toBeInTheDocument();
    });
  });

  describe('Protected Routes', () => {
    it('allows access to CartPage when authenticated', () => {
      renderWithRouter('/cart', true);
      expect(screen.getByTestId('cart-page')).toBeInTheDocument();
    });

    it('allows access to CheckoutPage when authenticated', () => {
      renderWithRouter('/checkout', true);
      expect(screen.getByTestId('checkout-page')).toBeInTheDocument();
    });

    it('allows access to OrdersPage when authenticated', () => {
      renderWithRouter('/orders', true);
      expect(screen.getByTestId('orders-page')).toBeInTheDocument();
    });

    it('allows access to OrderDetailsPage when authenticated', () => {
      renderWithRouter('/orders/123', true);
      expect(screen.getByTestId('order-details-page')).toBeInTheDocument();
    });

    it('redirects to login when accessing CartPage without auth', async () => {
      renderWithRouter('/cart', false);
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('redirects to login when accessing CheckoutPage without auth', async () => {
      renderWithRouter('/checkout', false);
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('redirects to login when accessing OrdersPage without auth', async () => {
      renderWithRouter('/orders', false);
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('redirects to login when accessing OrderDetailsPage without auth', async () => {
      renderWithRouter('/orders/123', false);
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });
  });

  describe('404 Route', () => {
    it('renders NotFoundPage for unknown routes', () => {
      renderWithRouter('/unknown-route');
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    });
  });
});
