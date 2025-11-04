import { useState, useEffect } from 'react';
import { FiX, FiDownload, FiSmartphone } from 'react-icons/fi';

const InstallPWA = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
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
      return "Tap Share ⬆️ → 'Add to Home Screen'";
    }
    if (deferredPrompt) {
      return "Tap Install for instant access";
    }
    return "Tap menu (⋮) → 'Add to Home screen'";
  };

  return (
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

        {/* Install Button */}
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="btn bg-white text-blue-600 hover:bg-blue-50 active:bg-blue-100 px-3 sm:px-4 py-2 text-sm font-semibold whitespace-nowrap flex-shrink-0 touch-manipulation shadow-lg flex items-center gap-1.5"
          >
            <FiDownload size={16} />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

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
  );
};

export default InstallPWA;
