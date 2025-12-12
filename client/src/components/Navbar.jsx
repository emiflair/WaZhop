import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut, FiSearch, FiCamera, FiFacebook, FiInstagram, FiMail } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const { theme } = useTheme();
  const isMarketplace = location.pathname === '/';
  const cameraInputRef = useRef(null);
  const isNativeApp = Capacitor.isNativePlatform();

  // Base padding offsets keep navbar aligned while shrinking web fallback spacing
  const navPaddingBase = isNativeApp ? 60 : 28;
  const overlayPaddingBase = isNativeApp ? 60 : 36;
  const overlayMarketplaceBase = isNativeApp ? 160 : 120;
  const safeAreaTop = 'env(safe-area-inset-top, 0px)';
  const safeAreaLeft = isNativeApp ? 'env(safe-area-inset-left, 0px)' : '0px';
  const safeAreaRight = isNativeApp ? 'env(safe-area-inset-right, 0px)' : '0px';
  const mobileBrandOffset = isNativeApp
    ? 'calc(-1 * env(safe-area-inset-left, 0px))'
    : '-8px';

  const toggleMenu = () => setIsOpen(!isOpen);

  const logoSrc = theme === 'dark'
    ? '/wazhoplogo/Logowhite.PNG.png'
    : '/wazhoplogo/logoblack.PNG.png';

  // Listen for toggle event from marketplace
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggleMobileMenu', handleToggle);
    return () => window.removeEventListener('toggleMobileMenu', handleToggle);
  }, []);

  const openMarketplaceFilters = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openMarketplaceFilters'));
    }
  };

  const handleSearchCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openMarketplaceFilters();
    }
  };

  const handleCameraClick = (event) => {
    event.stopPropagation();
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleCameraChange = (event) => {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('marketplacePhotoCapture', { detail: { file } }));
    }

    // Reset input so the same image can be selected again if needed
    event.target.value = '';
  };

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

  const overlayTopPadding = isMarketplace
    ? `calc(${safeAreaTop} + ${overlayMarketplaceBase}px)`
    : `calc(${safeAreaTop} + ${overlayPaddingBase}px)`;

  return (
    <nav
      className="nav-safe-area bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/50 sticky-safe border-b border-gray-100 dark:border-gray-700 w-full overflow-x-hidden"
      style={{
        paddingTop: `calc(${safeAreaTop} + ${navPaddingBase}px)`,
        paddingLeft: safeAreaLeft,
        paddingRight: safeAreaRight,
        marginLeft: isNativeApp ? 'calc(-1 * env(safe-area-inset-left, 0px))' : '0px',
        marginRight: isNativeApp ? 'calc(-1 * env(safe-area-inset-right, 0px))' : '0px',
        maxWidth: '100vw',
      }}
    >
        {/* Hidden camera input */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraChange}
          className="hidden"
          aria-hidden="true"
        />
        <div className={`w-full ${!isNativeApp ? 'max-w-[1440px] mx-auto px-0 md:px-6 lg:px-8' : 'container-custom'}`}>
          <div className="flex flex-nowrap justify-between items-center gap-2 sm:gap-3 min-h-[56px] md:h-20 w-full overflow-hidden">
            {/* Mobile brand (web only) */}
            {!isNativeApp && (
              <div className="flex items-center md:hidden shrink-0" style={{ marginLeft: mobileBrandOffset }}>
                <Link
                  to="/"
                  className="flex items-center"
                  aria-label="WaZhop home"
                >
                  <img src={logoSrc} alt="WaZhop logo" className="h-[4.5rem] sm:h-20 w-auto max-w-[160px] sm:max-w-[180px] object-contain" />
                </Link>
              </div>
            )}

            {/* Mobile: spacer on non-marketplace pages */}
            {!isMarketplace && <div className="md:hidden flex-1" />}

            {/* Desktop Navigation */}
          <div className="hidden md:flex items-center flex-nowrap space-x-1 lg:space-x-2 xl:space-x-3 flex-1">
            {!isNativeApp && (
              <Link
                to="/"
                className="flex items-center pr-4 lg:pr-6 shrink-0"
                aria-label="WaZhop home"
              >
                <img src={logoSrc} alt="WaZhop logo" className="h-16 lg:h-20 xl:h-24 w-auto max-w-[160px] lg:max-w-[200px] xl:max-w-[220px] object-contain" />
              </Link>
            )}
            {menuLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-2 lg:px-3 xl:px-4 py-2 rounded-lg transition-all font-medium text-xs md:text-sm lg:text-base whitespace-nowrap ${
                    active
                      ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {isMarketplace && (
              <button
                onClick={openMarketplaceFilters}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                aria-label="Open marketplace search and filters"
              >
                <FiSearch size={20} />
              </button>
            )}
            
            {/* BUY and SELL buttons - only show for non-authenticated users */}
            {!isAuthenticated && (
              <>
                <Link 
                  to="/register?role=buyer" 
                  className="px-2 lg:px-3 xl:px-4 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition-all shadow-sm text-xs md:text-sm lg:text-base whitespace-nowrap"
                >
                  BUY
                </Link>
                <Link 
                  to="/register?role=seller" 
                  className="px-2 lg:px-3 xl:px-4 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-all shadow-sm text-xs md:text-sm lg:text-base whitespace-nowrap"
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
              <div className="flex items-center space-x-2 lg:space-x-4">
                <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition text-xs md:text-sm lg:text-base whitespace-nowrap">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary text-xs md:text-sm lg:text-base whitespace-nowrap">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile controls - hide on marketplace as it has its own menu button */}
          {!isMarketplace && (
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={toggleMenu}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:bg-gray-200 dark:active:bg-gray-600 transition"
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
              >
                {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Overlay - Full Screen */}
      {isOpen && (
        <>
          {/* Full Screen Menu */}
          <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 md:hidden overflow-y-auto" style={{ paddingTop: overlayTopPadding }}>
            <div className="flex flex-col" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}>
              
              {/* Header with close button */}
              <div className="flex justify-end px-4 pb-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  aria-label="Close menu"
                >
                  <FiX size={28} />
                </button>
              </div>

              {/* Menu Content */}
              <div className="flex-1 px-4 pb-4 space-y-1.5">
                {/* Main navigation links as boxes */}
                <div className="grid grid-cols-2 gap-2">
                  {menuLinks.map((link, index) => {
                    const active = isActive(link.to);
                    const isLastOdd = index === menuLinks.length - 1 && menuLinks.length % 2 !== 0;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setIsOpen(false)}
                        className={
                          `flex min-h-[44px] px-2.5 py-2 rounded-xl font-semibold text-sm transition items-center justify-center text-center ` +
                          (active
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600')
                        }
                        style={isLastOdd ? { gridColumn: 'span 2' } : undefined}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>

                {/* Theme box */}
                <div className="min-h-[44px] px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">Theme</span>
                  <ThemeToggle />
                </div>

                {/* Quick Links section as boxes */}
                <div className="pt-2">
                  <p className="px-1 text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5 font-semibold">Quick Links</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Link to="/pricing" onClick={() => setIsOpen(false)} className="min-h-[44px] px-2.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white text-center flex items-center justify-center text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 transition">
                      Pricing
                    </Link>
                    <Link to="/how-it-works" onClick={() => setIsOpen(false)} className="min-h-[44px] px-2.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white text-center flex items-center justify-center text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 transition">
                      How It Works
                    </Link>
                    <Link to="/register" onClick={() => setIsOpen(false)} className="min-h-[44px] px-2.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white text-center flex items-center justify-center text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 transition">
                      Get Started
                    </Link>
                    <Link to="/about" onClick={() => setIsOpen(false)} className="min-h-[44px] px-2.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white text-center flex items-center justify-center text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 transition">
                      About Us
                    </Link>
                    <Link to="/contact" onClick={() => setIsOpen(false)} className="min-h-[44px] px-2.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white text-center flex items-center justify-center text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 transition">
                      Contact
                    </Link>
                    <Link to="/privacy-policy" onClick={() => setIsOpen(false)} className="min-h-[44px] px-2.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white text-center flex items-center justify-center text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 transition">
                      Privacy Policy
                    </Link>
                    <Link to="/terms-of-service" onClick={() => setIsOpen(false)} className="min-h-[44px] px-2.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white text-center flex items-center justify-center text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 transition col-span-3">
                      Terms of Service
                    </Link>
                  </div>
                </div>

                {/* Connect section as icon boxes */}
                <div className="pt-2">
                  <p className="px-1 text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5 font-semibold">Connect</p>
                  <div className="flex gap-2">
                    <a href="https://www.facebook.com/share/1CD2GNxUEw/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="flex-1 min-h-[44px] rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-blue-600 transition flex items-center justify-center" onClick={() => setIsOpen(false)}>
                      <FiFacebook size={24} className="text-gray-700 dark:text-white" />
                    </a>
                    <a href="https://www.instagram.com/wazhop.ng?igsh=Z2Nqd2w3eTF0bHdo&utm_source=qr" target="_blank" rel="noopener noreferrer" className="flex-1 min-h-[44px] rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-pink-600 transition flex items-center justify-center" onClick={() => setIsOpen(false)}>
                      <FiInstagram size={24} className="text-gray-700 dark:text-white" />
                    </a>
                    <a href="mailto:support@wazhop.ng" className="flex-1 min-h-[44px] rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-center" onClick={() => setIsOpen(false)}>
                      <FiMail size={24} className="text-gray-700 dark:text-white" />
                    </a>
                  </div>
                </div>

                {/* Auth section */}
                <div className="pt-2">
                  {isAuthenticated ? (
                    <>
                      {(user?.role === 'seller' || user?.role === 'admin') && (
                        <Link
                          to="/dashboard"
                          onClick={() => setIsOpen(false)}
                          className="block min-h-[50px] px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white text-center flex items-center justify-center font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 transition mb-2"
                        >
                          Dashboard
                        </Link>
                      )}
                      {user?.role === 'buyer' && (
                        <Link
                          to="/dashboard?upgrade=seller"
                          onClick={() => setIsOpen(false)}
                          className="block min-h-[50px] px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white text-center flex items-center justify-center font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 transition mb-2"
                        >
                          Be a Seller
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                        }}
                        className="w-full min-h-[50px] px-4 py-3 rounded-2xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 active:bg-red-800 transition flex items-center justify-center space-x-2"
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
                        className="block min-h-[50px] px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white text-center flex items-center justify-center font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 transition mb-2"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsOpen(false)}
                        className="block min-h-[50px] px-4 py-3 rounded-2xl bg-primary-600 text-white text-center flex items-center justify-center font-semibold text-sm hover:bg-primary-700 active:bg-primary-800 transition shadow"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
