import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaUpload, FaTimes, FaImage, FaExclamationTriangle } from 'react-icons/fa';

/**
 * MultipleImageUpload Component
 * Reusable component for uploading multiple images with drag-and-drop and preview
 * 
 * @param {Object} props
 * @param {string} props.label - Label for the upload field
 * @param {Array} props.value - Array of current image URLs
 * @param {Function} props.onChange - Callback when images are selected (array of file objects)
 * @param {Function} props.onRemove - Callback when an image is removed (index)
 * @param {number} props.maxFiles - Maximum number of files allowed (default: 5)
 * @param {number} props.maxSize - Maximum file size in bytes per file (default: 5MB)
 * @param {boolean} props.required - Whether at least one file is required
 * @param {boolean} props.disabled - Whether the upload is disabled
 * @param {string} props.className - Additional CSS classes
 */
const MultipleImageUpload = ({
  label = 'Upload Images',
  value = [],
  onChange,
  onRemove,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default per file
  required = false,
  disabled = false,
  className = ''
}) => {
  const [previews, setPreviews] = useState(value);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');

    // Check if we're at max capacity
    if (previews.length >= maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`);
      return;
    }

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`File is too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(0)}MB per file`);
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload images only.');
      } else if (rejection.errors[0]?.code === 'too-many-files') {
        setError(`Too many files. Maximum ${maxFiles} images allowed.`);
      } else {
        setError('Failed to upload files. Please try again.');
      }
      return;
    }

    // Limit accepted files to remaining slots
    const remainingSlots = maxFiles - previews.length;
    const filesToAdd = acceptedFiles.slice(0, remainingSlots);

    if (acceptedFiles.length > remainingSlots) {
      setError(`Only added ${remainingSlots} image(s). Maximum ${maxFiles} images allowed.`);
    }

    // Process accepted files
    const newPreviews = [];
    const filePromises = filesToAdd.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push({
            file,
            preview: reader.result,
            id: Date.now() + Math.random()
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then(() => {
      const updatedPreviews = [...previews, ...newPreviews];
      setPreviews(updatedPreviews);
      if (onChange) {
        onChange(updatedPreviews.map(p => p.file || p));
      }
    });
  }, [previews, maxFiles, maxSize, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize,
    maxFiles: maxFiles - previews.length,
    multiple: true,
    disabled: disabled || previews.length >= maxFiles
  });

  const handleRemove = (index) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    setError('');
    if (onRemove) {
      onRemove(index);
    }
    if (onChange) {
      onChange(updatedPreviews.map(p => p.file || p));
    }
  };

  const isMaxReached = previews.length >= maxFiles;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
          <span className="text-sm text-gray-500 font-normal ml-2">
            ({previews.length}/{maxFiles})
          </span>
        </label>
      )}

      {/* Image Grid Preview */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
          {previews.map((item, index) => (
            <div
              key={item.id || index}
              className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary-500 transition-colors"
            >
              <img
                src={item.preview || item}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all transform scale-90 group-hover:scale-100"
                    title="Remove image"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dropzone */}
      {!isMaxReached && (
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-lg transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : error
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <input {...getInputProps()} />

          <div className="p-6 text-center">
            <FaImage className={`mx-auto text-3xl mb-2 ${
              isDragActive ? 'text-primary-600' : 'text-gray-400'
            }`} />
            {isDragActive ? (
              <p className="text-primary-700 font-medium">Drop images here...</p>
            ) : (
              <>
                <p className="text-gray-600 font-medium mb-1">
                  <FaUpload className="inline mr-2" />
                  Drag & drop images, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  {maxFiles - previews.length} more image{maxFiles - previews.length !== 1 ? 's' : ''} allowed •
                  Max {(maxSize / (1024 * 1024)).toFixed(0)}MB per file
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Max Reached Message */}
      {isMaxReached && (
        <div className="border-2 border-primary-500 bg-primary-50 rounded-lg p-4 text-center">
          <FaExclamationTriangle className="inline text-primary-700 mr-2" />
          <span className="text-primary-700 font-medium">
            Maximum {maxFiles} images reached
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <FaTimes className="flex-shrink-0" />
          {error}
        </p>
      )}

      {/* Helper Text */}
      {!error && previews.length === 0 && (
        <p className="mt-2 text-xs text-gray-500">
          You can upload up to {maxFiles} images. Drag multiple files at once or select them individually.
        </p>
      )}
    </div>
  );
};

export default MultipleImageUpload;
