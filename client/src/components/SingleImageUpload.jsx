import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaUpload, FaTimes, FaImage, FaCheckCircle } from 'react-icons/fa';

/**
 * SingleImageUpload Component
 * Reusable component for uploading a single image with preview
 * 
 * @param {Object} props
 * @param {string} props.label - Label for the upload field
 * @param {string} props.value - Current image URL
 * @param {Function} props.onChange - Callback when image is selected (file object)
 * @param {Function} props.onRemove - Callback when image is removed
 * @param {number} props.maxSize - Maximum file size in bytes (default: 5MB)
 * @param {string} props.aspectRatio - Aspect ratio hint (e.g., "1:1", "16:9")
 * @param {string} props.recommendedSize - Recommended dimensions (e.g., "200x200px")
 * @param {boolean} props.required - Whether the field is required
 * @param {boolean} props.disabled - Whether the upload is disabled
 * @param {string} props.className - Additional CSS classes
 */
const SingleImageUpload = ({
  label = 'Upload Image',
  value = null,
  onChange,
  onRemove,
  maxSize = 5 * 1024 * 1024, // 5MB default
  aspectRatio = null,
  recommendedSize = null,
  required = false,
  disabled = false,
  className = ''
}) => {
  const [preview, setPreview] = useState(value);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`File is too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(0)}MB`);
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload an image.');
      } else {
        setError('Failed to upload file. Please try again.');
      }
      return;
    }

    // Handle accepted file
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        if (onChange) {
          onChange(file);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [maxSize, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize,
    multiple: false,
    disabled: disabled
  });

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    setError('');
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg transition-colors ${
          isDragActive
            ? 'border-green-500 bg-green-50'
            : error
            ? 'border-red-500 bg-red-50'
            : preview
            ? 'border-green-500 bg-gray-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} />

        {preview ? (
          // Preview State
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-contain rounded-lg p-2"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <div className="bg-green-500 text-white rounded-full p-2">
                <FaCheckCircle />
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
        ) : (
          // Empty State
          <div className="p-8 text-center">
            <FaImage className={`mx-auto text-4xl mb-3 ${
              isDragActive ? 'text-green-500' : 'text-gray-400'
            }`} />
            {isDragActive ? (
              <p className="text-green-600 font-medium">Drop image here...</p>
            ) : (
              <>
                <p className="text-gray-600 font-medium mb-1">
                  <FaUpload className="inline mr-2" />
                  Drag & drop an image here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  {recommendedSize && `Recommended: ${recommendedSize} • `}
                  {aspectRatio && `Ratio: ${aspectRatio} • `}
                  Max: {(maxSize / (1024 * 1024)).toFixed(0)}MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <FaTimes className="flex-shrink-0" />
          {error}
        </p>
      )}

      {!error && (recommendedSize || aspectRatio) && !preview && (
        <p className="mt-2 text-xs text-gray-500">
          {recommendedSize && `Recommended size: ${recommendedSize}`}
          {recommendedSize && aspectRatio && ' • '}
          {aspectRatio && `Aspect ratio: ${aspectRatio}`}
        </p>
      )}
    </div>
  );
};

export default SingleImageUpload;
