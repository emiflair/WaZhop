const axios = require('axios');
const { moderateContent } = require('./contentModeration');

/**
 * Image Moderation Service
 * Uses Cloudinary's moderation features and URL analysis
 * Can be extended with Google Cloud Vision or AWS Rekognition
 */

/**
 * Check if image URL contains suspicious patterns
 * @param {string} url - Image URL to check
 * @returns {object} - { safe, reason }
 */
function checkImageUrl(url) {
  if (!url) return { safe: true, reason: null };

  const lowerUrl = url.toLowerCase();
  const unsafePatterns = [
    'xxx', 'porn', 'adult', 'nsfw', 'explicit', 'nude', 'sex',
    'violence', 'gore', 'blood', 'weapon', 'gun', 'drug'
  ];

  for (const pattern of unsafePatterns) {
    if (lowerUrl.includes(pattern)) {
      return {
        safe: false,
        reason: `Image URL contains suspicious pattern: ${pattern}`
      };
    }
  }

  return { safe: true, reason: null };
}

/**
 * Analyze image metadata from Cloudinary
 * Cloudinary automatically provides moderation scores
 * @param {object} imageData - Cloudinary upload response
 * @returns {object} - { safe, confidence, categories }
 */
function analyzeCloudinaryModeration(imageData) {
  // Cloudinary provides moderation data in the response
  // moderation: [{ status: 'approved/rejected', kind: 'aws_rek/google/...', response: {} }]
  
  if (!imageData || !imageData.moderation) {
    return { safe: true, confidence: 'unknown', categories: [] };
  }

  const moderationResults = imageData.moderation;
  
  for (const result of moderationResults) {
    if (result.status === 'rejected') {
      return {
        safe: false,
        confidence: 'high',
        categories: result.response?.categories || ['inappropriate_content'],
        provider: result.kind
      };
    }
  }

  return { safe: true, confidence: 'high', categories: [] };
}

/**
 * Basic image validation
 * Checks file size, dimensions, and format
 * @param {object} file - Image file info { size, mimetype, width, height }
 * @returns {object} - { valid, reason }
 */
function validateImageFile(file) {
  const { size, mimetype, width, height } = file;

  // Check file size (max 10MB)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (size && size > MAX_SIZE) {
    return {
      valid: false,
      reason: 'Image file size exceeds 10MB limit'
    };
  }

  // Check mime type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (mimetype && !allowedTypes.includes(mimetype.toLowerCase())) {
    return {
      valid: false,
      reason: 'Invalid image format. Only JPEG, PNG, WebP, and GIF are allowed'
    };
  }

  // Check dimensions (optional)
  const MAX_DIMENSION = 8000;
  if (width && width > MAX_DIMENSION) {
    return {
      valid: false,
      reason: `Image width exceeds maximum dimension of ${MAX_DIMENSION}px`
    };
  }
  if (height && height > MAX_DIMENSION) {
    return {
      valid: false,
      reason: `Image height exceeds maximum dimension of ${MAX_DIMENSION}px`
    };
  }

  return { valid: true, reason: null };
}

/**
 * Moderate image content
 * Comprehensive check combining URL, file validation, and AI moderation
 * @param {object} imageInfo - { url, publicId, cloudinaryData, file }
 * @returns {Promise<object>} - { allowed, reason, severity, details }
 */
async function moderateImage(imageInfo) {
  const { url, cloudinaryData, file } = imageInfo;

  // 1. Check URL for suspicious patterns
  const urlCheck = checkImageUrl(url);
  if (!urlCheck.safe) {
    return {
      allowed: false,
      reason: 'Image URL contains inappropriate content indicators',
      severity: 'high',
      details: {
        type: 'url_check',
        message: urlCheck.reason
      }
    };
  }

  // 2. Validate file properties
  if (file) {
    const fileCheck = validateImageFile(file);
    if (!fileCheck.valid) {
      return {
        allowed: false,
        reason: fileCheck.reason,
        severity: 'low',
        details: {
          type: 'file_validation',
          message: fileCheck.reason
        }
      };
    }
  }

  // 3. Check Cloudinary moderation results
  if (cloudinaryData) {
    const moderationCheck = analyzeCloudinaryModeration(cloudinaryData);
    if (!moderationCheck.safe) {
      return {
        allowed: false,
        reason: 'Image contains inappropriate or unsafe content',
        severity: 'high',
        details: {
          type: 'ai_moderation',
          categories: moderationCheck.categories,
          confidence: moderationCheck.confidence,
          provider: moderationCheck.provider,
          message: `This image has been flagged for: ${moderationCheck.categories.join(', ')}`
        }
      };
    }
  }

  // Image is safe
  return {
    allowed: true,
    reason: 'Image passed moderation checks',
    severity: 'none',
    details: null
  };
}

/**
 * Moderate multiple images
 * @param {array} images - Array of image objects
 * @returns {Promise<object>} - { allowed, failedImages, reason }
 */
async function moderateImages(images) {
  if (!images || images.length === 0) {
    return { allowed: true, failedImages: [], reason: null };
  }

  const failedImages = [];
  
  for (let i = 0; i < images.length; i++) {
    const result = await moderateImage(images[i]);
    if (!result.allowed) {
      failedImages.push({
        index: i,
        url: images[i].url,
        reason: result.reason,
        severity: result.severity
      });
    }
  }

  if (failedImages.length > 0) {
    return {
      allowed: false,
      failedImages,
      reason: `${failedImages.length} image(s) failed moderation checks`,
      severity: 'high'
    };
  }

  return { allowed: true, failedImages: [], reason: null };
}

/**
 * Comprehensive product content moderation
 * Combines text and image moderation
 * @param {object} productData - { name, description, tags, images }
 * @returns {Promise<object>} - { allowed, reason, severity, details }
 */
async function moderateProduct(productData) {
  const { name, description, tags, images } = productData;

  // 1. Moderate text content
  const textModeration = moderateContent({ name, description, tags });
  if (!textModeration.allowed) {
    return textModeration;
  }

  // 2. Moderate images
  if (images && images.length > 0) {
    const imageModeration = await moderateImages(images);
    if (!imageModeration.allowed) {
      return {
        allowed: false,
        reason: imageModeration.reason,
        severity: imageModeration.severity,
        details: {
          type: 'image_moderation',
          failedImages: imageModeration.failedImages,
          message: 'One or more images contain inappropriate or unsafe content. Please remove or replace the flagged images.'
        }
      };
    }
  }

  // All checks passed
  return {
    allowed: true,
    reason: 'Product passed all moderation checks',
    severity: 'none',
    details: null
  };
}

module.exports = {
  checkImageUrl,
  analyzeCloudinaryModeration,
  validateImageFile,
  moderateImage,
  moderateImages,
  moderateProduct
};
