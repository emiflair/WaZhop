import { FaSpinner } from 'react-icons/fa';

/**
 * LoadingSpinner Component
 * Displays a loading spinner with optional message
 * 
 * @param {Object} props
 * @param {string} props.size - Size: 'sm', 'md', 'lg', 'xl'
 * @param {string} props.message - Loading message to display
 * @param {boolean} props.fullScreen - Show as full-screen overlay
 * @param {string} props.color - Spinner color (Tailwind class)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.native - Use native app-style loader
 */
const LoadingSpinner = ({
  size = 'md',
  message = '',
  fullScreen = false,
  color = 'text-primary-500',
  className = '',
  native = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.md;

  // Native app-style loader
  if (native || fullScreen) {
    return (
      <div className={`${fullScreen ? 'fixed' : 'absolute'} inset-0 bg-gradient-to-br from-primary-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center z-50 ${className}`}>
        <div className="relative">
          {/* Logo/Icon */}
          <div className="w-20 h-20 mb-6 rounded-3xl bg-gradient-to-br from-primary-500 to-orange-600 shadow-2xl flex items-center justify-center animate-pulse">
            <span className="text-white text-3xl font-bold">W</span>
          </div>
          
          {/* Spinner */}
          <div className="flex justify-center mb-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-primary-200 dark:border-gray-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary-600 dark:border-primary-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>
          
          {/* Message */}
          {message && (
            <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 animate-pulse">
              {message}
            </p>
          )}
          {!message && (
            <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              Loading...
            </p>
          )}
        </div>
      </div>
    );
  }

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <FaSpinner className={`animate-spin ${spinnerSize} ${color}`} />
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{message}</p>
      )}
    </div>
  );

  return spinner;
};

/**
 * LoadingOverlay Component
 * Displays a loading overlay on top of content
 * 
 * @param {Object} props
 * @param {boolean} props.show - Whether to show the overlay
 * @param {string} props.message - Loading message
 * @param {ReactNode} props.children - Content to overlay
 */
export const LoadingOverlay = ({ show, message, children }) => {
  if (!show) return children;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
        <LoadingSpinner message={message} />
      </div>
    </div>
  );
};

/**
 * InlineLoader Component
 * Small inline loading indicator
 * 
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes
 */
export const InlineLoader = ({ className = '' }) => {
  return (
    <FaSpinner className={`animate-spin h-4 w-4 text-gray-500 ${className}`} />
  );
};

export default LoadingSpinner;
