const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary with timeout protection
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 60000, // 60s timeout to prevent hanging requests
  secure: true // Always use HTTPS
});

// Multer configuration for memory storage
const storage = multer.memoryStorage();

// Strict file validation
const fileFilter = (req, file, cb) => {
  // Accept images only
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only JPEG, PNG, WebP, and GIF allowed. Received: ${file.mimetype}`), false);
  }
};

// Enhanced multer config with strict limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Max 10 files per request
    fields: 20, // Max 20 non-file fields
    parts: 30 // Max 30 total parts (files + fields)
  },
  fileFilter: fileFilter
});

// Aggressive compression settings for different use cases
const getCompressionConfig = (type = 'default') => {
  const configs = {
    // Product images - high quality with balanced compression
    product: {
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' }, // Max dimensions
        { quality: 'auto:good', fetch_format: 'auto' }, // Auto format conversion (WebP for supported browsers)
        { flags: 'progressive' } // Progressive JPEG loading
      ]
    },
    // Thumbnails - aggressive compression
    thumbnail: {
      transformation: [
        {
          width: 400, height: 400, crop: 'fill', gravity: 'auto'
        },
        { quality: 'auto:low', fetch_format: 'auto' },
        { flags: 'progressive' }
      ]
    },
    // Shop logo/banner - maintain quality but compress
    branding: {
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto:best', fetch_format: 'auto' },
        { flags: 'progressive' }
      ]
    },
    // Default - balanced
    default: {
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
        { flags: 'progressive' }
      ]
    }
  };

  return configs[type] || configs.default;
};

module.exports = { cloudinary, upload, getCompressionConfig };
