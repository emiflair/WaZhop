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
    console.error('❌ ErrorBoundary caught an error:', error);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error stack:', error?.stack);
    console.error('❌ Error info:', errorInfo);
    console.error('❌ Component stack:', errorInfo?.componentStack);
    
    // Check if it's a chunk loading error (deployment issue)
    const isChunkError = 
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.message?.includes('dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.name === 'ChunkLoadError';
    
    if (isChunkError) {
      // Auto-reload on chunk errors (new deployment)
      console.log('⚠️ Chunk load error detected, refreshing page...');
      // Clear cache
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      window.location.reload(true);
      return;
    }
    
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
