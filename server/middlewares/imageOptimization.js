/**
 * Image Optimization Middleware
 *
 * Pre-processes and validates images before controller processing
 * Prevents large/invalid images from overwhelming the server
 */

const rateLimit = require('express-rate-limit');
const sharp = require('sharp');
const logger = require('../utils/logger');

/**
 * Validate image before processing
 * Checks file size, dimensions, format
 */
const validateImage = async (req, res, next) => {
  // Skip if no files uploaded
  if (!req.file && (!req.files || req.files.length === 0)) {
    return next();
  }

  try {
    const files = req.files || [req.file];

    // Validate each file
    for (const file of files) {
      if (!file) continue;

      // Check file size (5MB max - already enforced by multer, but double-check)
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: `Image "${file.originalname}" is too large. Maximum size: 5MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
        });
      }

      // Validate image with Sharp (ensures it's a valid image)
      try {
        const metadata = await sharp(file.buffer).metadata();

        // Check dimensions (prevent extremely large images)
        if (metadata.width > 5000 || metadata.height > 5000) {
          return res.status(400).json({
            success: false,
            message: `Image "${file.originalname}" dimensions too large. Maximum: 5000x5000 pixels. Current: ${metadata.width}x${metadata.height}`
          });
        }

        // Check for corrupted images
        if (!metadata.format || !metadata.width || !metadata.height) {
          return res.status(400).json({
            success: false,
            message: `Image "${file.originalname}" appears to be corrupted or invalid`
          });
        }

        // Warn about tiny images (might be broken)
        if (metadata.width < 50 || metadata.height < 50) {
          logger.warn('Suspiciously small image uploaded', {
            fileName: file.originalname,
            dimensions: `${metadata.width}x${metadata.height}`,
            userId: req.user?.id
          });
        }

        // Add metadata to file object for later use
        file.imageMetadata = {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          space: metadata.space,
          hasAlpha: metadata.hasAlpha
        };

        logger.debug('Image validated successfully', {
          fileName: file.originalname,
          format: metadata.format,
          dimensions: `${metadata.width}x${metadata.height}`,
          size: file.size
        });
      } catch (error) {
        logger.error('Image validation failed', {
          fileName: file.originalname,
          error: error.message
        });

        return res.status(400).json({
          success: false,
          message: `Invalid or corrupted image: "${file.originalname}". Please upload a valid JPEG, PNG, WebP, or GIF file.`
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Image validation middleware error', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to validate images. Please try again.'
    });
  }
};

/**
 * Rate limit image uploads per user
 * Prevents abuse and server overload
 */
const imageUploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 image uploads per 15 minutes
  message: {
    success: false,
    message: 'Too many image uploads. Please wait 15 minutes before uploading more images.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    // Skip rate limiting for Premium users (they pay for it)
    req.user?.plan === 'premium',
  keyGenerator: (req) =>
    // Rate limit by user ID
    req.user?.id || req.ip

});

/**
 * Limit concurrent uploads per request
 * Prevents overwhelming the server with too many simultaneous uploads
 */
const limitConcurrentUploads = (req, res, next) => {
  const files = req.files || [];

  // Free plan: max 3 images per request
  // Pro plan: max 5 images per request
  // Premium plan: max 10 images per request
  const maxFiles = {
    free: 3,
    pro: 5,
    premium: 10
  };

  const userPlan = req.user?.plan || 'free';
  const limit = maxFiles[userPlan];

  if (files.length > limit) {
    return res.status(400).json({
      success: false,
      message: `Your ${userPlan} plan allows maximum ${limit} images per upload. Current: ${files.length}. ${userPlan !== 'premium' ? 'Upgrade to upload more images at once.' : ''}`,
      upgrade: userPlan !== 'premium'
    });
  }

  next();
};

/**
 * Auto-resize overly large images before processing
 * Prevents memory issues and speeds up processing
 */
const autoResize = async (req, res, next) => {
  // Skip if no files
  if (!req.file && (!req.files || req.files.length === 0)) {
    return next();
  }

  try {
    const files = req.files || [req.file];

    // Process each file
    for (const file of files) {
      if (!file) continue;

      // Skip if already under size limit
      if (file.size <= 1 * 1024 * 1024) {
        continue;
      }

      // Resize large images
      try {
        const resized = await sharp(file.buffer)
          .resize(2000, 2000, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({
            quality: 85,
            progressive: true
          })
          .toBuffer();

        // Only use resized version if it's actually smaller
        if (resized.length < file.size) {
          const originalSize = file.size;
          file.buffer = resized;
          file.size = resized.length;

          logger.info('Image auto-resized', {
            fileName: file.originalname,
            originalSize,
            newSize: file.size,
            savings: `${((1 - (file.size / originalSize)) * 100).toFixed(2)}%`
          });
        }
      } catch (error) {
        logger.error('Auto-resize failed', {
          fileName: file.originalname,
          error: error.message
        });
        // Continue with original file if resize fails
      }
    }

    next();
  } catch (error) {
    logger.error('Auto-resize middleware error', {
      error: error.message
    });

    // Continue without resizing if error occurs
    next();
  }
};

module.exports = {
  validateImage,
  imageUploadRateLimiter,
  limitConcurrentUploads,
  autoResize
};
