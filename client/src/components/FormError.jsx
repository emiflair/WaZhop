import { FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

/**
 * FormError Component
 * Displays inline validation errors or success messages for form fields
 * 
 * @param {Object} props
 * @param {string} props.error - Error message to display
 * @param {boolean} props.touched - Whether field has been touched
 * @param {boolean} props.success - Whether to show success state
 * @param {string} props.successMessage - Success message to display
 * @param {string} props.className - Additional CSS classes
 */
export const FormError = ({
  error,
  touched = false,
  success = false,
  successMessage,
  className = ''
}) => {
  if (!touched && !success) return null;

  if (success && successMessage) {
    return (
      <p className={`text-sm text-green-600 flex items-center gap-1 mt-1 ${className}`}>
        <FaCheckCircle className="flex-shrink-0" />
        {successMessage}
      </p>
    );
  }

  if (error && touched) {
    return (
      <p className={`text-sm text-red-600 flex items-center gap-1 mt-1 ${className}`}>
        <FaExclamationCircle className="flex-shrink-0" />
        {error}
      </p>
    );
  }

  return null;
};

/**
 * FormField Component
 * Wrapper for form inputs with integrated error display
 * 
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {string} props.error - Error message
 * @param {boolean} props.touched - Whether field has been touched
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.helperText - Helper text below field
 * @param {ReactNode} props.children - Input element
 * @param {string} props.className - Additional CSS classes
 */
export const FormField = ({
  label,
  error,
  touched = false,
  required = false,
  helperText,
  children,
  className = ''
}) => {
  const hasError = error && touched;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {children}
      
      {hasError ? (
        <FormError error={error} touched={touched} />
      ) : helperText ? (
        <p className="text-sm text-gray-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};

export default FormError;
