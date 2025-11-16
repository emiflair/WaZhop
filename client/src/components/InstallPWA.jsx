import { useState, useEffect } from 'react';
import { FiX, FiDownload, FiChevronDown, FiChevronUp, FiSmartphone } from 'react-icons/fi';
import logoBlack from '/wazhoplogo/logoblack.PNG?url';
import logoWhite from '/wazhoplogo/Logowhite.PNG?url';
import { FaApple, FaAndroid, FaStar } from 'react-icons/fa';
import toast from 'react-hot-toast';

const InstallPWA = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone ||
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Detect Android
    const android = /Android/.test(navigator.userAgent);
    setIsAndroid(android);

    // Listen for the beforeinstallprompt event (Chrome/Edge/Samsung Internet)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Gently nudge with a native-like sheet on mobile
    const dontShow = localStorage.getItem('pwaDontShowAgain') === '1';
    const hideUntil = Number(localStorage.getItem('pwaHideUntil') || '0');
    const shouldNudge = !standalone && !dontShow && Date.now() > hideUntil && (iOS || android);
    let timer;
    if (shouldNudge) {
      timer = setTimeout(() => setIsSheetOpen(true), 1200);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Celebrate install and hide UI
  useEffect(() => {
    const onInstalled = () => {
      setIsSheetOpen(false);
      if (toast && typeof toast.success === 'function') {
        toast.success('WaZhop installed');
      }
      if (onClose) onClose();
    };
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, [onClose]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setIsSheetOpen(true);
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      if (onClose) onClose();
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
  };

  const handleSnooze = () => {
    // Hide for 3 days
    const ttl = 3 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pwaHideUntil', String(Date.now() + ttl));
    setIsSheetOpen(false);
    if (onClose) onClose();
  };

  const handleDontShowAgain = () => {
    localStorage.setItem('pwaDontShowAgain', '1');
    setIsSheetOpen(false);
    if (onClose) onClose();
  };

  if (isStandalone) {
    return null; // Already installed
  }

  // Get instruction text based on platform
  const getInstructionText = () => {
    if (isIOS) {
      return "Tap to see how to install";
    }
    if (deferredPrompt) {
      return "Tap Install for instant access";
    }
    if (isAndroid) {
      return "Tap to see how to install";
    }
    return "Tap to see how to install";
  };

  return (
    <div className="space-y-3">
      {/* Compact Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-lg p-3 sm:p-4 shadow-md relative overflow-hidden">
        {/* Background decoration */}
        <div 
          className="absolute inset-0 opacity-10" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', 
            backgroundSize: '20px 20px' 
          }}
        />
        
        <div className="flex items-center gap-3 relative z-10">
          {/* Brand lockup: icon + aZhop (chip to match navbar look on gradient) */}
          <div className="flex items-center space-x-2 flex-shrink-0 bg-white/95 dark:bg-gray-800 rounded-lg px-2 py-1 shadow-sm">
            <img src={logoBlack} alt="WaZhop logo" className="h-8 w-auto dark:hidden" decoding="async" loading="eager" />
            <img src={logoWhite} alt="WaZhop logo" className="h-8 w-auto hidden dark:block" decoding="async" loading="eager" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-white mb-0.5">Install WaZhop App</h3>
            <p className="text-xs text-white/90 line-clamp-1">
              {getInstructionText()}
            </p>
          </div>

          {/* Install/How Button */}
          <button
            onClick={handleInstallClick}
            className="btn bg-white text-blue-600 hover:bg-blue-50 active:bg-blue-100 px-3 sm:px-4 py-2 text-sm font-semibold whitespace-nowrap flex-shrink-0 touch-manipulation shadow-lg flex items-center gap-1.5"
          >
            {deferredPrompt ? (
              <>
                <FiDownload size={16} />
                <span className="hidden sm:inline">Install</span>
              </>
            ) : (
              <>
                <span>How?</span>
                {showInstructions ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
              </>
            )}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 touch-manipulation flex-shrink-0"
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>
      </div>

      {/* Native-like Install Bottom Sheet */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleSnooze} />

          {/* Sheet */}
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white dark:bg-gray-900 shadow-2xl border-t border-gray-200 dark:border-gray-800 p-4 sm:p-5 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <div className="flex items-start gap-3">
              <img src={logoBlack} alt="WaZhop logo" className="h-12 w-auto dark:hidden" />
              <img src={logoWhite} alt="WaZhop logo" className="h-12 w-auto hidden dark:block" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-0">
                      <span className="-ml-0.5 text-xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">WaZhop</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Free • Shopping</p>
                  </div>
                  <button onClick={handleSnooze} aria-label="Close" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                    <FiX />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="h-4 w-4" />
                  ))}
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">4.9 • PWA</span>
                </div>
              </div>
            </div>

            {/* CTA row */}
            <div className="mt-4 flex items-center gap-2">
              {deferredPrompt ? (
                <button onClick={handleInstallClick} className="btn btn-primary flex-1 py-3">
                  <FiDownload className="mr-2" /> Install
                </button>
              ) : isIOS ? (
                <button onClick={() => setShowInstructions((s) => !s)} className="btn btn-primary flex-1 py-3">
                  Add to Home Screen
                </button>
              ) : (
                <button onClick={() => setShowInstructions((s) => !s)} className="btn btn-primary flex-1 py-3">
                  How to Install
                </button>
              )}
              <button onClick={handleSnooze} className="btn bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-3">Not now</button>
            </div>

            {/* Instructions inside sheet */}
            {showInstructions && (
              <div className="mt-4 animate-fadeIn">
                {/* iOS Instructions */}
                {isIOS && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"><FaApple className="text-gray-800 dark:text-gray-200" /></div>
                      <div>
                        <p className="font-semibold">Install on iPhone/iPad</p>
                        <p className="text-xs text-gray-500">Open in Safari</p>
                      </div>
                    </div>
                    <ol className="text-sm space-y-2 pl-5 list-decimal">
                      <li>Tap Share (⬆️) in Safari</li>
                      <li>Scroll and choose &quot;Add to Home Screen&quot;</li>
                      <li>Tap Add</li>
                    </ol>
                  </div>
                )}

                {/* Android */}
                {isAndroid && !deferredPrompt && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center"><FaAndroid className="text-primary-600 dark:text-primary-400" /></div>
                      <div>
                        <p className="font-semibold">Install on Android</p>
                        <p className="text-xs text-gray-500">Open in Chrome</p>
                      </div>
                    </div>
                    <ol className="text-sm space-y-2 pl-5 list-decimal">
                      <li>Tap the three-dot menu (⋮)</li>
                      <li>Choose &quot;Add to Home screen&quot; or &quot;Install app&quot;</li>
                      <li>Confirm</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* Footer actions */}
            <div className="mt-3 flex items-center justify-between">
              <button onClick={handleDontShowAgain} className="text-xs text-gray-500 hover:underline">Don’t show again</button>
              <p className="text-[11px] text-gray-400">Looks and works like a native app</p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Panel (desktop fallback) */}
      {showInstructions && !isSheetOpen && (
        <div className="card animate-fadeIn">
          {/* iOS Instructions */}
          {isIOS && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                  <FaApple className="text-3xl text-gray-800 dark:text-gray-200" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100">
                    Install on iPhone/iPad
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Follow these steps in Safari
                  </p>
                </div>
              </div>

              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Tap the <strong>Share button</strong> (⬆️)
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      Located at the bottom of Safari browser
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Scroll and tap <strong>&quot;Add to Home Screen&quot;</strong>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      Look for the plus icon (+) next to it
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Tap <strong>&quot;Add&quot;</strong> to confirm
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      The app will appear on your home screen! 🎉
                    </p>
                  </div>
                </li>
              </ol>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> Installation only works in Safari browser on iOS devices
                </p>
              </div>
            </div>
          )}

          {/* Android Instructions */}
          {isAndroid && !isIOS && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                  <FaAndroid className="text-3xl text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100">
                    Install on Android
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Follow these steps in Chrome
                  </p>
                </div>
              </div>

              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Tap the <strong>three-dot menu</strong> (⋮)
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      Located at the top right corner
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Tap <strong>&quot;Add to Home screen&quot;</strong>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      Or &quot;Install app&quot; if available
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Tap <strong>&quot;Add&quot;</strong> or <strong>&quot;Install&quot;</strong>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      The app will appear on your home screen! 🎉
                    </p>
                  </div>
                </li>
              </ol>

              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 mt-4">
                <p className="text-xs text-primary-800 dark:text-primary-300">
                  <strong>Tip:</strong> You can also look for the install banner at the bottom of your screen
                </p>
              </div>
            </div>
          )}

          {/* Desktop/Generic Instructions */}
          {!isIOS && !isAndroid && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <FiSmartphone className="text-3xl text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100">
                    Install WaZhop
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Desktop or mobile browser
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    <FaApple className="inline mr-2" />
                    On iPhone/iPad (Safari):
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    Tap Share (⬆️) → &quot;Add to Home Screen&quot; → Add
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    <FaAndroid className="inline mr-2" />
                    On Android (Chrome):
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    Menu (⋮) → &quot;Add to Home screen&quot; → Add
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    💻 On Desktop (Chrome/Edge):
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    Click install icon in address bar → Install
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Benefits Section */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">
              ✨ Why Install?
            </h5>
            <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <span className="text-primary-600">✓</span>
                <span>Instant access from your home screen</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-600">✓</span>
                <span>Faster loading and better performance</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-600">✓</span>
                <span>Works offline when network is poor</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-600">✓</span>
                <span>Full-screen experience like a native app</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallPWA;
