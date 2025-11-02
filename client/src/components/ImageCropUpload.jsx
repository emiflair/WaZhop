import { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { FaCrop, FaUndo, FaCheck, FaTimes } from 'react-icons/fa';

/**
 * ImageCropUpload Component
 * Image upload with built-in cropping functionality
 * 
 * @param {Object} props
 * @param {string} props.label - Label for the upload field
 * @param {string} props.value - Current image URL
 * @param {Function} props.onChange - Callback when cropped image is ready (Blob)
 * @param {number} props.aspect - Aspect ratio for crop (e.g., 1 for square, 16/9 for widescreen)
 * @param {number} props.maxSize - Maximum file size in bytes (default: 5MB)
 * @param {string} props.circularCrop - Whether to show circular crop overlay
 * @param {boolean} props.required - Whether the field is required
 * @param {boolean} props.disabled - Whether the upload is disabled
 * @param {string} props.className - Additional CSS classes
 */
const ImageCropUpload = ({
  label = 'Upload & Crop Image',
  value = null,
  onChange,
  aspect = 1, // Default to square
  maxSize = 5 * 1024 * 1024, // 5MB default
  circularCrop = false,
  required = false,
  disabled = false,
  className = ''
}) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [preview, setPreview] = useState(value);
  const [error, setError] = useState('');
  const [isCropping, setIsCropping] = useState(false);
  
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File is too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(0)}MB`);
      return;
    }

    // Load image for cropping
    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result);
      setIsCropping(true);
      // Set initial crop
      setCrop({
        unit: '%',
        width: 90,
        aspect: aspect
      });
    };
    reader.readAsDataURL(file);
  };

  const onImageLoad = useCallback((e) => {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    
    // Center the crop
    const cropWidth = Math.min(width, height) * 0.9;
    const cropHeight = aspect ? cropWidth / aspect : cropWidth;
    
    setCrop({
      unit: 'px',
      width: cropWidth,
      height: cropHeight,
      x: (width - cropWidth) / 2,
      y: (height - cropHeight) / 2
    });
  }, [aspect]);

  const getCroppedImg = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError('Failed to crop image');
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  }, [completedCrop]);

  const handleCropComplete = async () => {
    try {
      const croppedBlob = await getCroppedImg();
      if (croppedBlob) {
        // Create preview URL
        const previewUrl = URL.createObjectURL(croppedBlob);
        setPreview(previewUrl);
        setIsCropping(false);
        setImgSrc(null);
        
        // Create a File object from the Blob
        const croppedFile = new File([croppedBlob], 'cropped-image.jpg', {
          type: 'image/jpeg'
        });
        
        if (onChange) {
          onChange(croppedFile);
        }
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      setError('Failed to crop image');
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setImgSrc(null);
    setCrop(null);
    setCompletedCrop(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setImgSrc(null);
    setCrop(null);
    setCompletedCrop(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const cropWidth = Math.min(width, height) * 0.9;
      const cropHeight = aspect ? cropWidth / aspect : cropWidth;
      
      setCrop({
        unit: 'px',
        width: cropWidth,
        height: cropHeight,
        x: (width - cropWidth) / 2,
        y: (height - cropHeight) / 2
      });
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Cropping Interface */}
      {isCropping && imgSrc && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FaCrop className="text-green-500" />
                  Crop Image
                </h3>
                <p className="text-sm text-gray-500">
                  Adjust the crop area to your desired size
                </p>
              </div>
              <button
                onClick={handleCropCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-4">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                circularCrop={circularCrop}
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  className="max-w-full max-h-[60vh] mx-auto"
                />
              </ReactCrop>
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={handleReset}
                className="btn-secondary flex items-center gap-2"
              >
                <FaUndo />
                Reset
              </button>
              <button
                onClick={handleCropCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCropComplete}
                disabled={!completedCrop}
                className="btn-primary flex items-center gap-2"
              >
                <FaCheck />
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview or Upload Button */}
      {preview && !isCropping ? (
        <div className="relative border-2 border-green-500 rounded-lg p-2 bg-gray-50">
          <img
            src={preview}
            alt="Cropped preview"
            className={`w-full h-48 object-contain ${circularCrop ? 'rounded-full' : 'rounded-lg'}`}
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors"
              title="Change image"
            >
              <FaCrop />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      ) : !isCropping && (
        <div className="text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <FaCrop />
            Select Image to Crop
          </button>
          <p className="text-sm text-gray-500 mt-2">
            {aspect && `Aspect ratio: ${aspect.toFixed(2)}:1 • `}
            Max size: {(maxSize / (1024 * 1024)).toFixed(0)}MB
          </p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <FaTimes className="flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

export default ImageCropUpload;
