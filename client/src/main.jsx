import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

// Clear old caches on app load to ensure users get fresh updates
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
    });
  });
}

// Unregister any service workers (in case they were previously registered)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
}

// Safari-specific: Detect if page is loaded from BFCache and force reload
// Safari requires more aggressive cache-busting than Chrome
let pageAccessedByReload = false;

window.addEventListener('pageshow', (event) => {
  // If page was restored from BFCache (back/forward cache)
  if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
    if (!pageAccessedByReload) {
      pageAccessedByReload = true;
      window.location.reload();
    }
  }
});

// Safari-specific: Add timestamp to prevent caching
// Store app version in sessionStorage to detect stale loads
const APP_VERSION = '1.0.' + Date.now();
const storedVersion = sessionStorage.getItem('app_version');

if (storedVersion && storedVersion !== APP_VERSION) {
  // Version changed, clear storage and reload
  sessionStorage.clear();
  localStorage.removeItem('hasReloaded'); // Clear reload flag
  window.location.reload();
} else {
  sessionStorage.setItem('app_version', APP_VERSION);
}

// Detect Safari browser
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// For Safari: Force reload once on first visit to clear cache
if (isSafari) {
  const hasReloadedKey = 'hasReloaded_' + window.location.pathname;
  const hasReloaded = sessionStorage.getItem(hasReloadedKey);
  
  if (!hasReloaded) {
    sessionStorage.setItem(hasReloadedKey, 'true');
    window.location.reload();
  }
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
