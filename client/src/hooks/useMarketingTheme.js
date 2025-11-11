import { useEffect } from 'react';

/**
 * Force light mode for marketing pages (independent of dashboard theme)
 * This ensures marketing pages (Home, Pricing, About, etc.) always display in light mode
 * regardless of the user's dashboard theme preference
 */
export const useMarketingTheme = () => {
  useEffect(() => {
    // Force light mode on mount
    document.documentElement.classList.remove('dark');
    
    // Cleanup: restore user's theme preference when leaving marketing page
    return () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    };
  }, []);
};
