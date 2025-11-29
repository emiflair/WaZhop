import { isValidAfricanPhone } from './helpers';

/**
 * Form Validation Utilities
 * Common validation functions for form fields
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateEmail = (email) => {
  if (!email) {
    return 'Email is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return null;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {string|null} Error message or null if valid
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecialChar = false
  } = options;

  if (!password) {
    return 'Password is required';
  }

  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (requireNumber && !/\d/.test(password)) {
    return 'Password must contain at least one number';
  }

  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character';
  }

  return null;
};

/**
 * Calculate password strength
 * @param {string} password - Password to check
 * @returns {Object} Strength info with score and label
 */
export const getPasswordStrength = (password) => {
  let score = 0;
  
  if (!password) {
    return { score: 0, label: 'None', color: 'gray' };
  }

  // Length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character types
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  const strengths = [
    { score: 0, label: 'Very Weak', color: 'red' },
    { score: 1, label: 'Very Weak', color: 'red' },
    { score: 2, label: 'Weak', color: 'orange' },
    { score: 3, label: 'Fair', color: 'yellow' },
    { score: 4, label: 'Good', color: 'lime' },
    { score: 5, label: 'Strong', color: 'green' },
    { score: 6, label: 'Very Strong', color: 'green' }
  ];

  return strengths[score] || strengths[0];
};

/**
 * Validate phone number (African international formats)
 * @param {string} phone - Phone number to validate
 * @returns {string|null} Error message or null if valid
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return 'Phone number is required';
  }

  if (!isValidAfricanPhone(phone)) {
    return 'Please enter a valid phone number with country code (e.g., +233201234567)';
  }

  return null;
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @param {boolean} required - Whether URL is required
 * @returns {string|null} Error message or null if valid
 */
export const validateUrl = (url, required = false) => {
  if (!url) {
    return required ? 'URL is required' : null;
  }

  try {
    new URL(url);
    return null;
  } catch {
    return 'Please enter a valid URL';
  }
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} Error message or null if valid
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName} is required`;
  }

  return null;
};

/**
 * Validate minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} Error message or null if valid
 */
export const validateMinLength = (value, minLength, fieldName = 'This field') => {
  if (!value) return null;
  
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }

  return null;
};

/**
 * Validate maximum length
 * @param {string} value - Value to validate
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} Error message or null if valid
 */
export const validateMaxLength = (value, maxLength, fieldName = 'This field') => {
  if (!value) return null;
  
  if (value.length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters`;
  }

  return null;
};

/**
 * Validate number range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} Error message or null if valid
 */
export const validateRange = (value, min, max, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const num = Number(value);
  
  if (isNaN(num)) {
    return `${fieldName} must be a number`;
  }

  if (num < min || num > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }

  return null;
};

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {string|null} Error message or null if valid
 */
export const validateFileSize = (file, maxSizeMB = 5) => {
  if (!file) return null;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return `File size must not exceed ${maxSizeMB}MB`;
  }

  return null;
};

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {string|null} Error message or null if valid
 */
export const validateFileType = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
  if (!file) return null;

  if (!allowedTypes.includes(file.type)) {
    const typeNames = allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ');
    return `File type must be ${typeNames}`;
  }

  return null;
};

/**
 * Validate shop slug (URL-friendly)
 * @param {string} slug - Slug to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateSlug = (slug) => {
  if (!slug) {
    return 'Shop URL is required';
  }

  if (slug.length < 3) {
    return 'Shop URL must be at least 3 characters';
  }

  if (slug.length > 30) {
    return 'Shop URL must not exceed 30 characters';
  }

  // Only lowercase letters, numbers, and hyphens
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return 'Shop URL can only contain lowercase letters, numbers, and hyphens';
  }

  // Cannot start or end with hyphen
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return 'Shop URL cannot start or end with a hyphen';
  }

  // No consecutive hyphens
  if (slug.includes('--')) {
    return 'Shop URL cannot contain consecutive hyphens';
  }

  return null;
};

/**
 * Validate price
 * @param {number} price - Price to validate
 * @returns {string|null} Error message or null if valid
 */
export const validatePrice = (price) => {
  if (price === null || price === undefined || price === '') {
    return 'Price is required';
  }

  const num = Number(price);
  
  if (isNaN(num)) {
    return 'Price must be a number';
  }

  if (num < 0) {
    return 'Price cannot be negative';
  }

  if (num > 10000000) {
    return 'Price is too high';
  }

  return null;
};

/**
 * Combine multiple validators
 * @param {Array} validators - Array of validator functions
 * @returns {Function} Combined validator function
 */
export const combineValidators = (...validators) => {
  return (value) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  };
};

export default {
  validateEmail,
  validatePassword,
  getPasswordStrength,
  validatePhone,
  validateUrl,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateRange,
  validateFileSize,
  validateFileType,
  validateSlug,
  validatePrice,
  combineValidators
};
