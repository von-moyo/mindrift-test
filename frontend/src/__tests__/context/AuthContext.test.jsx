import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../context/AuthProvider';
import { useAuth } from '../../hooks/useAuth';

// Mock component to test the context
const TestComponent = () => {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="user-status">{user ? 'logged in' : 'logged out'}</div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button
        data-testid="login-button"
        onClick={() => login({ email: 'test@example.com', name: 'Test User' })}
      >
        Login
      </button>
      <button data-testid="logout-button" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  it('provides initial authentication state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial state should be logged out
    expect(screen.getByTestId('user-status')).toHaveTextContent('logged out');
    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
  });

  it('handles login and logout flow correctly', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Test login
    fireEvent.click(screen.getByTestId('login-button'));
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('logged in');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    // Test logout
    fireEvent.click(screen.getByTestId('logout-button'));
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('logged out');
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });
  });

  it('maintains consistent auth state across multiple components', async () => {
    render(
      <AuthProvider>
        <TestComponent />
        <TestComponent />
      </AuthProvider>
    );

    const loginButtons = screen.getAllByTestId('login-button');

    // All components should start logged out
    screen.getAllByTestId('user-status').forEach((status) => {
      expect(status).toHaveTextContent('logged out');
    });

    // Login should update all components
    fireEvent.click(loginButtons[0]);
    await waitFor(() => {
      screen.getAllByTestId('user-status').forEach((status) => {
        expect(status).toHaveTextContent('logged in');
      });
      screen.getAllByTestId('user-email').forEach((email) => {
        expect(email).toHaveTextContent('test@example.com');
      });
    });

    // Logout should update all components
    const logoutButtons = screen.getAllByTestId('logout-button');
    fireEvent.click(logoutButtons[0]);
    await waitFor(() => {
      screen.getAllByTestId('user-status').forEach((status) => {
        expect(status).toHaveTextContent('logged out');
      });
      expect(screen.queryAllByTestId('user-email')).toHaveLength(0);
    });
  });
});
