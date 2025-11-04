import { useState, useEffect } from 'react';
import { FiX, FiDownload, FiSmartphone, FiMonitor } from 'react-icons/fi';
import { FaApple, FaAndroid, FaChrome } from 'react-icons/fa';

const InstallPWA = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

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
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    onClose();
  };

  if (isStandalone) {
    return null; // Already installed
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 shadow-lg relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <FiX size={20} />
      </button>

      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <FiSmartphone className="text-white" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            📱 Add WaZhop to Your Home Screen
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Access your dashboard instantly like a native app! No app store needed.
          </p>
        </div>
      </div>

      {/* Chrome/Android - Show install button if available */}
      {deferredPrompt && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <FaChrome className="text-4xl text-blue-500" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Quick Install Available
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Install with one click!
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 text-lg"
          >
            <FiDownload size={22} />
            Install Now
          </button>
        </div>
      )}

      {/* iOS Instructions */}
      {isIOS && !deferredPrompt && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <FaApple className="text-4xl text-gray-800 dark:text-gray-200" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                For iPhone/iPad Users
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Follow these simple steps:
              </p>
            </div>
          </div>

          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                1
              </span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Tap the <strong>Share button</strong> at the bottom of Safari
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  (Square with arrow pointing up)
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                2
              </span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  (Icon with plus sign)
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                3
              </span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Tap <strong>"Add"</strong> in the top right corner
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  WaZhop will appear on your home screen!
                </p>
              </div>
            </li>
          </ol>

          <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> This only works in Safari browser on iOS
            </p>
          </div>
        </div>
      )}

      {/* Android Instructions (fallback if prompt not available) */}
      {isAndroid && !deferredPrompt && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <FaAndroid className="text-4xl text-green-500" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                For Android Users
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Follow these simple steps:
              </p>
            </div>
          </div>

          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                1
              </span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Tap the <strong>three-dot menu</strong> in Chrome
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  (Top right corner)
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                2
              </span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Select <strong>"Add to Home screen"</strong>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  or "Install app"
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                3
              </span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Tap <strong>"Add"</strong> or <strong>"Install"</strong>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  WaZhop will appear on your home screen!
                </p>
              </div>
            </li>
          </ol>
        </div>
      )}

      {/* Desktop Instructions */}
      {!isIOS && !isAndroid && !deferredPrompt && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <FiMonitor className="text-4xl text-purple-500" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                For Desktop Users
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Install as a desktop app:
              </p>
            </div>
          </div>

          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                1
              </span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Click the <strong>install icon</strong> in the address bar
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  (Computer/monitor icon on the right)
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                2
              </span>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Click <strong>"Install"</strong> in the popup
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  WaZhop will open in its own window!
                </p>
              </div>
            </li>
          </ol>

          <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg p-3">
            <p className="text-xs text-purple-800 dark:text-purple-300">
              <strong>Note:</strong> Works in Chrome, Edge, and other Chromium-based browsers
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <p className="text-xs text-green-800 dark:text-green-300 flex items-start gap-2">
          <span>✨</span>
          <span>
            <strong>Benefits:</strong> Faster loading, offline access, notifications, and a better experience!
          </span>
        </p>
      </div>
    </div>
  );
};

export default InstallPWA;
