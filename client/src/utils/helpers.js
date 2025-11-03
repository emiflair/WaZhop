// Client-side helper utilities for WaShop

/**
 * Format phone number for WhatsApp
 * @param {string} phone - Phone number in various formats
 * @returns {string} - Formatted phone number (e.g., "2348012345678")
 */
export const formatWhatsAppNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present
  if (cleaned.startsWith('0')) {
    cleaned = '234' + cleaned.substring(1);
  } else if (!cleaned.startsWith('234')) {
    cleaned = '234' + cleaned;
  }
  
  return cleaned;
};

/**
 * Generate WhatsApp chat URL
 * @param {string} phoneNumber - WhatsApp number
 * @param {string} message - Pre-filled message
 * @returns {string} - WhatsApp URL
 */
export const getWhatsAppUrl = (phoneNumber, message = '') => {
  const formatted = formatWhatsAppNumber(phoneNumber);
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
