const DEFAULT_COUNTRY_CODE = 'NG';
const DEFAULT_CURRENCY = 'NGN';

// Country metadata for supported African markets
const COUNTRY_CURRENCY_MAP = {
  NG: { country: 'Nigeria', currency: 'NGN' },
  ZA: { country: 'South Africa', currency: 'ZAR' },
  KE: { country: 'Kenya', currency: 'KES' },
  GH: { country: 'Ghana', currency: 'GHS' },
  EG: { country: 'Egypt', currency: 'EGP' },
  MA: { country: 'Morocco', currency: 'MAD' },
  UG: { country: 'Uganda', currency: 'UGX' },
  TZ: { country: 'Tanzania', currency: 'TZS' },
  ET: { country: 'Ethiopia', currency: 'ETB' },
  RW: { country: 'Rwanda', currency: 'RWF' },
  SN: { country: 'Senegal', currency: 'XOF' },
  CI: { country: "Cote d'Ivoire", currency: 'XOF' },
  SL: { country: 'Sierra Leone', currency: 'SLE' },
  ML: { country: 'Mali', currency: 'XOF' },
  NE: { country: 'Niger', currency: 'XOF' },
  BJ: { country: 'Benin', currency: 'XOF' },
  TG: { country: 'Togo', currency: 'XOF' },
  LR: { country: 'Liberia', currency: 'LRD' },
  NA: { country: 'Namibia', currency: 'NAD' },
  BW: { country: 'Botswana', currency: 'BWP' },
  LS: { country: 'Lesotho', currency: 'LSL' }
};

const COUNTRY_NAME_LOOKUP = Object.entries(COUNTRY_CURRENCY_MAP).reduce((acc, [code, meta]) => {
  acc[meta.country.toLowerCase()] = code;
  return acc;
}, {
  "cote d'ivoire": 'CI',
  "cote divoire": 'CI',
  "cote d ivoire": 'CI',
  "ivory coast": 'CI'
});

// Currency display metadata
const CURRENCY_METADATA = {
  NGN: { symbol: '₦', decimals: 0, name: 'Nigerian Naira', format: 'prefix-symbol' },
  ZAR: { symbol: 'R', decimals: 2, name: 'South African Rand', format: 'prefix-symbol' },
  KES: { symbol: 'KES', decimals: 0, name: 'Kenyan Shilling', format: 'code-prefix' },
  GHS: { symbol: 'GHS', decimals: 0, name: 'Ghanaian Cedi', format: 'code-prefix' },
  EGP: { symbol: 'E£', decimals: 2, name: 'Egyptian Pound', format: 'prefix-symbol' },
  MAD: { symbol: 'MAD', decimals: 2, name: 'Moroccan Dirham', format: 'code-prefix' },
  UGX: { symbol: 'UGX', decimals: 0, name: 'Ugandan Shilling', format: 'code-prefix' },
  TZS: { symbol: 'TZS', decimals: 0, name: 'Tanzanian Shilling', format: 'code-prefix' },
  ETB: { symbol: 'Br', decimals: 2, name: 'Ethiopian Birr', format: 'prefix-symbol' },
  RWF: { symbol: 'RWF', decimals: 0, name: 'Rwandan Franc', format: 'code-prefix' },
  XOF: { symbol: 'XOF', decimals: 0, name: 'West African CFA Franc', format: 'code-prefix' },
  SLE: { symbol: 'SLE', decimals: 2, name: 'Sierra Leonean Leone', format: 'code-prefix' },
  LSL: { symbol: 'LSL', decimals: 2, name: 'Lesotho Loti', format: 'code-prefix' },
  LRD: { symbol: 'L$', decimals: 2, name: 'Liberian Dollar', format: 'prefix-symbol' },
  NAD: { symbol: 'N$', decimals: 2, name: 'Namibian Dollar', format: 'prefix-symbol' },
  BWP: { symbol: 'P', decimals: 2, name: 'Botswana Pula', format: 'prefix-symbol' },
  USD: { symbol: '$', decimals: 2, name: 'US Dollar', format: 'prefix-symbol', alwaysShowCode: true }
};

const SUPPORTED_COUNTRY_CODES = Object.keys(COUNTRY_CURRENCY_MAP);
const SUPPORTED_CURRENCIES = Array.from(new Set([
  ...SUPPORTED_COUNTRY_CODES.map((code) => COUNTRY_CURRENCY_MAP[code].currency),
  'USD'
]));

const isSupportedCurrency = (currency) => SUPPORTED_CURRENCIES.includes(String(currency || '').toUpperCase());

const resolveCountryCode = (value) => {
  if (!value) return DEFAULT_COUNTRY_CODE;
  const trimmed = String(value).trim();
  if (!trimmed) return DEFAULT_COUNTRY_CODE;

  const upper = trimmed.toUpperCase();
  if (COUNTRY_CURRENCY_MAP[upper]) {
    return upper;
  }

  const normalized = trimmed.toLowerCase();
  if (COUNTRY_NAME_LOOKUP[normalized]) {
    return COUNTRY_NAME_LOOKUP[normalized];
  }

  return DEFAULT_COUNTRY_CODE;
};

const getCountryMeta = (countryCode) => {
  const code = resolveCountryCode(countryCode);
  return COUNTRY_CURRENCY_MAP[code] || COUNTRY_CURRENCY_MAP[DEFAULT_COUNTRY_CODE];
};

const getCurrencyMeta = (currencyCode) => {
  const code = String(currencyCode || DEFAULT_CURRENCY).toUpperCase();
  return CURRENCY_METADATA[code] || CURRENCY_METADATA[DEFAULT_CURRENCY];
};

const formatMoney = (amount, currencyCode = DEFAULT_CURRENCY, {
  includeCode = false,
  minimumFractionDigits,
  maximumFractionDigits
} = {}) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return `${currencyCode} 0`;
  }

  const code = String(currencyCode || DEFAULT_CURRENCY).toUpperCase();
  const meta = getCurrencyMeta(code);
  const minDigits = minimumFractionDigits ?? meta.decimals;
  const maxDigits = maximumFractionDigits ?? meta.decimals;
  const formattedNumber = numericAmount.toLocaleString('en-US', {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits
  });

  if (meta.format === 'prefix-symbol') {
    const suffix = includeCode || meta.alwaysShowCode ? ` ${code}` : '';
    return `${meta.symbol}${formattedNumber}${suffix}`;
  }

  // Default to code prefix
  return `${code} ${formattedNumber}`;
};

const formatUsdApprox = (amount) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return null;
  }
  return `≈ ${formatMoney(numericAmount, 'USD', {
    includeCode: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

module.exports = {
  COUNTRY_CURRENCY_MAP,
  CURRENCY_METADATA,
  DEFAULT_COUNTRY_CODE,
  DEFAULT_CURRENCY,
  SUPPORTED_COUNTRY_CODES,
  SUPPORTED_CURRENCIES,
  getCountryMeta,
  getCurrencyMeta,
  resolveCountryCode,
  formatMoney,
  formatUsdApprox,
  isSupportedCurrency
};
