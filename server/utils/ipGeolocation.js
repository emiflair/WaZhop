/**
 * IP Geolocation utility for currency detection
 * Detects user's country from IP and maps to appropriate currency
 */

// Country to currency mapping
const COUNTRY_CURRENCY_MAP = {
  'NG': 'NGN', // Nigeria - Naira
  'GH': 'GHS', // Ghana - Cedi
  'KE': 'KES', // Kenya - Shilling
  'ZA': 'ZAR', // South Africa - Rand
  'US': 'USD', // United States - Dollar
  'GB': 'USD', // United Kingdom - Use USD
  'CA': 'USD', // Canada - Use USD
  // Add more as needed
};

const DEFAULT_CURRENCY = 'NGN';

/**
 * Get country code from IP address using ipapi.co (free tier: 30k requests/month)
 * @param {string} ip - IP address
 * @returns {Promise<string>} - Country code (e.g., 'NG', 'GH')
 */
async function getCountryFromIP(ip) {
  // Skip for localhost/development
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'NG'; // Default to Nigeria for local dev
  }

  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    
    if (!response.ok) {
      console.error('IP geolocation API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.country_code || null;
  } catch (error) {
    console.error('Error fetching geolocation:', error.message);
    return null;
  }
}

/**
 * Get currency based on IP address
 * @param {string} ip - IP address from request
 * @returns {Promise<string>} - Currency code (e.g., 'NGN', 'GHS', 'KES')
 */
async function getCurrencyFromIP(ip) {
  try {
    const countryCode = await getCountryFromIP(ip);
    
    if (!countryCode) {
      return DEFAULT_CURRENCY;
    }

    return COUNTRY_CURRENCY_MAP[countryCode] || DEFAULT_CURRENCY;
  } catch (error) {
    console.error('Error detecting currency from IP:', error.message);
    return DEFAULT_CURRENCY;
  }
}

/**
 * Get client IP from request (handles proxies)
 * @param {object} req - Express request object
 * @returns {string} - Client IP address
 */
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip
  );
}

/**
 * Express middleware to detect and attach currency to request
 * Usage: app.use(detectCurrency);
 */
async function detectCurrency(req, res, next) {
  const ip = getClientIP(req);
  req.detectedCurrency = await getCurrencyFromIP(ip);
  req.clientIP = ip;
  next();
}

module.exports = {
  getCountryFromIP,
  getCurrencyFromIP,
  getClientIP,
  detectCurrency,
  COUNTRY_CURRENCY_MAP,
  DEFAULT_CURRENCY
};
