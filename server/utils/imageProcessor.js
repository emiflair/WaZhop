/**
 * Image Processing Utility with Background Queue
 *
 * Handles:
 * - Async image uploads to Cloudinary
 * - Retry logic for failed uploads
 * - Batch processing
 * - Concurrent upload limiting
 * - Image optimization before upload
 */

const Queue = require('bull');
const sharp = require('sharp');
const streamifier = require('streamifier');
const { cloudinary, getCompressionConfig } = require('../config/cloudinary');
const logger = require('./logger');

/**
 * Optimize image using Sharp before Cloudinary upload
 * Reduces file size and standardizes format
 */
async function optimizeImage(buffer, type = 'default') {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Log original size
    logger.debug('Original image metadata', {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      size: buffer.length
    });

    // Validate image dimensions (prevent extremely large images)
    if (metadata.width > 5000 || metadata.height > 5000) {
      throw new Error('Image dimensions too large. Maximum 5000x5000 pixels allowed.');
    }

    // Different optimization strategies based on type
    let optimized = image;

    if (type === 'product') {
      // Product images: maintain quality but compress
      optimized = image
        .resize(1200, 1200, {
          fit: 'inside', // Maintain aspect ratio
          withoutEnlargement: true // Don't upscale smaller images
        })
        .jpeg({
          quality: 85,
          progressive: true,
          mozjpeg: true // Use mozjpeg for better compression
        });
    } else if (type === 'thumbnail') {
      // Thumbnails: aggressive compression
      optimized = image
        .resize(400, 400, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 70,
          progressive: true,
          mozjpeg: true
        });
    } else if (type === 'branding') {
      // Logos/banners: maintain quality
      optimized = image
        .resize(1000, 1000, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: 90,
          progressive: true
        });
    } else {
      // Default: balanced compression
      optimized = image
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: 80,
          progressive: true,
          mozjpeg: true
        });
    }

    const optimizedBuffer = await optimized.toBuffer();

    // Log compression results
    const compressionRatio = ((1 - (optimizedBuffer.length / buffer.length)) * 100).toFixed(2);
    logger.debug('Image optimized', {
      originalSize: buffer.length,
      optimizedSize: optimizedBuffer.length,
      compressionRatio: `${compressionRatio}%`,
      type
    });

    return optimizedBuffer;
  } catch (error) {
    logger.error('Image optimization failed', { error: error.message });
    // Fall back to original buffer if optimization fails
    return buffer;
  }
}

/**
 * Upload buffer to Cloudinary with timeout protection
 */
function uploadToCloudinary(buffer, folder, type = 'default') {
  return new Promise((resolve, reject) => {
    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error('Cloudinary upload timeout (60s exceeded)'));
    }, 60000);

    const compressionConfig = getCompressionConfig(type);

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        ...compressionConfig
      },
      (error, result) => {
        clearTimeout(timeout);
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// Create Bull queue for image processing
// Use Redis connection from environment
const imageQueue = new Queue('image-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true
  },
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000 // Start with 2s delay, then 4s, 8s
    },
    removeOnComplete: true, // Clean up completed jobs
    removeOnFail: false, // Keep failed jobs for debugging
    timeout: 60000 // 60s timeout per job
  }
});

// Concurrent processing limit (prevents overwhelming Cloudinary API)
const CONCURRENT_UPLOADS = 3;
imageQueue.process(CONCURRENT_UPLOADS, async (job) => {
  const {
    buffer, folder, type, userId
  } = job.data;

  try {
    // Optimize image before upload
    const optimizedBuffer = await optimizeImage(buffer, type);

    // Upload to Cloudinary
    const result = await uploadToCloudinary(optimizedBuffer, folder, type);

    logger.info('Image uploaded successfully', {
      userId,
      folder,
      type,
      publicId: result.public_id,
      size: result.bytes,
      format: result.format
    });

    return result;
  } catch (error) {
    logger.error('Image upload failed', {
      userId,
      folder,
      type,
      error: error.message,
      attempt: job.attemptsMade
    });
    throw error; // Will trigger retry
  }
});

/**
 * Queue image upload (non-blocking)
 * Returns job ID for tracking
 */
async function queueImageUpload(buffer, folder, type, userId) {
  try {
    const job = await imageQueue.add(
      {
        buffer,
        folder,
        type,
        userId
      },
      {
        priority: type === 'product' ? 1 : 2 // Products have higher priority
      }
    );

    logger.info('Image queued for processing', {
      jobId: job.id,
      userId,
      folder,
      type
    });

    return job.id;
  } catch (error) {
    logger.error('Failed to queue image', {
      userId,
      folder,
      type,
      error: error.message
    });
    throw error;
  }
}

/**
 * Upload image synchronously (blocking)
 * Use for critical uploads that need immediate confirmation
 */
async function uploadImageSync(buffer, folder, type = 'default') {
  try {
    const optimizedBuffer = await optimizeImage(buffer, type);
    const result = await uploadToCloudinary(optimizedBuffer, folder, type);

    logger.info('Synchronous image upload successful', {
      folder,
      type,
      publicId: result.public_id,
      size: result.bytes
    });

    return result;
  } catch (error) {
    logger.error('Synchronous image upload failed', {
      folder,
      type,
      error: error.message
    });
    throw error;
  }
}

/**
 * Batch upload multiple images
 * Uses queue for parallel processing with concurrency limit
 */
async function uploadImageBatch(files, folder, type, userId) {
  const jobs = [];

  for (const file of files) {
    try {
      const jobId = await queueImageUpload(file.buffer, folder, type, userId);
      jobs.push(jobId);
    } catch (error) {
      logger.error('Failed to queue file in batch', {
        userId,
        fileName: file.originalname,
        error: error.message
      });
    }
  }

  return jobs;
}

/**
 * Get job status
 */
async function getJobStatus(jobId) {
  try {
    const job = await imageQueue.getJob(jobId);

    if (!job) {
      return { status: 'not_found' };
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      status: state,
      progress,
      attempts: job.attemptsMade,
      failedReason: job.failedReason,
      result: await job.finished().catch(() => null)
    };
  } catch (error) {
    logger.error('Failed to get job status', { jobId, error: error.message });
    return { status: 'error', error: error.message };
  }
}

/**
 * Delete image from Cloudinary with retry
 */
async function deleteImageFromCloudinary(publicId, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);

      logger.info('Image deleted from Cloudinary', {
        publicId,
        result: result.result
      });

      return result;
    } catch (error) {
      logger.error('Failed to delete image from Cloudinary', {
        publicId,
        attempt,
        error: error.message
      });

      if (attempt === retries) {
        throw error;
      }

      // Wait before retry
      await new Promise((resolve) => { setTimeout(resolve, 2000 * attempt); });
    }
  }
}

/**
 * Get queue stats
 */
async function getQueueStats() {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      imageQueue.getWaitingCount(),
      imageQueue.getActiveCount(),
      imageQueue.getCompletedCount(),
      imageQueue.getFailedCount(),
      imageQueue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + delayed
    };
  } catch (error) {
    logger.error('Failed to get queue stats', { error: error.message });
    return null;
  }
}

/**
 * Clean old jobs (run periodically)
 */
async function cleanOldJobs() {
  try {
    // Remove completed jobs older than 1 hour
    await imageQueue.clean(3600000, 'completed');

    // Remove failed jobs older than 24 hours
    await imageQueue.clean(86400000, 'failed');

    logger.info('Old jobs cleaned successfully');
  } catch (error) {
    logger.error('Failed to clean old jobs', { error: error.message });
  }
}

// Queue event handlers for monitoring
imageQueue.on('completed', (job, result) => {
  logger.debug('Job completed', {
    jobId: job.id,
    duration: Date.now() - job.timestamp
  });
});

imageQueue.on('failed', (job, err) => {
  logger.error('Job failed', {
    jobId: job.id,
    attempts: job.attemptsMade,
    error: err.message
  });
});

imageQueue.on('stalled', (job) => {
  logger.warn('Job stalled', {
    jobId: job.id,
    attempts: job.attemptsMade
  });
});

// Clean old jobs every hour
setInterval(cleanOldJobs, 3600000);

module.exports = {
  queueImageUpload,
  uploadImageSync,
  uploadImageBatch,
  getJobStatus,
  deleteImageFromCloudinary,
  getQueueStats,
  optimizeImage
};
