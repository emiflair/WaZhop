/**
 * Skeleton Loader Components
 * Provides various skeleton loading placeholders for different content types
 */

/**
 * Base Skeleton Component
 * Creates an animated skeleton placeholder
 */
export const Skeleton = ({ className = '', width, height }) => {
  const style = {
    ...(width && { width }),
    ...(height && { height })
  };

  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={style}
    />
  );
};

/**
 * Text Line Skeleton
 * Simulates a line of text
 */
export const SkeletonText = ({ lines = 1, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-4"
          width={index === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  );
};

/**
 * Card Skeleton
 * Simulates a card with image and text
 */
export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Image placeholder */}
      <Skeleton className="h-48 w-full rounded-none" />
      
      {/* Content placeholder */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <SkeletonText lines={2} />
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
};

/**
 * Table Row Skeleton
 * Simulates a table row
 */
export const SkeletonTableRow = ({ columns = 4, className = '' }) => {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-6 py-4">
          <Skeleton className="h-4" />
        </td>
      ))}
    </tr>
  );
};

/**
 * Table Skeleton
 * Simulates an entire table
 */
export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <Skeleton className="h-4" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, index) => (
            <SkeletonTableRow key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Product Card Skeleton
 * Specifically for product listings
 */
export const SkeletonProductCard = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Product image */}
      <Skeleton className="h-64 w-full rounded-none" />
      
      {/* Product details */}
      <div className="p-4 space-y-3">
        {/* Product name */}
        <Skeleton className="h-5 w-4/5" />
        
        {/* Price */}
        <Skeleton className="h-6 w-1/3" />
        
        {/* Description */}
        <SkeletonText lines={2} />
        
        {/* Buttons */}
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
    </div>
  );
};

/**
 * Stats Card Skeleton
 * For dashboard statistics cards
 */
export const SkeletonStatsCard = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    </div>
  );
};

/**
 * Profile Skeleton
 * For profile/user information
 */
export const SkeletonProfile = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-6">
        {/* Avatar */}
        <Skeleton className="h-20 w-20 rounded-full" />
        
        {/* User info */}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      
      {/* Additional info */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * List Item Skeleton
 * For list views
 */
export const SkeletonListItem = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm ${className}`}>
      <Skeleton className="h-16 w-16 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
};

/**
 * Form Skeleton
 * For form loading states
 */
export const SkeletonForm = ({ fields = 4, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-3 mt-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
};

/**
 * Grid Skeleton
 * For grid layouts
 */
export const SkeletonGrid = ({ 
  items = 6, 
  columns = 3, 
  ItemComponent = SkeletonCard,
  className = '' 
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-6'
  };

  return (
    <div className={`grid ${gridCols[columns] || gridCols[3]} gap-6 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <ItemComponent key={index} />
      ))}
    </div>
  );
};

/**
 * Dashboard Skeleton
 * Complete dashboard loading state
 */
export const SkeletonDashboard = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonStatsCard key={index} />
        ))}
      </div>
      
      {/* Content */}
      <SkeletonTable rows={5} columns={5} />
    </div>
  );
};

export default Skeleton;
