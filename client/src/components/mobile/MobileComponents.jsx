import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiX, FiCheck } from 'react-icons/fi';

/**
 * TouchButton - Button optimized for touch interactions
 * Min 44x44px touch target with visual feedback
 */
export const TouchButton = ({ 
  children, 
  className = '', 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'min-h-[44px] px-4 py-2 text-sm',
    md: 'min-h-[48px] px-6 py-3 text-base',
    lg: 'min-h-[52px] px-8 py-4 text-lg',
  };

  const variantClasses = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-900',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-200',
    outline: 'border-2 border-gray-900 text-gray-900 hover:bg-gray-50 active:bg-white',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-600',
    success: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-600',
    accent: 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-600',
    purple: 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-600',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : children}
    </button>
  );
};

/**
 * MobileFormField - Form input optimized for mobile
 * Larger touch targets, better spacing, floating labels
 */
export const MobileFormField = ({ 
  label, 
  error, 
  type = 'text',
  icon: Icon,
  helpText,
  className = '',
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = props.value && props.value.length > 0;

  return (
    <div className={`mb-6 ${className}`}>
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={20} />
          </div>
        )}
        <input
          type={type}
          className={`w-full min-h-[52px] px-4 ${Icon ? 'pl-12' : ''} py-3 text-base border-2 rounded-lg transition-all
            ${error ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-gray-900'}
            focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-200' : 'focus:ring-gray-200'}
            placeholder:text-gray-400
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {label && (
          <label
            className={`absolute left-4 ${Icon ? 'left-12' : ''} transition-all pointer-events-none
              ${isFocused || hasValue 
                ? '-top-2.5 text-xs bg-white px-1 font-medium' 
                : 'top-1/2 -translate-y-1/2 text-base'
              }
              ${error ? 'text-red-500' : isFocused ? 'text-gray-900' : 'text-gray-500'}
            `}
          >
            {label}
          </label>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠</span> {error}
        </p>
      )}
      {helpText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

/**
 * BottomSheet - Mobile bottom sheet modal
 */
export const BottomSheet = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  height = 'auto'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 shadow-2xl transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          ${height === 'full' ? 'h-[90vh]' : height === 'half' ? 'h-[50vh]' : 'max-h-[80vh]'}
        `}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button 
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 active:bg-gray-200"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(100% - 80px)' }}>
          {children}
        </div>
      </div>
    </>
  );
};

/**
 * SwipeableCard - Card with swipe-to-reveal actions
 */
export const SwipeableCard = ({ 
  children, 
  onDelete, 
  onEdit,
  className = '' 
}) => {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Only allow left swipe (negative offset)
    if (diff < 0) {
      setOffset(Math.max(diff, -150));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Snap to action or reset
    if (offset < -75) {
      setOffset(-150);
    } else {
      setOffset(0);
    }
  };

  const handleDelete = () => {
    setOffset(0);
    onDelete?.();
  };

  const handleEdit = () => {
    setOffset(0);
    onEdit?.();
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Actions (revealed on swipe) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
        {onEdit && (
          <button
            onClick={handleEdit}
            className="min-w-[75px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center font-medium"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="min-w-[75px] bg-red-600 hover:bg-red-700 active:bg-red-800 text-white flex items-center justify-center font-medium"
          >
            Delete
          </button>
        )}
      </div>

      {/* Card content */}
      <div
        className={`relative bg-white transition-transform touch-pan-y ${className}`}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * MobileTable - Responsive table that converts to cards on mobile
 */
export const MobileTable = ({ 
  headers, 
  data, 
  renderRow,
  keyExtractor 
}) => {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => renderRow(item, index))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((item, index) => (
          <div key={keyExtractor(item, index)} className="bg-white rounded-lg shadow p-4">
            {renderRow(item, index, true)}
          </div>
        ))}
      </div>
    </>
  );
};

/**
 * CollapsibleSection - Accordion section for mobile
 */
export const CollapsibleSection = ({ 
  title, 
  children, 
  defaultOpen = false,
  icon: Icon 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[56px] px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 active:bg-gray-100 transition"
      >
        <div className="flex items-center space-x-3">
          {Icon && <Icon size={20} className="text-gray-500" />}
          <span className="font-medium text-left">{title}</span>
        </div>
        <FiChevronDown 
          size={20} 
          className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 bg-gray-50 border-t">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * MobileFilters - Filter panel optimized for mobile
 */
export const MobileFilters = ({ 
  filters, 
  activeFilters, 
  onFilterChange,
  onClear 
}) => {
  return (
    <div className="space-y-4">
      {filters.map((filter) => (
        <div key={filter.key} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {filter.label}
          </label>
          <div className="flex flex-wrap gap-2">
            {filter.options.map((option) => {
              const isActive = activeFilters[filter.key] === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onFilterChange(filter.key, option.value)}
                  className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                    }
                  `}
                >
                  {option.label}
                  {isActive && <FiCheck size={16} className="inline ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      
      {Object.keys(activeFilters).length > 0 && (
        <button
          onClick={onClear}
          className="w-full min-h-[48px] px-4 py-2 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg font-medium transition"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
};

/**
 * PullToRefresh - Pull to refresh component
 */
export const PullToRefresh = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef(null);

  const handleTouchStart = (e) => {
    if (containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (containerRef.current.scrollTop === 0 && !refreshing) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;
      
      if (distance > 0) {
        setPullDistance(Math.min(distance, 100));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !refreshing) {
      setRefreshing(true);
      setPullDistance(60);
      
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Pull indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all"
        style={{ 
          height: `${pullDistance}px`,
          opacity: pullDistance / 100 
        }}
      >
        <div className={`${refreshing ? 'animate-spin' : ''}`}>
          {refreshing ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <span className="text-2xl">↓</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className="overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
};
