import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiShoppingBag, FiSettings, FiUser, FiCreditCard, FiLogOut, FiMenu, FiX, FiBarChart2, FiGift, FiPackage, FiStar } from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [safeAreaTop, setSafeAreaTop] = useState(0);

  // Measure actual safe area on mount
  useEffect(() => {
    const measureSafeArea = () => {
      // Try multiple methods to get safe area
      const testDiv = document.createElement('div');
      testDiv.style.cssText = 'position: fixed; top: env(safe-area-inset-top, 0px); left: 0; width: 1px; height: 1px; pointer-events: none;';
      document.body.appendChild(testDiv);
      const rect = testDiv.getBoundingClientRect();
      document.body.removeChild(testDiv);
      
      const detectedTop = rect.top;
      // Default to 50px for devices with notches if detection fails
      setSafeAreaTop(detectedTop > 0 ? detectedTop : 50);
      console.log('📱 Safe area detected:', detectedTop > 0 ? detectedTop : 50, 'px');
    };
    
    // Delay to ensure DOM is ready
    setTimeout(measureSafeArea, 100);
    window.addEventListener('resize', measureSafeArea);
    return () => window.removeEventListener('resize', measureSafeArea);
  }, []);

  const navigation = [
    { name: 'Marketplace', href: '/', icon: FiShoppingBag, external: true },
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'My Shops', href: '/dashboard/shops', icon: FaStore },
    { name: 'Earnings', href: '/dashboard/referrals', icon: FiGift },
    { name: 'Products', href: '/dashboard/products', icon: FiShoppingBag },
    { name: 'Subscription', href: '/dashboard/subscription', icon: FiCreditCard },
    { name: 'Inventory', href: '/dashboard/inventory', icon: FiPackage },
    { name: 'Reviews', href: '/dashboard/reviews', icon: FiStar },
    { name: 'Shop Settings', href: '/dashboard/shop', icon: FiSettings },
    { name: 'Analytics', href: '/dashboard/analytics', icon: FiBarChart2 },
    { name: 'Profile', href: '/dashboard/profile', icon: FiUser },
  ];

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Handle body scroll lock
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Status bar background - fills the notch area */}
      <div 
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800"
        style={{ height: `${safeAreaTop}px` }}
      />
      
      {/* Mobile header below status bar */}
      <div 
        className="lg:hidden fixed left-0 right-0 z-40 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/50 border-b border-gray-100 dark:border-gray-700"
        style={{ top: `${safeAreaTop}px` }}
      >
        <div className="h-14 flex items-center justify-between px-4">
          <Link to="/" className="flex-shrink-0 text-lg font-semibold text-gray-900 dark:text-gray-100" aria-label="Go to marketplace">
            WaZhop
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:bg-gray-200 dark:active:bg-gray-600 transition"
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
              {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-gray-100 dark:border-gray-700 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Safe area spacer for mobile */}
          <div 
            className="lg:hidden bg-white dark:bg-gray-800"
            style={{ height: `${safeAreaTop}px` }}
          />
          
          {/* Logo - Desktop Only */}
          <div className="hidden lg:flex items-center justify-between p-6 border-b dark:border-gray-700">
            <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">WaZhop</span>
            <ThemeToggle />
          </div>

          {/* Mobile Sidebar Header */}
          <div className="lg:hidden p-4 border-b dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-gray-700 dark:text-gray-300 font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-sm dark:text-gray-100">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.plan} Plan</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = !item.external && location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg transition-all active:scale-95 ${
                    isActive
                      ? 'bg-primary-600 dark:bg-primary-700 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User & Logout - Desktop Only */}
          <div className="hidden lg:block p-4 border-t dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-3 px-2">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-gray-700 dark:text-gray-300 font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate dark:text-gray-100">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.plan} Plan</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 min-h-[48px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 rounded-lg transition font-medium"
            >
              <FiLogOut size={20} />
              <span>Logout</span>
            </button>
          </div>

          {/* Logout - Mobile Only */}
          <div className="lg:hidden p-4 border-t dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 min-h-[52px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 rounded-lg transition font-medium"
            >
              <FiLogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main 
        className="lg:ml-64 min-h-screen lg:pt-6 pb-20 lg:pb-6"
        style={{ paddingTop: window.innerWidth < 1024 ? `${safeAreaTop + 56}px` : '1.5rem' }}
      >
        <div className="px-4 md:px-8 xl:px-12">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 z-30 safe-bottom safe-left safe-right">
        <div className="grid grid-cols-5 gap-0 px-2 py-3">
          {navigation.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center gap-1.5 transition-colors ${
                  isActive ? 'text-primary-600 dark:text-primary-500' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <item.icon size={24} strokeWidth={2} />
                <span className="text-[10px] font-medium">{item.name.split(' ')[0]}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center justify-center gap-1.5 text-gray-400 dark:text-gray-500 transition-colors"
          >
            <FiMenu size={24} strokeWidth={2} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;
