import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * OptimizedImage Component
 * Features:
 * - Lazy loading with Intersection Observer
 * - WebP/AVIF format support with fallback
 * - Responsive images with srcset
 * - Blur placeholder effect
 * - Loading states
 * - Error handling with fallback
 */

const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  sizes,
  priority = false,
  objectFit = 'cover',
  onLoad,
  onError,
  fallbackSrc = '/placeholder-image.svg',
  quality = 80,
  blurDataURL,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(priority ? src : blurDataURL || '');
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before element comes into view
        threshold: 0.01,
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  // Load image when in view
  useEffect(() => {
    if (!isInView || !src) return;

    setCurrentSrc(src);
  }, [isInView, src]);

  // Generate Cloudinary transformations for optimized images
  const getOptimizedSrc = (url, transformations = {}) => {
    if (!url || !url.includes('cloudinary.com')) {
      return url;
    }

    const {
      width: w,
      height: h,
      quality: q = quality,
      format = 'auto',
    } = transformations;

    // Parse Cloudinary URL
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;

    // Build transformation string
    const transforms = [];
    if (w) transforms.push(`w_${w}`);
    if (h) transforms.push(`h_${h}`);
    transforms.push(`q_${q}`);
    transforms.push(`f_${format}`);
    transforms.push('fl_progressive');
    transforms.push('fl_lossy');

    return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
  };

  // Generate srcset for responsive images
  const generateSrcSet = () => {
    if (!src || !src.includes('cloudinary.com')) {
      return undefined;
    }

    const widths = [320, 640, 768, 1024, 1280, 1536];
    return widths
      .map((w) => `${getOptimizedSrc(src, { width: w })} ${w}w`)
      .join(', ');
  };

  const handleLoad = (e) => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(e);
  };

  const handleError = (e) => {
    console.error('Image failed to load:', src);
    setHasError(true);
    setCurrentSrc(fallbackSrc);
    onError?.(e);
  };

  // Get image dimensions with aspect ratio
  const getImageStyle = () => {
    const style = {
      objectFit,
      transition: 'opacity 0.3s ease-in-out',
      opacity: isLoaded ? 1 : 0,
    };

    if (width && height) {
      style.aspectRatio = `${width} / ${height}`;
    }

    return style;
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width || '100%',
        height: height || 'auto',
      }}
    >
      {/* Blur placeholder */}
      {blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full blur-sm"
          style={{ objectFit }}
        />
      )}

      {/* Loading skeleton */}
      {!isLoaded && !blurDataURL && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}

      {/* Main image */}
      {isInView && (
        <picture>
          {/* WebP source for Cloudinary images */}
          {src && src.includes('cloudinary.com') && (
            <>
              <source
                type="image/avif"
                srcSet={generateSrcSet()}
                sizes={sizes}
              />
              <source
                type="image/webp"
                srcSet={generateSrcSet()}
                sizes={sizes}
              />
            </>
          )}

          <img
            src={currentSrc || fallbackSrc}
            alt={alt}
            width={width}
            height={height}
            srcSet={generateSrcSet()}
            sizes={sizes}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            onLoad={handleLoad}
            onError={handleError}
            style={getImageStyle()}
            className="w-full h-full"
            {...props}
          />
        </picture>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  sizes: PropTypes.string,
  priority: PropTypes.bool,
  objectFit: PropTypes.oneOf(['contain', 'cover', 'fill', 'none', 'scale-down']),
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  fallbackSrc: PropTypes.string,
  quality: PropTypes.number,
  blurDataURL: PropTypes.string,
};

export default OptimizedImage;
