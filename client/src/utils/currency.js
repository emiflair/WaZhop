// Currency conversion rates (base: NGN - Nigerian Naira)
// These rates should ideally be fetched from an API in production
const EXCHANGE_RATES = {
  NGN: 1,           // Nigerian Naira (base)
  USD: 0.0012,      // US Dollar
  GHS: 0.019,       // Ghanaian Cedi
  KES: 0.16,        // Kenyan Shilling
  ZAR: 0.022,       // South African Rand
  EUR: 0.0011,      // Euro
  GBP: 0.00095,     // British Pound
};

// Currency symbols
const CURRENCY_SYMBOLS = {
  NGN: '₦',
  USD: '$',
  GHS: '₵',
  KES: 'KSh',
  ZAR: 'R',
  EUR: '€',
  GBP: '£',
};

// Currency names
const CURRENCY_NAMES = {
  NGN: 'Nigerian Naira',
  USD: 'US Dollar',
  GHS: 'Ghanaian Cedi',
  KES: 'Kenyan Shilling',
  ZAR: 'South African Rand',
  EUR: 'Euro',
  GBP: 'British Pound',
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {number} Converted amount
 */
export const convertCurrency = (amount, fromCurrency = 'NGN', toCurrency = 'NGN') => {
  if (!amount || amount === 0) return 0;
  if (fromCurrency === toCurrency) return amount;

  const fromRate = EXCHANGE_RATES[fromCurrency] || EXCHANGE_RATES.NGN;
  const toRate = EXCHANGE_RATES[toCurrency] || EXCHANGE_RATES.NGN;

  // Convert to base currency (NGN) first, then to target currency
  const baseAmount = amount / fromRate;
  const convertedAmount = baseAmount * toRate;

  return convertedAmount;
};

/**
 * Format price with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {boolean} showCode - Whether to show currency code
 * @returns {string} Formatted price string
 */
export const formatPrice = (amount, currency = 'NGN', showCode = false) => {
  if (!amount || amount === 0) return `${CURRENCY_SYMBOLS[currency] || '₦'}0`;

  const symbol = CURRENCY_SYMBOLS[currency] || '₦';
  const formattedAmount = amount.toLocaleString(undefined, {
    minimumFractionDigits: currency === 'NGN' ? 0 : 2,
    maximumFractionDigits: currency === 'NGN' ? 0 : 2,
  });

  if (showCode) {
    return `${symbol}${formattedAmount} ${currency}`;
  }

  return `${symbol}${formattedAmount}`;
};

/**
 * Get currency symbol
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currency = 'NGN') => {
  return CURRENCY_SYMBOLS[currency] || '₦';
};

/**
 * Get currency name
 * @param {string} currency - Currency code
 * @returns {string} Currency name
 */
export const getCurrencyName = (currency = 'NGN') => {
  return CURRENCY_NAMES[currency] || 'Nigerian Naira';
};

/**
 * Get all supported currencies
 * @returns {Array} Array of currency objects
 */
export const getSupportedCurrencies = () => {
  return Object.keys(EXCHANGE_RATES).map(code => ({
    code,
    name: CURRENCY_NAMES[code],
    symbol: CURRENCY_SYMBOLS[code],
    rate: EXCHANGE_RATES[code],
  }));
};

/**
 * Convert product price to shop currency
 * @param {object} product - Product object
 * @param {string} shopCurrency - Shop's selected currency
 * @returns {object} Product with converted prices
 */
export const convertProductPrice = (product, shopCurrency = 'NGN') => {
  if (!product) return product;

  const productCurrency = product.currency || 'NGN';
  
  return {
    ...product,
    price: convertCurrency(product.price, productCurrency, shopCurrency),
    comparePrice: product.comparePrice 
      ? convertCurrency(product.comparePrice, productCurrency, shopCurrency)
      : null,
    displayCurrency: shopCurrency,
  };
};

export default {
  convertCurrency,
  formatPrice,
  getCurrencySymbol,
  getCurrencyName,
  getSupportedCurrencies,
  convertProductPrice,
};
