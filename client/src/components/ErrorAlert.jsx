import { FaExclamationCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

/**
 * ErrorAlert Component
 * Displays contextual error, warning, or info messages
 * 
 * @param {Object} props
 * @param {string} props.type - Type of alert: 'error', 'warning', 'info', 'success'
 * @param {string} props.title - Alert title
 * @param {string} props.message - Alert message
 * @param {Array} props.errors - Array of error messages to display as list
 * @param {Function} props.onClose - Callback when close button is clicked
 * @param {boolean} props.dismissible - Whether alert can be dismissed
 * @param {string} props.className - Additional CSS classes
 */
const ErrorAlert = ({
  type = 'error',
  title,
  message,
  errors = [],
  onClose,
  dismissible = true,
  className = ''
}) => {
  const styles = {
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: 'text-red-500',
      IconComponent: FaExclamationCircle
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: 'text-yellow-500',
      IconComponent: FaExclamationTriangle
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'text-blue-500',
      IconComponent: FaInfoCircle
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: 'text-green-500',
      IconComponent: FaInfoCircle
    }
  };

  const style = styles[type] || styles.error;
  const Icon = style.IconComponent;

  if (!message && errors.length === 0) return null;

  return (
    <div className={`border rounded-lg p-4 ${style.container} ${className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`text-xl flex-shrink-0 mt-0.5 ${style.icon}`} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold mb-1">{title}</h3>
          )}
          
          {message && (
            <p className="text-sm">{message}</p>
          )}
          
          {errors.length > 0 && (
            <ul className="mt-2 space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span className="flex-1">{error}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {dismissible && onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${style.icon} hover:opacity-75 transition-opacity`}
            aria-label="Close alert"
          >
            <FaTimes />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
