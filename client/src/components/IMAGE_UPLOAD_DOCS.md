# 📸 Image Upload Components

Reusable, production-ready image upload components for React with drag-and-drop, preview, cropping, and progress indicators.

## 📦 Components

### 1. SingleImageUpload
Upload a single image with preview and validation.

**Use cases:** Logos, avatars, banners, featured images

```jsx
import { SingleImageUpload } from '../components/imageUploads';

<SingleImageUpload
  label="Shop Logo"
  value={logoUrl}
  onChange={(file) => setLogoFile(file)}
  onRemove={() => setLogoFile(null)}
  maxSize={5 * 1024 * 1024} // 5MB
  aspectRatio="1:1"
  recommendedSize="200x200px"
  required={true}
  disabled={false}
/>
```

**Props:**
- `label` (string): Field label
- `value` (string): Current image URL for preview
- `onChange` (function): Callback with File object when image is selected
- `onRemove` (function): Callback when image is removed
- `maxSize` (number): Max file size in bytes (default: 5MB)
- `aspectRatio` (string): Aspect ratio hint (e.g., "1:1", "16:9")
- `recommendedSize` (string): Recommended dimensions (e.g., "200x200px")
- `required` (boolean): Whether field is required
- `disabled` (boolean): Disable upload
- `className` (string): Additional CSS classes

---

### 2. MultipleImageUpload
Upload multiple images with drag-and-drop and grid preview.

**Use cases:** Product galleries, portfolio images, photo albums

```jsx
import { MultipleImageUpload } from '../components/imageUploads';

<MultipleImageUpload
  label="Product Images"
  value={imageUrls}
  onChange={(files) => setImageFiles(files)}
  onRemove={(index) => removeImage(index)}
  maxFiles={5}
  maxSize={5 * 1024 * 1024}
  required={false}
  disabled={false}
/>
```

**Props:**
- `label` (string): Field label
- `value` (array): Array of current image URLs
- `onChange` (function): Callback with array of File objects
- `onRemove` (function): Callback with index when image is removed
- `maxFiles` (number): Maximum files allowed (default: 5)
- `maxSize` (number): Max file size per file in bytes (default: 5MB)
- `required` (boolean): Whether at least one file is required
- `disabled` (boolean): Disable upload
- `className` (string): Additional CSS classes

**Features:**
- Drag multiple files at once
- Grid preview with numbered indicators
- Hover to reveal delete button
- Shows count (e.g., "3/5")
- Max capacity warning

---

### 3. ImageCropUpload
Upload and crop images to specific dimensions with modal interface.

**Use cases:** Profile pictures, thumbnails, social media images

```jsx
import { ImageCropUpload } from '../components/imageUploads';

<ImageCropUpload
  label="Profile Picture"
  value={avatarUrl}
  onChange={(file) => setAvatarFile(file)}
  aspect={1} // Square crop
  maxSize={5 * 1024 * 1024}
  circularCrop={true}
  required={false}
  disabled={false}
/>
```

**Props:**
- `label` (string): Field label
- `value` (string): Current image URL
- `onChange` (function): Callback with cropped File/Blob
- `aspect` (number): Aspect ratio (1 = square, 16/9 = widescreen, etc.)
- `maxSize` (number): Max file size in bytes (default: 5MB)
- `circularCrop` (boolean): Show circular crop overlay
- `required` (boolean): Whether field is required
- `disabled` (boolean): Disable upload
- `className` (string): Additional CSS classes

**Features:**
- Full-screen modal cropping interface
- Adjustable crop area
- Reset crop button
- Preview of cropped result
- Outputs cropped JPEG at 95% quality

---

### 4. UploadProgress
Display upload progress for multiple files with status indicators.

**Use cases:** Batch uploads, background upload tracking

```jsx
import { UploadProgress } from '../components/imageUploads';

const [files, setFiles] = useState([
  { name: 'image1.jpg', progress: 45, status: 'uploading' },
  { name: 'image2.jpg', progress: 100, status: 'success' },
  { name: 'image3.jpg', progress: 0, status: 'error', error: 'Too large' }
]);

<UploadProgress
  files={files}
  onCancel={(index) => cancelUpload(index)}
/>
```

**Props:**
- `files` (array): Array of file objects with { name, progress, status, error }
- `onCancel` (function): Callback with index to cancel upload
- `className` (string): Additional CSS classes

**File statuses:**
- `uploading`: Shows spinner and progress bar
- `success`: Shows checkmark and green progress
- `error`: Shows error icon and message

---

### 5. SimpleProgressBar
Minimal progress bar for single file uploads.

**Use cases:** Simple upload feedback, loading indicators

```jsx
import { SimpleProgressBar } from '../components/imageUploads';

<SimpleProgressBar
  progress={75}
  status="uploading"
  message="Uploading image..."
/>
```

**Props:**
- `progress` (number): Progress percentage (0-100)
- `status` (string): 'uploading', 'success', or 'error'
- `message` (string): Optional message to display
- `className` (string): Additional CSS classes

---

## 🚀 Installation

The components are already installed! They use:
- `react-dropzone` - Drag & drop functionality
- `react-image-crop` - Image cropping
- `react-icons` - UI icons

## 💡 Usage Examples

### Example 1: Product Image Upload

```jsx
import { useState } from 'react';
import { MultipleImageUpload } from '../components/imageUploads';
import { productAPI } from '../utils/api';

function ProductForm() {
  const [images, setImages] = useState([]);
  
  const handleSubmit = async () => {
    const formData = new FormData();
    images.forEach(file => formData.append('images', file));
    
    const response = await productAPI.uploadImages(formData);
    console.log('Uploaded:', response.images);
  };
  
  return (
    <form>
      <MultipleImageUpload
        label="Product Images"
        onChange={setImages}
        maxFiles={5}
      />
      <button onClick={handleSubmit}>Save Product</button>
    </form>
  );
}
```

### Example 2: Avatar with Cropping

```jsx
import { useState } from 'react';
import { ImageCropUpload } from '../components/imageUploads';
import { userAPI } from '../utils/api';

function ProfileSettings() {
  const [avatar, setAvatar] = useState(null);
  
  const handleUpload = async (file) => {
    setAvatar(file);
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    await userAPI.uploadAvatar(formData);
  };
  
  return (
    <ImageCropUpload
      label="Profile Picture"
      onChange={handleUpload}
      aspect={1}
      circularCrop={true}
    />
  );
}
```

### Example 3: Upload with Progress

```jsx
import { useState } from 'react';
import { SingleImageUpload, SimpleProgressBar } from '../components/imageUploads';

function BannerUpload() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  
  const handleUpload = async () => {
    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('banner', file);
    
    // Upload with progress tracking
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => setStatus('success');
    xhr.onerror = () => setStatus('error');
    
    xhr.open('POST', '/api/shop/banner');
    xhr.send(formData);
  };
  
  return (
    <div>
      <SingleImageUpload
        label="Shop Banner"
        onChange={setFile}
      />
      {status !== 'idle' && (
        <SimpleProgressBar
          progress={progress}
          status={status}
          message="Uploading banner..."
        />
      )}
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
```

## ✨ Features

- ✅ **Drag & Drop**: Native drag-and-drop support
- ✅ **File Validation**: Size and type validation
- ✅ **Image Preview**: Instant preview before upload
- ✅ **Image Cropping**: Built-in crop tool with aspect ratio
- ✅ **Progress Tracking**: Visual upload progress
- ✅ **Multiple Files**: Batch upload support
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Responsive**: Mobile-friendly interface
- ✅ **Accessible**: Keyboard navigation support
- ✅ **Customizable**: Flexible props for any use case

## 🎨 Styling

All components use Tailwind CSS classes and can be customized via the `className` prop:

```jsx
<SingleImageUpload
  className="my-custom-class"
  // ... other props
/>
```

## 📝 Notes

- All images are validated for type and size
- File size limits are configurable per component
- Cropped images are output as JPEG at 95% quality
- Progress components support cancellation callbacks
- Components handle loading states internally

## 🔗 Integration with Backend

Components output File/Blob objects ready for FormData:

```jsx
const formData = new FormData();
formData.append('image', fileObject);

// Send to API
await fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

## 🐛 Troubleshooting

**Images not showing preview:**
- Ensure file is a valid image type (PNG, JPG, GIF, WebP)
- Check browser console for errors

**Crop modal not opening:**
- Verify `react-image-crop` is installed
- Check for CSS import: `import 'react-image-crop/dist/ReactCrop.css'`

**Upload fails:**
- Check file size limits
- Verify API endpoint accepts FormData
- Check network tab for server errors

---

**Demo Page:** See `/pages/ImageUploadExamples.jsx` for live examples of all components.
