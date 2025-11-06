import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  TouchButton,
  MobileFormField,
  BottomSheet,
  SwipeableCard,
  MobileTable,
  CollapsibleSection,
  MobileFilters,
  PullToRefresh,
} from '../components/mobile';
import {
  useSwipeGesture,
  useBottomSheet,
  useViewport,
  useLongPress,
} from '../components/mobile/useMobileHooks';
import { FiShoppingBag, FiHeart, FiSettings, FiUser, FiTrash2, FiEdit } from 'react-icons/fi';
import { showSuccess } from '../utils/errorHandler';

const MobileResponsiveDemo = () => {
  const viewport = useViewport();
  const { isOpen, content, title, open, close } = useBottomSheet();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [items, setItems] = useState([
    { id: 1, name: 'Product 1', price: '$25', stock: 'In Stock' },
    { id: 2, name: 'Product 2', price: '$35', stock: 'Low Stock' },
    { id: 3, name: 'Product 3', price: '$45', stock: 'Out of Stock' },
  ]);
  const [filters, setFilters] = useState({});

  // Swipe gesture demo
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => showSuccess('Swiped left!'),
    onSwipeRight: () => showSuccess('Swiped right!'),
    onSwipeUp: () => showSuccess('Swiped up!'),
    onSwipeDown: () => showSuccess('Swiped down!'),
    threshold: 100,
  });

  // Long press demo
  const longPressHandlers = useLongPress(() => {
    showSuccess('Long press detected!');
  }, 800);

  // Pull to refresh demo
  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    showSuccess('Refreshed!');
  };

  // Filter demo
  const filterOptions = [
    {
      key: 'category',
      label: 'Category',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Electronics', value: 'electronics' },
        { label: 'Clothing', value: 'clothing' },
        { label: 'Food', value: 'food' },
      ],
    },
    {
      key: 'price',
      label: 'Price Range',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Under $50', value: 'under-50' },
        { label: '$50-$100', value: '50-100' },
        { label: 'Over $100', value: 'over-100' },
      ],
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-24 lg:pb-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Mobile Responsiveness Demo
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive examples of mobile-optimized components and interactions
          </p>
          
          {/* Viewport Info */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium">
              <strong>Current Viewport:</strong> {viewport.width}px × {viewport.height}px
            </p>
            <p className="text-sm">
              <strong>Device:</strong>{' '}
              {viewport.isSmallMobile && 'Small Mobile'}
              {viewport.isMobile && !viewport.isSmallMobile && 'Mobile'}
              {viewport.isTablet && 'Tablet'}
              {viewport.isDesktop && 'Desktop'}
            </p>
          </div>
        </div>

        {/* Touch Buttons */}
        <section>
          <h2 className="text-xl font-bold mb-4">Touch Buttons</h2>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <TouchButton variant="primary" size="md">
                Primary Button
              </TouchButton>
              <TouchButton variant="secondary" size="md">
                Secondary
              </TouchButton>
              <TouchButton variant="outline" size="md">
                Outline
              </TouchButton>
              <TouchButton variant="danger" size="md">
                Danger
              </TouchButton>
              <TouchButton variant="success" size="md">
                Success
              </TouchButton>
            </div>

            <div className="flex flex-wrap gap-3">
              <TouchButton variant="primary" size="sm">
                Small (44px min)
              </TouchButton>
              <TouchButton variant="primary" size="md">
                Medium (48px min)
              </TouchButton>
              <TouchButton variant="primary" size="lg">
                Large (52px min)
              </TouchButton>
            </div>

            <TouchButton variant="primary" loading className="w-full md:w-auto">
              Loading State
            </TouchButton>
          </div>
        </section>

        {/* Mobile Form Fields */}
        <section>
          <h2 className="text-xl font-bold mb-4">Mobile-Optimized Forms</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <MobileFormField
              label="Full Name"
              icon={FiUser}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your name"
            />
            <MobileFormField
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              helpText="We'll never share your email"
            />
            <MobileFormField
              label="Phone Number"
              type="tel"
              icon={FiSettings}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              error={formData.phone && formData.phone.length < 10 ? 'Phone number is too short' : ''}
            />
          </div>
        </section>

        {/* Swipeable Cards */}
        <section>
          <h2 className="text-xl font-bold mb-4">Swipeable Cards</h2>
          <p className="text-sm text-gray-600 mb-4">
            Swipe left to reveal actions (Mobile only)
          </p>
          <div className="space-y-3">
            {items.map((item) => (
              <SwipeableCard
                key={item.id}
                onEdit={() => showSuccess(`Editing ${item.name}`)}
                onDelete={() => {
                  setItems(items.filter((i) => i.id !== item.id));
                  showSuccess(`Deleted ${item.name}`);
                }}
              >
                <div className="p-4 border rounded-lg bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.price}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        item.stock === 'In Stock'
                          ? 'bg-primary-100 text-primary-700'
                          : item.stock === 'Low Stock'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.stock}
                    </span>
                  </div>
                </div>
              </SwipeableCard>
            ))}
          </div>
        </section>

        {/* Bottom Sheet */}
        <section>
          <h2 className="text-xl font-bold mb-4">Bottom Sheet Modal</h2>
          <div className="flex flex-wrap gap-3">
            <TouchButton
              variant="primary"
              onClick={() =>
                open(
                  'Select Options',
                  <div className="space-y-3">
                    <button className="w-full min-h-[52px] p-4 text-left hover:bg-gray-100 rounded-lg transition">
                      Option 1
                    </button>
                    <button className="w-full min-h-[52px] p-4 text-left hover:bg-gray-100 rounded-lg transition">
                      Option 2
                    </button>
                    <button className="w-full min-h-[52px] p-4 text-left hover:bg-gray-100 rounded-lg transition">
                      Option 3
                    </button>
                  </div>
                )
              }
            >
              Open Bottom Sheet
            </TouchButton>
            <TouchButton
              variant="secondary"
              onClick={() =>
                open(
                  'Filter Products',
                  <MobileFilters
                    filters={filterOptions}
                    activeFilters={filters}
                    onFilterChange={(key, value) =>
                      setFilters({ ...filters, [key]: value })
                    }
                    onClear={() => setFilters({})}
                  />
                )
              }
            >
              Open Filters
            </TouchButton>
          </div>

          <BottomSheet isOpen={isOpen} onClose={close} title={title}>
            {content}
          </BottomSheet>
        </section>

        {/* Mobile Table */}
        <section>
          <h2 className="text-xl font-bold mb-4">Responsive Table</h2>
          <p className="text-sm text-gray-600 mb-4">
            Table view on desktop, card view on mobile
          </p>
          <MobileTable
            headers={['Product', 'Price', 'Stock', 'Actions']}
            data={items}
            keyExtractor={(item) => item.id}
            renderRow={(item, index, isMobile) =>
              isMobile ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.name}</span>
                    <span className="font-semibold">{item.price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        item.stock === 'In Stock'
                          ? 'bg-primary-100 text-primary-700'
                          : item.stock === 'Low Stock'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.stock}
                    </span>
                    <div className="flex gap-2">
                      <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg">
                        <FiEdit />
                      </button>
                      <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg">
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <tr key={item.id}>
                  <td className="px-6 py-4">{item.name}</td>
                  <td className="px-6 py-4">{item.price}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        item.stock === 'In Stock'
                          ? 'bg-primary-100 text-primary-700'
                          : item.stock === 'Low Stock'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <FiEdit />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            }
          />
        </section>

        {/* Collapsible Sections */}
        <section>
          <h2 className="text-xl font-bold mb-4">Collapsible Sections</h2>
          <div className="space-y-3">
            <CollapsibleSection title="Account Settings" icon={FiUser} defaultOpen>
              <div className="space-y-3">
                <p className="text-gray-700">Update your account settings here.</p>
                <TouchButton variant="primary" size="sm">
                  Save Changes
                </TouchButton>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Product Categories" icon={FiShoppingBag}>
              <div className="space-y-2">
                <p className="text-gray-700">Browse product categories:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Electronics</li>
                  <li>Clothing</li>
                  <li>Food & Beverage</li>
                  <li>Home & Garden</li>
                </ul>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Favorites" icon={FiHeart}>
              <p className="text-gray-700">You have 12 favorite items.</p>
            </CollapsibleSection>
          </div>
        </section>

        {/* Gesture Detection */}
        <section>
          <h2 className="text-xl font-bold mb-4">Touch Gestures</h2>
          
          {/* Swipe Detection */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Swipe Detection Area:</p>
            <div
              {...swipeHandlers}
              className="h-48 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg"
            >
              Swipe in any direction!
            </div>
          </div>

          {/* Long Press */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Long Press Detection:</p>
            <div
              {...longPressHandlers}
              className="h-32 bg-gradient-to-r from-primary-400 to-accent-400 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg cursor-pointer"
            >
              Press and hold for 800ms
            </div>
          </div>
        </section>

        {/* Pull to Refresh */}
        <section>
          <h2 className="text-xl font-bold mb-4">Pull to Refresh</h2>
          <p className="text-sm text-gray-600 mb-2">
            Pull down to refresh (Mobile only)
          </p>
          <div className="h-64 overflow-hidden rounded-lg border">
            <PullToRefresh onRefresh={handleRefresh}>
              <div className="p-6 space-y-4">
                <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
              </div>
            </PullToRefresh>
          </div>
        </section>

        {/* Mobile Best Practices */}
        <section className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Mobile Best Practices</h2>
          <ul className="space-y-2 text-gray-700">
            <li>✅ Minimum touch target size: 44x44px (iOS) or 48x48px (Android)</li>
            <li>✅ Adequate spacing between interactive elements (8px minimum)</li>
            <li>✅ Floating labels for better form UX</li>
            <li>✅ Bottom sheets for mobile modals</li>
            <li>✅ Swipe gestures for common actions</li>
            <li>✅ Bottom navigation for main actions (4-5 items)</li>
            <li>✅ Collapsible sections to save space</li>
            <li>✅ Responsive tables convert to cards</li>
            <li>✅ Pull-to-refresh for content updates</li>
            <li>✅ Visual feedback on touch (active states)</li>
          </ul>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default MobileResponsiveDemo;
