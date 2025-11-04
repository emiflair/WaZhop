import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiShoppingBag, FiSettings, FiUser, FiCreditCard, FiLogOut, FiMenu, FiX, FiBarChart2, FiGift, FiPackage, FiStar } from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'My Shops', href: '/dashboard/shops', icon: FaStore },
    { name: 'Products', href: '/dashboard/products', icon: FiShoppingBag },
    { name: 'Inventory', href: '/dashboard/inventory', icon: FiPackage },
    { name: 'Reviews', href: '/dashboard/reviews', icon: FiStar },
    { name: 'Shop Settings', href: '/dashboard/shop', icon: FiSettings },
    { name: 'Analytics', href: '/dashboard/analytics', icon: FiBarChart2 },
    { name: 'Profile', href: '/dashboard/profile', icon: FiUser },
    { name: 'Referrals', href: '/dashboard/referrals', icon: FiGift },
    { name: 'Subscription', href: '/dashboard/subscription', icon: FiCreditCard },
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
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/50 z-40 h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-1">
          <div className="w-8 h-8 bg-gray-900 dark:bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-white dark:text-gray-900 font-bold text-lg">W</span>
          </div>
          <span className="text-xl font-bold dark:text-gray-100">aZhop</span>
        </div>
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
          {/* Logo - Desktop Only */}
          <div className="hidden lg:flex items-center justify-between p-6 border-b dark:border-gray-700">
            <Link to="/" className="flex items-center space-x-1">
              <div className="w-8 h-8 bg-gray-900 dark:bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-gray-900 font-bold text-lg">W</span>
              </div>
              <span className="text-xl font-bold dark:text-gray-100">aZhop</span>
            </Link>
            <ThemeToggle />
          </div>

          {/* Mobile Sidebar Header */}
          <div className="lg:hidden p-6 border-b dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-gray-700 dark:text-gray-300 font-semibold text-lg">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold dark:text-gray-100">{user?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.plan} Plan</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 min-h-[52px] rounded-lg transition-all active:scale-95 ${
                    isActive
                      ? 'bg-primary-600 dark:bg-primary-700 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
                  }`}
                >
                  <item.icon size={22} />
                  <span className="font-medium">{item.name}</span>
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
      <main className="lg:ml-64 min-h-screen">
        <div className="pt-16 lg:pt-0 p-4 md:p-6 lg:p-8">{children}</div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg z-30">
        <div className="flex items-center justify-around">
          {navigation.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center min-w-[70px] py-2 transition-colors ${
                  isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <item.icon size={24} className="mb-1" />
                <span className="text-xs font-medium">{item.name.split(' ')[0]}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center justify-center min-w-[70px] py-2 text-gray-400"
          >
            <FiMenu size={24} className="mb-1" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;
