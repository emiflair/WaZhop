import { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               window.navigator.standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Show prompt if not standalone and not recently dismissed (wait 7 days)
    if (!isInStandaloneMode && daysSinceDismissed > 7) {
      setShowPrompt(true);
    }

    // Listen for the beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android/Desktop - show native install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    }
    // iOS users will see the manual instructions
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  // Don't show if already installed or permanently dismissed
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t-2 border-orange-500 shadow-2xl animate-slide-up">
      <div className="max-w-md mx-auto p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-white">W</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Install WaZhop App
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {isIOS 
                ? 'Add to your home screen for quick access'
                : 'Install the app for a better experience'
              }
            </p>

            {isIOS ? (
              // iOS Instructions
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 bg-orange-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="font-medium flex items-center text-orange-600 dark:text-orange-400">
                  <Share className="w-4 h-4 mr-2" />
                  Tap the Share button below
                </p>
                <p className="flex items-center">
                  <Plus className="w-4 h-4 mr-2 text-orange-500" />
                  Then tap "Add to Home Screen"
                </p>
                <div className="pt-2 border-t border-orange-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    The Share button is at the bottom of Safari (or top-right in some browsers)
                  </p>
                </div>
              </div>
            ) : (
              // Android/Desktop - Show install button
              <button
                onClick={handleInstallClick}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Install App</span>
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="mt-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
