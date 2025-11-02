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
 */
const LoadingSpinner = ({
  size = 'md',
  message = '',
  fullScreen = false,
  color = 'text-green-500',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.md;

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <FaSpinner className={`animate-spin ${spinnerSize} ${color}`} />
      {message && (
        <p className="text-sm text-gray-600 font-medium">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

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
