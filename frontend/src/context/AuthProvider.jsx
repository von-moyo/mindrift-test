import React, { useState } from 'react';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  // TODO: Implement state persistence using httpCookie for secure session management
  // Currently using useState which resets on page refresh. Consider:
  // 1. httpCookie for secure session management with proper expiration
  // 2. localStorage if offline capabilities are needed
  // 3. Server-side session management with JWT
  // Decision will be based on security requirements and offline needs
  const [user, setUser] = useState(null);

  /**
   * Updates the authentication state with user data
   * @param {Object} userData - The user data received from authentication
   * @param {string} userData.email - User's email address
   * @param {string} userData.token - Authentication token for API requests
   */
  const login = (userData) => {
    setUser(userData);
  };

  /**
   * Clears the authentication state
   */
  const logout = () => {
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};
