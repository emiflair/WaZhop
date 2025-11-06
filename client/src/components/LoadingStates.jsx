import { FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

/**
 * ButtonLoading Component
 * Loading state for buttons
 */
export const ButtonLoading = ({ 
  loading, 
  children, 
  loadingText = 'Loading...',
  className = '',
  ...props 
}) => {
  return (
    <button
      disabled={loading}
      className={`${className} ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <FaSpinner className="animate-spin" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

/**
 * ContentLoading Component
 * Loading state for content areas
 */
export const ContentLoading = ({ 
  loading, 
  error, 
  children,
  loadingComponent = null,
  errorComponent = null,
  emptyComponent = null,
  data = null,
  isEmpty = false
}) => {
  if (loading) {
    return loadingComponent || (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return errorComponent || (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FaExclamationCircle className="text-4xl text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">
            {error.message || 'An error occurred'}
          </p>
        </div>
      </div>
    );
  }

  if (isEmpty || (Array.isArray(data) && data.length === 0)) {
    return emptyComponent || (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  return children;
};

/**
 * ProgressBar Component
 * Visual progress indicator
 */
export const ProgressBar = ({ 
  progress = 0, 
  showPercentage = true,
  color = 'bg-primary-500',
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`}>
      {showPercentage && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-medium text-gray-700">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

/**
 * StepIndicator Component
 * Multi-step process indicator
 */
export const StepIndicator = ({ 
  steps = [], 
  currentStep = 0,
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <div key={index} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="relative flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-200
                  ${isCompleted ? 'bg-primary-500 text-white' : ''}
                  ${isCurrent ? 'bg-primary-500 text-white ring-4 ring-primary-200' : ''}
                  ${isUpcoming ? 'bg-gray-200 text-gray-500' : ''}
                `}
              >
                {isCompleted ? (
                  <FaCheckCircle />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              
              {/* Step Label */}
              <span
                className={`
                  absolute -bottom-6 text-xs whitespace-nowrap
                  ${isCurrent ? 'text-primary-600 font-medium' : 'text-gray-500'}
                `}
              >
                {step}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-2">
                <div
                  className={`
                    h-full transition-all duration-300
                    ${isCompleted ? 'bg-primary-500' : 'bg-gray-200'}
                  `}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * PulseLoader Component
 * Animated pulse dots
 */
export const PulseLoader = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
};

/**
 * RefreshIndicator Component
 * Pull-to-refresh style indicator
 */
export const RefreshIndicator = ({ 
  refreshing, 
  onRefresh,
  className = '' 
}) => {
  return (
    <div className={`flex justify-center py-4 ${className}`}>
      {refreshing ? (
        <div className="flex items-center gap-2 text-gray-600">
          <FaSpinner className="animate-spin" />
          <span className="text-sm">Refreshing...</span>
        </div>
      ) : (
        <button
          onClick={onRefresh}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Pull to refresh
        </button>
      )}
    </div>
  );
};

/**
 * InlineStatus Component
 * Inline status with icon
 */
export const InlineStatus = ({ 
  status = 'loading', 
  text = '',
  className = '' 
}) => {
  const statusConfig = {
    loading: {
      icon: FaSpinner,
      color: 'text-blue-500',
      animate: 'animate-spin'
    },
    success: {
      icon: FaCheckCircle,
      color: 'text-primary-500',
      animate: ''
    },
    error: {
      icon: FaExclamationCircle,
      color: 'text-red-500',
      animate: ''
    }
  };

  const config = statusConfig[status] || statusConfig.loading;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Icon className={`${config.color} ${config.animate}`} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
};

/**
 * CardLoading Component
 * Loading overlay for cards
 */
export const CardLoading = ({ loading, children, className = '' }) => {
  if (!loading) return children;

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
        <FaSpinner className="animate-spin text-3xl text-primary-500" />
      </div>
    </div>
  );
};

export default {
  ButtonLoading,
  ContentLoading,
  ProgressBar,
  StepIndicator,
  PulseLoader,
  RefreshIndicator,
  InlineStatus,
  CardLoading
};
