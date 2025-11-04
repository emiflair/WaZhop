import { Component } from 'react';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Log to error reporting service (e.g., Sentry, LogRocket)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Optionally reload the page
    // window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <FaExclamationTriangle className="text-3xl text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-center mb-2">
              Oops! Something went wrong
            </h1>
            
            <p className="text-gray-600 text-center mb-6">
              We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
            </p>

            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-mono text-red-800 mb-2 break-words">
                  <strong>Error:</strong> {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs text-red-700">
                    <summary className="cursor-pointer font-medium mb-1">
                      Stack trace
                    </summary>
                    <pre className="whitespace-pre-wrap overflow-auto max-h-40 bg-red-100 p-2 rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
                {!import.meta.env.DEV && (
                  <p className="text-xs text-gray-600 mt-2">
                    Tip: take a screenshot of the error section above and share it so we can fix it fast.
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <FaRedo />
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 btn-primary"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
