import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthProvider';
import Layout from '../../../components/layout/Layout';

describe('Layout', () => {
  it('renders header with navigation', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </AuthProvider>
    );
    expect(screen.getByText('VC Shop')).toBeInTheDocument();
  });

  it('renders footer with copyright', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/© 2025 VC Shop/)).toBeInTheDocument();
  });
});
