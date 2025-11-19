import { useState, useEffect } from 'react';
import { FiX, FiDownload, FiSmartphone } from 'react-icons/fi';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandaloneBrowser = window.matchMedia('(display-mode: standalone)').matches;
    const isStandaloneNavigator = window.navigator.standalone === true;
    setIsStandalone(isStandaloneBrowser || isStandaloneNavigator);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const shouldShow = !dismissed || (Date.now() - dismissedTime > threeDays);

    if (!isStandaloneBrowser && !isStandaloneNavigator && shouldShow) {
      if (iOS) {
        // Show iOS install instructions after 3 seconds
        setTimeout(() => setShowPrompt(true), 3000);
      } else {
        // Handle Android/Desktop PWA install
        const handleBeforeInstallPrompt = (e) => {
          e.preventDefault();
          setDeferredPrompt(e);
          // Show prompt after 3 seconds
          setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
      }
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  // Don't show if already installed
  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 left-4 right-4 md:left-auto md:right-8 md:max-w-sm z-40 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-start gap-4">
          {/* App Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiSmartphone className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Install WaZhop App
              </h3>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Dismiss"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Install this app on your iPhone: tap{' '}
                  <span className="inline-flex items-center justify-center w-4 h-4 text-primary-600 dark:text-primary-400">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                    </svg>
                  </span>{' '}
                  then &ldquo;Add to Home Screen&rdquo;
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Get quick access to WaZhop marketplace. Install now for a better experience!
                </p>
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <FiDownload className="w-4 h-4" />
                  Install App
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
