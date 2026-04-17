import React from 'react';
import { logError } from '../utils/errorLog';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    void logError({
      source: 'client',
      message: error.message,
      stack: error.stack,
      extra: { componentStack: info.componentStack?.slice(0, 2000) },
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          role="alert"
          style={{
            padding: 24,
            maxWidth: 600,
            margin: '40px auto',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: 16 }}>
            The app hit an unexpected error. We&apos;ve logged the details and will look into
            it. Please refresh the page — if it keeps happening, try clearing your
            browser cache.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: '#5B7BFA',
              color: 'var(--text-on-primary, #f5f7ff)',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Refresh
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre
              style={{
                marginTop: 24,
                textAlign: 'left',
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 6,
                fontSize: 12,
                overflow: 'auto',
              }}
            >
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
