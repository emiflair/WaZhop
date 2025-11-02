import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  SingleImageUpload, 
  MultipleImageUpload, 
  ImageCropUpload,
  UploadProgress,
  SimpleProgressBar 
} from '../components/imageUploads';
import toast from 'react-hot-toast';

/**
 * ImageUploadExamples - Demo page showing how to use all image upload components
 * This file can be used as a reference for implementing image uploads in your pages
 */
const ImageUploadExamples = () => {
  // Single Image Upload
  const [singleImage, setSingleImage] = useState(null);
  const [singleImageFile, setSingleImageFile] = useState(null);

  // Multiple Image Upload
  const [multipleImageFiles, setMultipleImageFiles] = useState([]);

  // Image Crop Upload
  const [croppedImageFile, setCroppedImageFile] = useState(null);

  // Progress Demo
  const [uploadProgress, setUploadProgress] = useState([]);
  const [simpleProgress, setSimpleProgress] = useState(0);

  // Example: Upload single image to API
  const handleSingleImageUpload = async () => {
    if (!singleImageFile) {
      toast.error('Please select an image first');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('logo', singleImageFile);

      // Example API call
      // const response = await shopAPI.uploadLogo(formData);
      // setSingleImage(response.logo);
      
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    }
  };

  // Example: Upload multiple images to API
  const handleMultipleImagesUpload = async () => {
    if (multipleImageFiles.length === 0) {
      toast.error('Please select images first');
      return;
    }

    try {
      const formData = new FormData();
      multipleImageFiles.forEach((file) => {
        formData.append('images', file);
      });

      // Example API call with progress tracking
      const files = multipleImageFiles.map((file) => ({
        name: file.name,
        progress: 0,
        status: 'uploading'
      }));
      setUploadProgress(files);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev =>
          prev.map(file => {
            if (file.status !== 'uploading') return file;
            const newProgress = Math.min(file.progress + 10, 100);
            return {
              ...file,
              progress: newProgress,
              status: newProgress === 100 ? 'success' : 'uploading'
            };
          })
        );
      }, 500);

      // Clear interval after completion
      setTimeout(() => {
        clearInterval(interval);
        toast.success('All images uploaded successfully!');
      }, 5000);

      // Actual API call would be:
      // const response = await productAPI.uploadImages(formData);
      // setMultipleImages(response.images);
      
    } catch (error) {
      toast.error('Failed to upload images');
      console.error(error);
    }
  };

  // Example: Upload cropped image
  const handleCroppedImageUpload = async () => {
    if (!croppedImageFile) {
      toast.error('Please crop an image first');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('avatar', croppedImageFile);

      // Example API call
      // const response = await userAPI.uploadAvatar(formData);
      // setCroppedImage(response.avatar);
      
      toast.success('Cropped image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload cropped image');
      console.error(error);
    }
  };

  // Example: Simulate simple progress
  const simulateSimpleProgress = () => {
    setSimpleProgress(0);
    const interval = setInterval(() => {
      setSimpleProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Image Upload Components</h1>
          <p className="text-gray-600 mt-2">
            Demo of all reusable image upload components
          </p>
        </div>

        {/* Single Image Upload */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Single Image Upload</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload a single image with preview. Perfect for logos, avatars, or banners.
          </p>
          
          <SingleImageUpload
            label="Shop Logo"
            value={singleImage}
            onChange={(file) => {
              setSingleImageFile(file);
              console.log('Selected file:', file);
            }}
            onRemove={() => {
              setSingleImage(null);
              setSingleImageFile(null);
            }}
            maxSize={5 * 1024 * 1024}
            aspectRatio="1:1"
            recommendedSize="200x200px"
            required
          />

          {singleImageFile && (
            <button
              onClick={handleSingleImageUpload}
              className="btn-primary mt-4"
            >
              Upload to Server
            </button>
          )}

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-mono text-gray-700">
              <strong>Usage:</strong>
            </p>
            <pre className="text-xs text-gray-600 mt-2 overflow-x-auto">
{`<SingleImageUpload
  label="Shop Logo"
  onChange={(file) => setFile(file)}
  onRemove={() => setFile(null)}
  maxSize={5 * 1024 * 1024}
  aspectRatio="1:1"
  recommendedSize="200x200px"
  required
/>`}
            </pre>
          </div>
        </div>

        {/* Multiple Image Upload */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Multiple Image Upload</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload multiple images with drag-and-drop. Great for product galleries.
          </p>
          
          <MultipleImageUpload
            label="Product Images"
            value={[]}
            onChange={(files) => {
              setMultipleImageFiles(files);
              console.log('Selected files:', files);
            }}
            onRemove={(index) => {
              console.log('Removed image at index:', index);
            }}
            maxFiles={5}
            maxSize={5 * 1024 * 1024}
            required
          />

          {multipleImageFiles.length > 0 && (
            <>
              <button
                onClick={handleMultipleImagesUpload}
                className="btn-primary mt-4"
              >
                Upload {multipleImageFiles.length} Image(s)
              </button>

              {uploadProgress.length > 0 && (
                <div className="mt-4">
                  <UploadProgress files={uploadProgress} />
                </div>
              )}
            </>
          )}

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-mono text-gray-700">
              <strong>Usage:</strong>
            </p>
            <pre className="text-xs text-gray-600 mt-2 overflow-x-auto">
{`<MultipleImageUpload
  label="Product Images"
  onChange={(files) => setFiles(files)}
  onRemove={(index) => removeFile(index)}
  maxFiles={5}
  maxSize={5 * 1024 * 1024}
/>`}
            </pre>
          </div>
        </div>

        {/* Image Crop Upload */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Image Crop & Upload</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload and crop images to specific dimensions. Ideal for profile pictures.
          </p>
          
          <ImageCropUpload
            label="Profile Picture (Square)"
            value={null}
            onChange={(file) => {
              setCroppedImageFile(file);
              console.log('Cropped file:', file);
            }}
            aspect={1}
            maxSize={5 * 1024 * 1024}
            circularCrop={false}
            required
          />

          {croppedImageFile && (
            <button
              onClick={handleCroppedImageUpload}
              className="btn-primary mt-4"
            >
              Upload Cropped Image
            </button>
          )}

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-mono text-gray-700">
              <strong>Usage:</strong>
            </p>
            <pre className="text-xs text-gray-600 mt-2 overflow-x-auto">
{`<ImageCropUpload
  label="Profile Picture"
  onChange={(file) => setFile(file)}
  aspect={1} // 1 for square, 16/9 for widescreen
  circularCrop={false}
  maxSize={5 * 1024 * 1024}
/>`}
            </pre>
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Progress Indicators</h2>
          <p className="text-sm text-gray-600 mb-4">
            Show upload progress to users for better UX.
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Simple Progress Bar</h3>
              <SimpleProgressBar
                progress={simpleProgress}
                status={simpleProgress === 100 ? 'success' : 'uploading'}
                message="Uploading image..."
              />
              <button
                onClick={simulateSimpleProgress}
                className="btn-secondary mt-2"
              >
                Simulate Upload
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-mono text-gray-700">
                <strong>Usage:</strong>
              </p>
              <pre className="text-xs text-gray-600 mt-2 overflow-x-auto">
{`<SimpleProgressBar
  progress={progress}
  status="uploading" // or "success", "error"
  message="Uploading image..."
/>

<UploadProgress
  files={[
    { name: 'image1.jpg', progress: 45, status: 'uploading' },
    { name: 'image2.jpg', progress: 100, status: 'success' },
    { name: 'image3.jpg', progress: 0, status: 'error', error: 'Too large' }
  ]}
  onCancel={(index) => cancelUpload(index)}
/>`}
              </pre>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="card bg-green-50 border-2 border-green-200">
          <h2 className="text-xl font-semibold mb-4">✨ Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Drag & drop support</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>File size validation</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>File type validation</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Image preview</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Image cropping</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Progress indicators</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Multiple file upload</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Error handling</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ImageUploadExamples;
