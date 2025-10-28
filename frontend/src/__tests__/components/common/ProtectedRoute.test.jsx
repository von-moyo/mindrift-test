import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../../../components/common/ProtectedRoute';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: jest.fn(({ to }) => (
    <div data-testid="mock-navigate" data-to={to}>
      Redirecting...
    </div>
  )),
  useLocation: () => ({ pathname: '/current-path' }),
}));

// Mock useAuth hook consistently
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to login when user is not authenticated', () => {
    const { useAuth } = require('../../../hooks/useAuth');
    useAuth.mockReturnValue({
      user: null,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('mock-navigate')).toHaveAttribute('data-to', '/login');
  });

  it('renders children when user is authenticated', () => {
    const { useAuth } = require('../../../hooks/useAuth');
    useAuth.mockReturnValue({
      user: { id: 1 },
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
