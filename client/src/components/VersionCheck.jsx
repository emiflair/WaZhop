import { useEffect } from 'react';

/**
 * VersionCheck Component
 * Automatically refreshes the page when a new version is deployed
 * Checks for chunk load errors and version mismatches
 */
const VersionCheck = () => {
  useEffect(() => {
    // Check for version updates every 10 seconds
    const CHECK_INTERVAL = 10 * 1000; // 10 seconds
    let versionCheckInterval;

    const checkForUpdates = async () => {
      try {
        // Fetch the index.html to check if the version changed
        const response = await fetch('/index.html', {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          // Extract the script src from HTML (it changes with each build)
          const scriptMatch = html.match(/src="\/assets\/index-([^"]+)\.js"/);
          
          if (scriptMatch) {
            const newHash = scriptMatch[1];
            const currentHash = localStorage.getItem('app_version_hash');
            
            if (currentHash && currentHash !== newHash) {
              console.log('New version detected, refreshing...');
              localStorage.setItem('app_version_hash', newHash);
              // Clear cache and reload
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                });
              }
              window.location.reload(true);
            } else if (!currentHash) {
              // First time, just store the hash
              localStorage.setItem('app_version_hash', newHash);
            }
          }
        }
      } catch (error) {
        // Silently fail - network might be down
        console.debug('Version check failed:', error);
      }
    };

    // Listen for chunk load errors (happens after deployment)
    const handleChunkError = (event) => {
      const isChunkError = 
        event.message?.includes('Failed to fetch dynamically imported module') ||
        event.message?.includes('Importing a module script failed') ||
        event.message?.includes('dynamically imported module');
      
      if (isChunkError) {
        console.log('Chunk load error detected, refreshing...');
        event.preventDefault();
        // Clear cache and reload
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
        window.location.reload(true);
      }
    };

    // Add error listener
    window.addEventListener('error', handleChunkError, true);

    // Start periodic version check
    checkForUpdates(); // Check immediately
    versionCheckInterval = setInterval(checkForUpdates, CHECK_INTERVAL);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleChunkError, true);
      if (versionCheckInterval) {
        clearInterval(versionCheckInterval);
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default VersionCheck;
