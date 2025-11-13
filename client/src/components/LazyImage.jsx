import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { optimizeImageUrl } from '../utils/image';

const LazyImage = ({ 
  src, 
  alt, 
  placeholder = '/placeholder.svg',
  className = '',
  width,
  height,
  sizes,
  optimize = true,
  transform, // { w, h, fit }
  fetchPriority,
  onLoad,
  onError
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    let observer;
    let didCancel = false;
    const currentImg = imgRef.current;

    if (currentImg && src) {
      // Use Intersection Observer for lazy loading
      if (IntersectionObserver) {
        observer = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              if (
                !didCancel &&
                (entry.intersectionRatio > 0 || entry.isIntersecting)
              ) {
                const finalSrc = optimize ? optimizeImageUrl(src, transform || { w: width, h: height }) : src;
                setImageSrc(finalSrc);
                observer.unobserve(currentImg);
              }
            });
          },
          {
            threshold: 0.01,
            rootMargin: '75px',
          }
        );
        observer.observe(currentImg);
      } else {
        // Fallback for browsers without Intersection Observer
        const finalSrc = optimize ? optimizeImageUrl(src, transform || { w: width, h: height }) : src;
        setImageSrc(finalSrc);
      }
    }

    return () => {
      didCancel = true;
      if (observer && observer.unobserve && currentImg) {
        observer.unobserve(currentImg);
      }
    };
  }, [src]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setIsError(true);
    setImageSrc(placeholder); // Fall back to placeholder on error
    if (onError) onError(e);
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${!isLoaded && !isError ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`}
      width={width}
      height={height}
      sizes={sizes}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      decoding="async"
      fetchPriority={fetchPriority}
    />
  );
};

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sizes: PropTypes.string,
  optimize: PropTypes.bool,
  transform: PropTypes.object,
  fetchPriority: PropTypes.oneOf(['high', 'low', 'auto']),
  onLoad: PropTypes.func,
  onError: PropTypes.func,
};

export default LazyImage;
