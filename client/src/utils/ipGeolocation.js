/**
 * Client-side IP geolocation for currency detection
 * Uses free ipapi.co API (30k requests/month)
 */

const COUNTRY_CURRENCY_MAP = {
  NG: 'NGN', // Nigeria - Naira
  GH: 'GHS', // Ghana - Cedi
  KE: 'KES', // Kenya - Shilling
  ZA: 'ZAR', // South Africa - Rand
  US: 'USD', // United States - Dollar
  GB: 'USD', // United Kingdom
  CA: 'USD', // Canada
};

const DEFAULT_CURRENCY = 'NGN';
const GEO_CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const GEO_TIMESTAMP_KEY = 'geoDetectionTime';

const withLocalStorage = (fn) => {
  try {
    return fn();
  } catch (error) {
    console.error('Geo cache error:', error);
    return undefined;
  }
};

const getCachedValue = (key) => withLocalStorage(() => localStorage.getItem(key));
const setCachedValue = (key, value) => withLocalStorage(() => localStorage.setItem(key, value));
const removeCachedValue = (key) => withLocalStorage(() => localStorage.removeItem(key));

const isCacheValid = (timestamp) => {
  if (!timestamp) return false;
  const age = Date.now() - parseInt(timestamp, 10);
  return Number.isFinite(age) && age < GEO_CACHE_DURATION_MS;
};

const normalizeDialCode = (dialCode) => {
  if (!dialCode) return null;
  return dialCode.replace(/[^\d]/g, '') || null;
};

async function fetchGeoData() {
  const cachedTimestamp = getCachedValue(GEO_TIMESTAMP_KEY);
  const cachedCountry = getCachedValue('detectedCountry');
  const cachedDialCode = getCachedValue('detectedDialCode');
  const cachedCurrency = getCachedValue('detectedCurrency');

  if (cachedCountry && isCacheValid(cachedTimestamp)) {
    return {
      countryCode: cachedCountry,
      dialCode: cachedDialCode,
      currency: cachedCurrency || DEFAULT_CURRENCY
    };
  }

  try {
    const response = await fetch('https://ipapi.co/json/');

    if (!response.ok) {
      console.error('IP detection failed:', response.status);
      return {
        countryCode: cachedCountry || null,
        dialCode: cachedDialCode || null,
        currency: cachedCurrency || DEFAULT_CURRENCY
      };
    }

    const data = await response.json();
    const countryCode = data.country_code ? data.country_code.toUpperCase() : null;
    const dialCode = normalizeDialCode(data.country_calling_code);
    const currency = data.currency || (countryCode ? COUNTRY_CURRENCY_MAP[countryCode] : null) || DEFAULT_CURRENCY;

    if (countryCode) {
      setCachedValue('detectedCountry', countryCode);
    }

    if (dialCode) {
      setCachedValue('detectedDialCode', dialCode);
    }

    if (currency) {
      setCachedValue('detectedCurrency', currency);
    }

    setCachedValue(GEO_TIMESTAMP_KEY, Date.now().toString());

    return {
      countryCode,
      dialCode,
      currency
    };
  } catch (error) {
    console.error('Error detecting geo data:', error);
    return {
      countryCode: cachedCountry || null,
      dialCode: cachedDialCode || null,
      currency: cachedCurrency || DEFAULT_CURRENCY
    };
  }
}

/**
 * Detect user's currency based on their IP location
 * @returns {Promise<string>} - Currency code (NGN, GHS, KES, ZAR, USD)
 */
export async function detectCurrency() {
  const geoData = await fetchGeoData();
  return geoData.currency || DEFAULT_CURRENCY;
}

/**
 * Get cached currency without making API call
 * @returns {string} - Cached currency or default
 */
export function getCachedCurrency() {
  const cached = getCachedValue('detectedCurrency');
  return cached || DEFAULT_CURRENCY;
}

/**
 * Clear currency cache (useful for testing)
 */
export function clearCurrencyCache() {
  removeCachedValue('detectedCurrency');
  removeCachedValue('detectedCountry');
  removeCachedValue('detectedDialCode');
  removeCachedValue(GEO_TIMESTAMP_KEY);
}

/**
 * Get user's country code
 * @returns {string|null}
 */
export function getDetectedCountry() {
  return getCachedValue('detectedCountry');
}

/**
 * Detect user's country code and cache it
 * @returns {Promise<string|null>}
 */
export async function detectCountryCode() {
  const geoData = await fetchGeoData();
  return geoData.countryCode || null;
}

/**
 * Get cached dial code without API call
 * @returns {string|null} - Digits only (e.g., "234")
 */
export function getDetectedDialCode() {
  return getCachedValue('detectedDialCode');
}

/**
 * Detect user's dial code and cache it
 * @returns {Promise<string|null>} - Digits only (e.g., "234")
 */
export async function detectDialCode() {
  const geoData = await fetchGeoData();
  return geoData.dialCode || null;
}
