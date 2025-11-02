import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useSwipeGesture - Detects swipe gestures
 */
export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
}) => {
  const touchStart = useRef({ x: 0, y: 0 });
  const touchEnd = useRef({ x: 0, y: 0 });

  const onTouchStart = useCallback((e) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const onTouchMove = useCallback((e) => {
    touchEnd.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const onTouchEnd = useCallback(() => {
    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;

    // Horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    }
    // Vertical swipe
    else {
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};

/**
 * useTouchGestures - Advanced touch gesture detection
 */
export const useTouchGestures = () => {
  const [touchInfo, setTouchInfo] = useState({
    isTouching: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    duration: 0,
  });

  const startTime = useRef(0);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    startTime.current = Date.now();
    
    setTouchInfo({
      isTouching: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      duration: 0,
    });
  }, []);

  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    
    setTouchInfo((prev) => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: touch.clientX - prev.startX,
      deltaY: touch.clientY - prev.startY,
      duration: Date.now() - startTime.current,
    }));
  }, []);

  const handleTouchEnd = useCallback(() => {
    setTouchInfo((prev) => ({
      ...prev,
      isTouching: false,
      duration: Date.now() - startTime.current,
    }));
  }, []);

  return {
    touchInfo,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};

/**
 * useBottomSheet - Manage bottom sheet state
 */
export const useBottomSheet = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(null);
  const [title, setTitle] = useState('');

  const open = useCallback((newTitle, newContent) => {
    setTitle(newTitle);
    setContent(newContent);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Clear content after animation
    setTimeout(() => {
      setContent(null);
      setTitle('');
    }, 300);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    content,
    title,
    open,
    close,
    toggle,
  };
};

/**
 * useViewport - Get viewport dimensions and breakpoints
 */
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    ...viewport,
    isMobile: viewport.width < 768,
    isTablet: viewport.width >= 768 && viewport.width < 1024,
    isDesktop: viewport.width >= 1024,
    isSmallMobile: viewport.width < 480,
  };
};

/**
 * useLongPress - Detect long press gesture
 */
export const useLongPress = (callback, duration = 500) => {
  const timeout = useRef();
  const target = useRef();

  const start = useCallback((e) => {
    target.current = e.target;
    timeout.current = setTimeout(() => {
      callback(e);
    }, duration);
  }, [callback, duration]);

  const clear = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
  };
};

/**
 * useScrollLock - Lock body scroll (for modals)
 */
export const useScrollLock = (isLocked) => {
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;

    if (isLocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalStyle;
    }

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isLocked]);
};

/**
 * useSafeArea - Get safe area insets for notched devices
 */
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0'),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return safeArea;
};
