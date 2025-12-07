import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'
import performanceMonitor from './utils/performanceMonitor'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'

// Initialize GoogleAuth for native platforms - MUST be done before any GoogleAuth calls
if (Capacitor.isNativePlatform()) {
  GoogleAuth.initialize({
    clientId: '782358027246-kar0nhpcqbe5hfnmp8j59abp18fka9vm.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });
  console.log('✅ GoogleAuth initialized for iOS');
}

// Debug: Log environment immediately
console.log('🚀 App Starting - Environment Check:', {
  API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  isNative: Capacitor.isNativePlatform(),
  platform: Capacitor.getPlatform()
});

// Clear appLoaded flag on native app launch to ensure proper splash behavior
if (Capacitor.isNativePlatform()) {
  sessionStorage.removeItem('appLoaded');
  console.log('🔄 Cleared appLoaded flag for fresh native app launch');
}

// Initialize performance monitoring
if (import.meta.env.PROD) {
  performanceMonitor.init();
}

// Hide native splash screen immediately once web content is ready
const hideNativeSplash = async () => {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    // Hide immediately with fast fade and ensure it stays hidden
    await SplashScreen.hide({ fadeOutDuration: 100 });
    console.log('✅ Splash screen hidden permanently');
    
    // Mark splash as hidden to prevent re-showing
    window.__splashHidden = true;
  } catch (error) {
    console.warn('Failed to hide splash screen', error);
  }
};

// Call it as soon as possible
hideNativeSplash();

// Prevent splash from re-appearing on navigation
if (Capacitor.isNativePlatform()) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.__splashHidden) {
      // Ensure splash stays hidden even after visibility changes
      SplashScreen.hide({ fadeOutDuration: 0 }).catch(() => {});
    }
  });
}

// Ensure the native status bar doesn't overlay the web content
const configureStatusBar = () => {
  if (typeof window === 'undefined') return;
  if (!Capacitor.isNativePlatform()) return;

  const applyStyle = async (isDark) => {
    try {
      // Enable overlay so web content extends behind status bar, allowing safe-area-inset to work
      await StatusBar.setOverlaysWebView({ overlay: true });
      // Set status bar style based on theme
      await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    } catch (error) {
      console.warn('Status bar configuration failed', error);
    }
  };

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  applyStyle(mediaQuery.matches);

  const listener = (event) => applyStyle(event.matches);
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', listener);
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(listener);
  }
};

configureStatusBar();

// Temporarily disable service worker for debugging - unregister existing ones
console.log('🔧 Service Worker temporarily disabled for debugging');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      console.log('🗑️ Unregistering service worker:', registration.scope);
      registration.unregister();
    });
  });
}

// Register service worker for offline support and caching
if (false && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, prompt user to refresh
              if (confirm('A new version is available! Refresh to update?')) {
                newWorker.postMessage({ type: 'skipWaiting' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.warn('Service Worker registration failed:', error);
      });
    
    // Handle controller change (new service worker activated)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#f97316',
            secondary: '#fff',
          },
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  </React.StrictMode>,
)
