const axios = require('axios');
const {
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY
} = require('./currency');

const API_URL = process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate.host/latest';
const CACHE_TTL_MS = Number(process.env.EXCHANGE_RATE_CACHE_TTL_MS || (6 * 60 * 60 * 1000)); // 6 hours

const FALLBACK_USD_RATES = {
  NGN: 1500,
  ZAR: 18.5,
  KES: 127,
  GHS: 14,
  EGP: 48,
  MAD: 9.9,
  UGX: 3800,
  TZS: 2600,
  ETB: 114,
  RWF: 1320,
  XOF: 600,
  SLE: 22,
  LSL: 18.5,
  LRD: 193,
  NAD: 18.5,
  BWP: 13.7,
  USD: 1
};

let cachedRates = {
  timestamp: 0,
  rates: { ...FALLBACK_USD_RATES }
};

const roundToCents = (value) => Math.round(value * 100) / 100;

const isCacheValid = () => {
  if (!cachedRates.timestamp) return false;
  return (Date.now() - cachedRates.timestamp) < CACHE_TTL_MS;
};

const fetchRates = async () => {
  try {
    const symbols = SUPPORTED_CURRENCIES.join(',');
    const response = await axios.get(API_URL, {
      params: {
        base: 'USD',
        symbols
      },
      timeout: Number(process.env.EXCHANGE_RATE_API_TIMEOUT_MS || 5000)
    });

    const rates = response?.data?.rates;
    if (!rates) {
      return cachedRates.rates;
    }

    cachedRates = {
      timestamp: Date.now(),
      rates: {
        ...FALLBACK_USD_RATES,
        ...rates
      }
    };

    return cachedRates.rates;
  } catch (error) {
    console.error('⚠️  Failed to refresh exchange rates:', error.message || error);
    return cachedRates.rates;
  }
};

const getLatestRates = async () => {
  if (isCacheValid()) {
    return cachedRates.rates;
  }
  return fetchRates();
};

const getUsdRateForCurrency = async (currency) => {
  const code = String(currency || DEFAULT_CURRENCY).toUpperCase();
  const rates = await getLatestRates();
  return rates[code] || rates[DEFAULT_CURRENCY] || 1;
};

const convertAmountToUSD = async (amount, currency) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return 0;
  }

  const code = String(currency || DEFAULT_CURRENCY).toUpperCase();
  if (code === 'USD') {
    return roundToCents(numericAmount);
  }

  const usdRate = await getUsdRateForCurrency(code);
  if (!Number.isFinite(usdRate) || usdRate <= 0) {
    return roundToCents(numericAmount);
  }

  return roundToCents(numericAmount / usdRate);
};

module.exports = {
  getLatestRates,
  convertAmountToUSD,
  getUsdRateForCurrency
};
