import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full bg-surface border border-border rounded-xl shadow-lg p-8 text-center space-y-6">
            <div className="text-5xl" role="img" aria-label="Error Alert">⚠️</div>
            <h2 className="text-2xl font-bold text-text">Something went wrong</h2>
            <p className="text-text-secondary text-sm">
              An unexpected client-side error occurred while rendering this view.
            </p>
            {this.state.error && (
              <div className="bg-red-50 text-danger border border-red-100 rounded-md p-3 text-xs font-mono text-left overflow-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}
            <div className="pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-md transition-colors shadow-sm focus:outline-none"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
