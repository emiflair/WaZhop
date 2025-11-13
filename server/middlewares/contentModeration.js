const { moderateProduct } = require('../utils/imageModeration');

/**
 * Content Moderation Middleware
 * Validates product content before creation or update
 */

/**
 * Moderate product content
 * Checks text (name, description, tags) and images for harmful content
 */
const moderateProductContent = async (req, res, next) => {
  try {
    const { name, description, tags } = req.body;

    // Get images from request (could be from body or files)
    let images = [];

    // If images are being uploaded in this request
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => ({
        url: file.path,
        file: {
          size: file.size,
          mimetype: file.mimetype
        }
      }));
    }

    // If images are provided as URLs in body
    if (req.body.images && Array.isArray(req.body.images)) {
      images = req.body.images.map((img) => ({
        url: typeof img === 'string' ? img : img.url,
        publicId: typeof img === 'object' ? img.publicId : null
      }));
    }

    // Perform moderation check
    const moderationResult = await moderateProduct({
      name,
      description,
      tags: tags || [],
      images
    });

    // If content is not allowed, reject the request
    if (!moderationResult.allowed) {
      return res.status(400).json({
        success: false,
        message: moderationResult.reason,
        error: 'CONTENT_MODERATION_FAILED',
        details: moderationResult.details,
        severity: moderationResult.severity
      });
    }

    // Attach moderation result to request for logging
    req.moderationPassed = true;
    req.moderationDetails = moderationResult;

    next();
  } catch (error) {
    console.error('Content moderation error:', error);
    // In case of moderation service failure, allow content but log the error
    // You can change this to reject if you want strict moderation
    req.moderationPassed = false;
    req.moderationError = error.message;
    next();
  }
};

/**
 * Lightweight text-only moderation
 * For shop names, shop descriptions, reviews, etc.
 */
const moderateText = async (req, res, next) => {
  try {
    const { moderateContent } = require('../utils/contentModeration');

    // Collect text fields from body
    const textFields = {
      name: req.body.name || req.body.shopName || '',
      description: req.body.description || req.body.comment || '',
      tags: req.body.tags || []
    };

    const result = moderateContent(textFields);

    if (!result.allowed) {
      return res.status(400).json({
        success: false,
        message: result.reason,
        error: 'CONTENT_MODERATION_FAILED',
        details: result.details
      });
    }

    req.moderationPassed = true;
    next();
  } catch (error) {
    console.error('Text moderation error:', error);
    req.moderationPassed = false;
    next();
  }
};

/**
 * Admin override middleware
 * Allows admins to bypass moderation for legitimate content that was flagged
 */
const adminModerationOverride = (req, res, next) => {
  // Check if user is admin and override flag is set
  if (req.user && req.user.role === 'admin' && req.body.moderationOverride === true) {
    req.moderationPassed = true;
    req.moderationOverridden = true;
    return next();
  }
  next();
};

module.exports = {
  moderateProductContent,
  moderateText,
  adminModerationOverride
};
