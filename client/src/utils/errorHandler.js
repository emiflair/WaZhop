import toast from 'react-hot-toast';

/**
 * Error Handler Utilities
 * Centralized error handling functions for consistent error management
 */

/**
 * Parse API error response and return user-friendly message
 * @param {Error} error - Error object from API call
 * @returns {string} User-friendly error message
 */
export const parseApiError = (error) => {
  // Network error
  if (!error.response) {
    return 'Network error. Please check your internet connection.';
  }

  const { response } = error;
  
  // Server returned error with message
  if (response.data?.message) {
    return response.data.message;
  }

  // Validation errors (array of errors)
  if (response.data?.errors && Array.isArray(response.data.errors)) {
    return response.data.errors.join(', ');
  }

  // HTTP status code errors
  switch (response.status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Unauthorized. Please log in again.';
    case 403:
      return 'Access denied. You don\'t have permission.';
    case 404:
      return 'Resource not found.';
    case 409:
      return 'Conflict. This resource already exists.';
    case 422:
      return 'Validation error. Please check your input.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service unavailable. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

/**
 * Extract validation errors from API response
 * @param {Error} error - Error object from API call
 * @returns {Object} Object with field names as keys and error messages as values
 */
export const parseValidationErrors = (error) => {
  if (!error.response?.data?.errors) {
    return {};
  }

  const errors = error.response.data.errors;

  // If errors is an array of strings
  if (Array.isArray(errors)) {
    return { general: errors };
  }

  // If errors is an object with field names
  if (typeof errors === 'object') {
    return errors;
  }

  return {};
};

/**
 * Handle API error with toast notification
 * @param {Error} error - Error object from API call
 * @param {string} defaultMessage - Default message if parsing fails
 */
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  const message = parseApiError(error);
  toast.error(message || defaultMessage);
  console.error('API Error:', error);
};

/**
 * Handle form validation errors
 * @param {Object} errors - Validation errors object
 * @param {Function} setFieldError - Function to set field errors (from Formik or similar)
 */
export const handleValidationErrors = (errors, setFieldError) => {
  if (!errors || typeof errors !== 'object') return;

  Object.keys(errors).forEach((field) => {
    const error = errors[field];
    const errorMessage = Array.isArray(error) ? error[0] : error;
    setFieldError(field, errorMessage);
  });
};

/**
 * Show error toast with custom options
 * @param {string} message - Error message
 * @param {Object} options - Toast options
 */
export const showError = (message, options = {}) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    ...options
  });
};

/**
 * Show success toast with custom options
 * @param {string} message - Success message
 * @param {Object} options - Toast options
 */
export const showSuccess = (message, options = {}) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    ...options
  });
};

/**
 * Show warning toast with custom options
 * @param {string} message - Warning message
 * @param {Object} options - Toast options
 */
export const showWarning = (message, options = {}) => {
  toast(message, {
    duration: 3500,
    position: 'top-right',
    icon: '⚠️',
    ...options
  });
};

/**
 * Show info toast with custom options
 * @param {string} message - Info message
 * @param {Object} options - Toast options
 */
export const showInfo = (message, options = {}) => {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: 'ℹ️',
    ...options
  });
};

/**
 * Async error handler wrapper for async functions
 * @param {Function} fn - Async function to wrap
 * @param {string} errorMessage - Custom error message
 * @returns {Function} Wrapped function
 */
export const withErrorHandler = (fn, errorMessage) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, errorMessage);
      throw error;
    }
  };
};

/**
 * Retry logic for failed operations
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} Result of successful operation
 */
export const retryOperation = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

/**
 * Check if error is a network error
 * @param {Error} error - Error object
 * @returns {boolean} True if network error
 */
export const isNetworkError = (error) => {
  return !error.response || error.code === 'ECONNABORTED' || error.message === 'Network Error';
};

/**
 * Check if error is an authentication error
 * @param {Error} error - Error object
 * @returns {boolean} True if auth error
 */
export const isAuthError = (error) => {
  return error.response?.status === 401;
};

/**
 * Check if error is a validation error
 * @param {Error} error - Error object
 * @returns {boolean} True if validation error
 */
export const isValidationError = (error) => {
  return error.response?.status === 422 || error.response?.status === 400;
};

/**
 * Log error to external service (e.g., Sentry, LogRocket)
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export const logError = (error, context = {}) => {
  // In production, send to error tracking service
  if (import.meta.env.PROD) {
    // Example: Sentry.captureException(error, { extra: context });
    console.error('Error logged:', error, context);
  } else {
    console.error('Development Error:', error, context);
  }
};

export default {
  parseApiError,
  parseValidationErrors,
  handleApiError,
  handleValidationErrors,
  showError,
  showSuccess,
  showWarning,
  showInfo,
  withErrorHandler,
  retryOperation,
  isNetworkError,
  isAuthError,
  isValidationError,
  logError
};
