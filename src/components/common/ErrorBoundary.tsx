import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '#/overview';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            padding: 'var(--space-6)',
            margin: 'var(--space-4) 0',
            backgroundColor: 'var(--white)',
            border: '2px solid var(--sanguine)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <h3 style={{ margin: 0, color: 'var(--sanguine)', fontSize: 'var(--text-lg)' }}>
              {this.props.fallbackTitle || 'Application View Error'}
            </h3>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--warm-black)', marginBottom: 'var(--space-3)' }}>
            An unexpected error occurred while rendering this observatory view. Analytical data integrity remains unaffected.
          </p>
          {this.state.error && (
            <div
              style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--light-grey)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--warm-black)',
                overflowX: 'auto',
                marginBottom: 'var(--space-4)',
                border: '1px solid var(--neutral-border)',
              }}
            >
              <strong>{this.state.error.name}:</strong> {this.state.error.message}
            </div>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
              style={{ padding: '8px 16px', fontSize: 'var(--text-sm)' }}
            >
              Reload Observatory
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={this.handleReset}
              style={{ padding: '8px 16px', fontSize: 'var(--text-sm)' }}
            >
              Return to Overview
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
