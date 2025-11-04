import { useState, useEffect } from 'react';
import { FiX, FiDownload, FiSmartphone, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { FaApple, FaAndroid } from 'react-icons/fa';

const InstallPWA = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

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

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowInstructions(!showInstructions);
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
          {/* Icon */}
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
            <FiSmartphone className="text-white" size={20} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-white mb-0.5">
              Install WaZhop App
            </h3>
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

      {/* Instructions Panel */}
      {showInstructions && (
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
                      Scroll and tap <strong>"Add to Home Screen"</strong>
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
                      Tap <strong>"Add"</strong> to confirm
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
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <FaAndroid className="text-3xl text-green-600 dark:text-green-400" />
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
                  <span className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
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
                  <span className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Tap <strong>"Add to Home screen"</strong>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      Or "Install app" if available
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Tap <strong>"Add"</strong> or <strong>"Install"</strong>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      The app will appear on your home screen! 🎉
                    </p>
                  </div>
                </li>
              </ol>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-4">
                <p className="text-xs text-green-800 dark:text-green-300">
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
                    Tap Share (⬆️) → "Add to Home Screen" → Add
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    <FaAndroid className="inline mr-2" />
                    On Android (Chrome):
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    Menu (⋮) → "Add to Home screen" → Add
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
                <span className="text-green-500">✓</span>
                <span>Instant access from your home screen</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Faster loading and better performance</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Works offline when network is poor</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
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
