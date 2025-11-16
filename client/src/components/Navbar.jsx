import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import logoBlack from '/wazhoplogo/logoblack.PNG?url';
import logoWhite from '/wazhoplogo/Logowhite.PNG?url';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  // Close mobile menu on route change or escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Base menu links
  let menuLinks = [
    { to: '/', label: 'Home' },
    { to: '/how-it-works', label: 'How It Works' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  // Hide seller-focused links for buyers
  const isBuyer = isAuthenticated && user?.role === 'buyer';
  if (isBuyer) {
    menuLinks = menuLinks.filter((l) => l.to !== '/pricing');
  }

  const isActive = (to) => {
    // Consider a link active if the current path starts with the target path
    // Handles nested routes like /pricing/faq etc.
    try {
      if (to === '/') {
        // Home (Marketplace) is active if on root or product detail pages
        return location.pathname === '/' || location.pathname.startsWith('/product/');
      }
      return location.pathname === to || location.pathname.startsWith(`${to}/`);
    } catch {
      return false;
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/50 sticky top-0 z-50 border-b border-gray-100 dark:border-gray-700 safe-top safe-left safe-right">
      <div className="container-custom">
        <div className="flex justify-between items-center min-h-[56px] md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
            <img
              src={logoBlack}
              alt="WaZhop logo"
              className="h-16 md:h-20 lg:h-24 w-auto dark:hidden"
              decoding="async"
              loading="eager"
            />
            <img
              src={logoWhite}
              alt="WaZhop logo"
              className="h-16 md:h-20 lg:h-24 w-auto hidden dark:block"
              decoding="async"
              loading="eager"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-3 md:ml-8 lg:ml-12">
            {menuLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg transition-all font-medium ${
                    active
                      ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            
            {/* BUY and SELL buttons - only show for non-authenticated users */}
            {!isAuthenticated && (
              <>
                <Link 
                  to="/register?role=buyer" 
                  className="px-4 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition-all shadow-sm md:ml-2 lg:ml-4"
                >
                  BUY
                </Link>
                <Link 
                  to="/register?role=seller" 
                  className="px-4 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-all shadow-sm"
                >
                  SELL
                </Link>
              </>
            )}
            
            <ThemeToggle />
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Seller/Admin: show Dashboard */}
                {(user?.role === 'seller' || user?.role === 'admin') && (
                  <Link to="/dashboard" className="btn btn-primary">
                    Dashboard
                  </Link>
                )}
                {/* Buyer: show Be a Seller */}
                {user?.role === 'buyer' && (
                  <Link to="/dashboard?upgrade=seller" className="btn btn-primary">
                    Be a Seller
                  </Link>
                )}
                <button 
                  onClick={logout}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Logout"
                >
                  <FiLogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:bg-gray-200 dark:active:bg-gray-600 transition"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Slide-out menu */}
          <div className="fixed top-0 right-0 bottom-0 w-4/5 max-w-sm bg-white dark:bg-gray-800 z-50 shadow-2xl md:hidden overflow-y-auto">
            {/* Header with Logo */}
            <div className="h-16 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-6">
              <Link to="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
                <img
                  src={logoBlack}
                  alt="WaZhop logo"
                  className="h-14 w-auto dark:hidden"
                  decoding="async"
                  loading="eager"
                />
                <img
                  src={logoWhite}
                  alt="WaZhop logo"
                  className="h-14 w-auto hidden dark:block"
                  decoding="async"
                  loading="eager"
                />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                aria-label="Close menu"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="px-6 py-6 space-y-2">
              {menuLinks.map((link) => {
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={
                      `block min-h-[52px] px-4 py-3 rounded-lg font-medium transition ` +
                      (active
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600')
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
              
              {/* BUY and SELL buttons for mobile - only show for non-authenticated users */}
              {!isAuthenticated && (
                <div className="flex gap-2 pt-2">
                  <Link 
                    to="/register?role=buyer" 
                    onClick={() => setIsOpen(false)}
                    className="flex-1 min-h-[52px] px-4 py-3 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 active:bg-green-800 transition-all shadow-sm text-center"
                  >
                    BUY
                  </Link>
                  <Link 
                    to="/register?role=seller" 
                    onClick={() => setIsOpen(false)}
                    className="flex-1 min-h-[52px] px-4 py-3 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-all shadow-sm text-center"
                  >
                    SELL
                  </Link>
                </div>
              )}
              
              <div className="py-4">
                <div className="flex items-center justify-between px-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
              
              <div className="pt-4 border-t dark:border-gray-700 mt-4">
                {isAuthenticated ? (
                  <>
                    {(user?.role === 'seller' || user?.role === 'admin') && (
                      <Link
                        to="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="block min-h-[52px] px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-lg font-medium transition"
                      >
                        Dashboard
                      </Link>
                    )}
                    {user?.role === 'buyer' && (
                      <Link
                        to="/dashboard?upgrade=seller"
                        onClick={() => setIsOpen(false)}
                        className="block min-h-[52px] px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-lg font-medium transition"
                      >
                        Be a Seller
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="w-full min-h-[52px] px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 rounded-lg font-medium transition flex items-center space-x-2"
                    >
                      <FiLogOut size={20} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="block min-h-[52px] px-4 py-3 text-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-lg font-medium transition"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="block min-h-[52px] px-4 py-3 text-center bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 active:bg-primary-800 dark:active:bg-primary-700 rounded-lg font-medium transition mt-2"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
