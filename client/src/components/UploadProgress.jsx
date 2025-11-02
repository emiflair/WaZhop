import { FaCheckCircle, FaSpinner, FaExclamationCircle } from 'react-icons/fa';

/**
 * UploadProgress Component
 * Shows upload progress with status indicators
 * 
 * @param {Object} props
 * @param {Array} props.files - Array of file upload objects with {name, progress, status, error}
 * @param {Function} props.onCancel - Callback to cancel an upload (fileIndex)
 * @param {string} props.className - Additional CSS classes
 */
const UploadProgress = ({ files = [], onCancel, className = '' }) => {
  if (files.length === 0) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploading':
        return <FaSpinner className="animate-spin" />;
      case 'success':
        return <FaCheckCircle />;
      case 'error':
        return <FaExclamationCircle />;
      default:
        return null;
    }
  };

  const getProgressColor = (progress, status) => {
    if (status === 'error') return 'bg-red-500';
    if (status === 'success') return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {files.map((file, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`flex-shrink-0 ${getStatusColor(file.status)}`}>
                {getStatusIcon(file.status)}
              </span>
              <span className="text-sm font-medium text-gray-700 truncate">
                {file.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${getStatusColor(file.status)}`}>
                {file.status === 'uploading' && `${file.progress}%`}
                {file.status === 'success' && 'Complete'}
                {file.status === 'error' && 'Failed'}
              </span>
              {file.status === 'uploading' && onCancel && (
                <button
                  type="button"
                  onClick={() => onCancel(index)}
                  className="text-gray-400 hover:text-red-600 text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {(file.status === 'uploading' || file.status === 'success') && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor(
                  file.progress,
                  file.status
                )}`}
                style={{ width: `${file.progress}%` }}
              />
            </div>
          )}

          {/* Error Message */}
          {file.status === 'error' && file.error && (
            <p className="text-xs text-red-600 mt-1">{file.error}</p>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * SimpleProgressBar Component
 * Minimal progress bar for single file uploads
 * 
 * @param {Object} props
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {string} props.status - Upload status ('uploading', 'success', 'error')
 * @param {string} props.message - Optional message to display
 * @param {string} props.className - Additional CSS classes
 */
export const SimpleProgressBar = ({
  progress = 0,
  status = 'uploading',
  message = '',
  className = ''
}) => {
  const getColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className={className}>
      {message && (
        <p className="text-sm text-gray-600 mb-2">{message}</p>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${getColor()}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-500">
          {status === 'uploading' && 'Uploading...'}
          {status === 'success' && 'Upload complete'}
          {status === 'error' && 'Upload failed'}
        </span>
        <span className="text-xs font-medium text-gray-700">
          {progress}%
        </span>
      </div>
    </div>
  );
};

export default UploadProgress;
