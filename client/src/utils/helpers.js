// Client-side helper utilities for WaZhop

export const AFRICAN_DIAL_CODES = [
  '290', '291', // Saint Helena & Ascension, Eritrea
  '27', '20', '211', '212', '213', '216', '218',
  '220', '221', '222', '223', '224', '225', '226', '227', '228', '229',
  '230', '231', '232', '233', '234', '235', '236', '237', '238', '239',
  '240', '241', '242', '243', '244', '245', '246', '247', '248', '249',
  '250', '251', '252', '253', '254', '255', '256', '257', '258',
  '260', '261', '262', '263', '264', '265', '266', '267', '268', '269'
];

const SORTED_AFRICAN_DIAL_CODES = [...AFRICAN_DIAL_CODES].sort((a, b) => b.length - a.length);

const sanitizePhoneInput = (value = '') => value.replace(/[^+\d]/g, '');

export const normalizeAfricanPhoneNumber = (phone) => {
  if (!phone) return null;

  let cleaned = sanitizePhoneInput(phone);
  if (!cleaned) return null;

  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // Support legacy local Nigerian formats for backwards compatibility
  if (cleaned.startsWith('0') && cleaned.length > 1) {
    cleaned = `234${cleaned.slice(1)}`;
  } else if (cleaned.length === 10) {
    cleaned = `234${cleaned}`;
  }

  if (!/^\d{6,14}$/.test(cleaned)) {
    return null;
  }

  const dialCode = SORTED_AFRICAN_DIAL_CODES.find((code) => cleaned.startsWith(code));
  if (!dialCode) {
    return null;
  }

  return `+${cleaned}`;
};

export const isValidAfricanPhone = (value) => !!normalizeAfricanPhoneNumber(value);

export const isSupportedAfricanDialCode = (dialCode) => AFRICAN_DIAL_CODES.includes(dialCode);

export const getDialCodeFromPhone = (phone) => {
  const normalized = normalizeAfricanPhoneNumber(phone);
  if (!normalized) return null;
  const digitsOnly = normalized.slice(1);
  const dialCode = SORTED_AFRICAN_DIAL_CODES.find((code) => digitsOnly.startsWith(code));
  return dialCode || null;
};

/**
 * Format phone number for WhatsApp
 * @param {string} phone - Phone number in various formats
 * @returns {string} - Formatted phone number digits only (e.g., "233201234567")
 */
export const formatWhatsAppNumber = (phone) => {
  const normalized = normalizeAfricanPhoneNumber(phone);
  if (!normalized) return '';
  return normalized.replace('+', '');
};

/**
 * Generate WhatsApp chat URL
 * @param {string} phoneNumber - WhatsApp number
 * @param {string} message - Pre-filled message
 * @returns {string} - WhatsApp URL
 */
export const getWhatsAppUrl = (phoneNumber, message = '') => {
  const formatted = formatWhatsAppNumber(phoneNumber);
  if (!formatted) return null;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${formatted}${message ? `?text=${encoded}` : ''}`;
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }
};

/**
 * Share shop URL
 * @param {object} shop - Shop object
 * @returns {Promise<void>}
 */
export const shareShop = async (shop) => {
  const url = `${window.location.origin}/${shop.slug}`;
  const title = shop.shopName;
  const text = shop.description || `Check out ${shop.shopName}`;

  // Use native share API if available (mobile)
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { success: true, method: 'native' };
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }

  // Fallback: Copy to clipboard
  const success = await copyToClipboard(url);
  return { success, method: 'clipboard', url };
};

/**
 * Format currency in Naira
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency
 */
export const formatNaira = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Calculate discount percentage
 * @param {number} originalPrice - Original price
 * @param {number} salePrice - Sale price
 * @returns {number} - Discount percentage
 */
export const calculateDiscount = (originalPrice, salePrice) => {
  if (!originalPrice || !salePrice || originalPrice <= salePrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Get template by plan
 * @param {string} plan - User plan (free, pro, premium)
 * @returns {array} - Available templates
 */
export const getAvailableTemplates = (plan) => {
  const templates = {
    free: ['classic-gradient', 'minimal-white'],
    pro: ['classic-gradient', 'minimal-white', 'modern-dark'],
    premium: ['classic-gradient', 'minimal-white', 'modern-dark', 'lifestyle-banner', 'luxury-motion']
  };
  return templates[plan] || templates.free;
};

/**
 * Smooth scroll to element
 * @param {string} elementId - Element ID to scroll to
 * @param {number} offset - Offset from top in pixels
 */
export const scrollToElement = (elementId, offset = 80) => {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

/**
 * Check if image URL is valid
 * @param {string} url - Image URL
 * @returns {Promise<boolean>} - Validity status
 */
export const isValidImageUrl = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

/**
 * Generate product message for WhatsApp
 * @param {object} product - Product object
 * @param {string} shopName - Shop name
 * @returns {string} - Formatted message
 */
export const generateProductMessage = (product, shopName) => {
  return `Hi ${shopName}, I'm interested in your *${product.name}*.\n\nPrice: ${formatNaira(product.price)}\n\nCan we discuss this?`;
};

/**
 * Truncate text
 * @param {string} text - Text to truncate
 * @param {number} length - Max length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, length = 100) => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
};
