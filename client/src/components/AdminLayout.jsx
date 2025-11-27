import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiShoppingBag, FiDollarSign, FiSettings, FiMenu, FiX, FiBarChart2, FiTag, FiPackage, FiLogOut, FiLogIn } from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import logoWhite from '/wazhoplogo/Logowhite.PNG.png';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(64);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const navigation = [
    { name: 'Overview', href: '/admin', icon: FiHome },
    { name: 'Users', href: '/admin/users', icon: FiUsers },
    { name: 'Coupons', href: '/admin/coupons', icon: FiTag },
    { name: 'Shops', href: '/admin/shops', icon: FaStore },
    { name: 'Products', href: '/admin/products', icon: FiShoppingBag },
    { name: 'Orders', href: '/admin/orders', icon: FiPackage },
    { name: 'Create Store', href: '/admin/create-store', icon: FaStore },
    { name: 'Analytics', href: '/admin/analytics', icon: FiBarChart2 },
    { name: 'Revenue', href: '/admin/revenue', icon: FiDollarSign },
    { name: 'Settings', href: '/admin/settings', icon: FiSettings },
  ];

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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

  useEffect(() => {
    const update = () => {
      if (headerRef.current) {
        const h = Math.ceil(headerRef.current.getBoundingClientRect().height);
        setHeaderHeight(h || 64);
      }
    };
    update();
    const id = setInterval(update, 250);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      clearInterval(id);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile header */}
      <div ref={headerRef} className="lg:hidden fixed top-0 left-0 right-0 bg-red-600 dark:bg-red-700 shadow-sm z-40 min-h-[56px] flex items-center justify-between px-4 border-b border-red-700 dark:border-red-800 safe-top safe-left safe-right">
        <div className="flex-shrink-0 flex items-center -ml-14">
          <img src={logoWhite} alt="WaZhop Admin" className="h-20 w-auto object-contain" decoding="async" loading="eager" />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:bg-red-700 dark:hover:bg-red-800 rounded-lg transition"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200 dark:border-gray-700 bg-red-600 dark:bg-red-700">
            <div className="flex-shrink-0 flex items-center -ml-14">
              <img src={logoWhite} alt="WaZhop Admin" className="h-20 w-auto object-contain" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`text-lg ${isActive ? 'text-red-600 dark:text-red-400' : ''}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Admin Badge */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-red-600 dark:bg-red-700 flex items-center justify-center text-white font-semibold">
                    {user.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                      {user.isAdmin ? 'ADMIN' : 'NOT ADMIN'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg transition-colors"
                >
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-lg transition-colors"
              >
                <FiLogIn />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div
          className="lg:hidden"
          style={{ height: `${headerHeight}px` }}
        />
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
