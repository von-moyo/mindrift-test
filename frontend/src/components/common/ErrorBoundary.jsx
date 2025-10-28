import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // TODO: Log error to error monitoring service (e.g., Sentry)
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      window.location.href = '/';
      return null;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
