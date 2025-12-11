import { useState, useEffect } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               window.navigator.standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Don't proceed if already in standalone mode
    if (isInStandaloneMode) {
      return;
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Listen for the beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Only show if not recently dismissed
      if (daysSinceDismissed > 7) {
        setTimeout(() => setShowPrompt(true), 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show prompt after delay if not recently dismissed
    if (iOS && daysSinceDismissed > 7) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

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
    setShowIOSGuide(false);
  };

  const handleIOSClick = () => {
    setShowIOSGuide(true);
  };

  // Don't show if already installed or permanently dismissed
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <>
      {/* iOS Guide Overlay */}
      {isIOS && showIOSGuide && (
        <div 
          className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-end pb-4 animate-fade-in"
          onClick={handleDismiss}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <div onClick={(e) => e.stopPropagation()}>
          
          <div className="text-center mb-8 px-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
              <h3 className="text-2xl font-bold text-white mb-4">Install WaZhop</h3>
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 text-white font-bold">1</div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Tap the Share button</p>
                    <p className="text-gray-300 text-sm">At the bottom of the browser</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 text-white font-bold">2</div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Select "Add to Home Screen"</p>
                    <p className="text-gray-300 text-sm">Scroll down in the menu</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 text-white font-bold">3</div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Tap "Add"</p>
                    <p className="text-gray-300 text-sm">App will appear on your home screen</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Install Prompt */}
      <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
        <div className="bg-white dark:bg-gray-900 border border-orange-500 shadow-lg rounded-lg max-w-sm mx-auto p-3 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 pr-6">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-white">W</span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Install WaZhop
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Quick access from home
              </p>
            </div>

            {isIOS ? (
              <button
                onClick={handleIOSClick}
                className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-3 rounded-lg flex items-center gap-1 transition-colors text-xs"
              >
                <Download className="w-4 h-4" />
                <span>Install</span>
              </button>
            ) : (
              <button
                onClick={handleInstallClick}
                className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-3 rounded-lg flex items-center gap-1 transition-colors text-xs"
              >
                <Download className="w-4 h-4" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PWAInstallPrompt;
