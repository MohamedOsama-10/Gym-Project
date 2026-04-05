// src/components/DashboardErrorBoundary.jsx
// Shared error boundary for all four dashboards.
// Previously only UserDashboard had one; Admin, Coach, and Owner dashboards
// would crash to a blank screen on any lazy-chunk runtime error.
//
// FIX: componentDidCatch now calls the optional onError prop (or falls back to
// console.error in dev) so the caller can wire in Sentry or any monitoring
// service without changing this file:
//
//   <DashboardErrorBoundary onError={(err, info) => Sentry.captureException(err)}>

import React from 'react';

export default class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (typeof this.props.onError === 'function') {
      // Caller-supplied handler (e.g. Sentry.captureException)
      this.props.onError(error, info);
    } else if (import.meta.env.DEV) {
      // Dev-only console fallback
      console.error('[DashboardErrorBoundary]', error, info);
    }
    // In production without an onError prop: fail silently to avoid noise,
    // but the UI still shows the recovery screen below.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-gray-500 text-sm mb-6">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
