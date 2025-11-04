/**
 * Client-side IP geolocation for currency detection
 * Uses free ipapi.co API (30k requests/month)
 */

const COUNTRY_CURRENCY_MAP = {
  'NG': 'NGN', // Nigeria - Naira
  'GH': 'GHS', // Ghana - Cedi
  'KE': 'KES', // Kenya - Shilling
  'ZA': 'ZAR', // South Africa - Rand
  'US': 'USD', // United States - Dollar
  'GB': 'USD', // United Kingdom
  'CA': 'USD', // Canada
};

const DEFAULT_CURRENCY = 'NGN';

/**
 * Detect user's currency based on their IP location
 * @returns {Promise<string>} - Currency code (NGN, GHS, KES, ZAR, USD)
 */
export async function detectCurrency() {
  // Check if already cached in localStorage
  const cached = localStorage.getItem('detectedCurrency');
  const cacheTimestamp = localStorage.getItem('currencyDetectionTime');
  
  // Cache for 7 days
  if (cached && cacheTimestamp) {
    const cacheAge = Date.now() - parseInt(cacheTimestamp);
    if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
      return cached;
    }
  }

  try {
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      console.error('IP detection failed:', response.status);
      return DEFAULT_CURRENCY;
    }

    const data = await response.json();
    const countryCode = data.country_code;
    const currency = COUNTRY_CURRENCY_MAP[countryCode] || DEFAULT_CURRENCY;

    // Cache the result
    localStorage.setItem('detectedCurrency', currency);
    localStorage.setItem('currencyDetectionTime', Date.now().toString());
    localStorage.setItem('detectedCountry', countryCode);

    return currency;
  } catch (error) {
    console.error('Error detecting currency:', error);
    return DEFAULT_CURRENCY;
  }
}

/**
 * Get cached currency without making API call
 * @returns {string} - Cached currency or default
 */
export function getCachedCurrency() {
  return localStorage.getItem('detectedCurrency') || DEFAULT_CURRENCY;
}

/**
 * Clear currency cache (useful for testing)
 */
export function clearCurrencyCache() {
  localStorage.removeItem('detectedCurrency');
  localStorage.removeItem('currencyDetectionTime');
  localStorage.removeItem('detectedCountry');
}

/**
 * Get user's country code
 * @returns {string|null}
 */
export function getDetectedCountry() {
  return localStorage.getItem('detectedCountry');
}
