import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 text-transparent bg-clip-text hover:from-indigo-500 hover:to-blue-400 transition-all duration-300">
                  VC Shop
                </span>
              </Link>
              <div className="flex items-center ml-8 space-x-2">
                {/* Navigation Links */}
                <Link
                  to="/"
                  className="px-2 py-1 text-sm text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                >
                  Home
                </Link>
                <span className="text-gray-300 px-3">|</span>
                <Link
                  to="/catalog"
                  className="px-2 py-1 text-sm text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                >
                  Catalog
                </Link>
                <span className="text-gray-300 px-3">|</span>
                <Link
                  to="/products/1"
                  className="px-2 py-1 text-sm text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                >
                  Product #1
                </Link>
                <span className="text-gray-300 px-3">|</span>
                <Link
                  to="/cart"
                  className="px-2 py-1 text-sm text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                >
                  Cart
                </Link>
                <span className="text-gray-300 px-3">|</span>
                <Link
                  to="/checkout"
                  className="px-2 py-1 text-sm text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                >
                  Checkout
                </Link>
                <span className="text-gray-300 px-3">|</span>
                <Link
                  to="/orders"
                  className="px-2 py-1 text-sm text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                >
                  Orders
                </Link>
                {user ? (
                  <>
                    <span className="text-gray-300 px-3">|</span>
                    <button
                      onClick={handleLogout}
                      className="px-2 py-1 text-sm text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-gray-300 px-3">|</span>
                    <Link
                      to="/login"
                      className="px-2 py-1 text-sm text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                    >
                      Login
                    </Link>
                    <span className="text-gray-300 px-3">|</span>
                    <Link
                      to="/signup"
                      className="px-2 py-1 text-sm text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      <div className="pt-16">
        <main className="flex-grow">
          <Outlet />
        </main>
      </div>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500">&copy; 2025 VC Shop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
