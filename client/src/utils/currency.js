export const DEFAULT_CURRENCY = 'NGN';

export const CURRENCY_METADATA = {
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

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_METADATA);

const ensureNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const getCurrencyMeta = (currency = DEFAULT_CURRENCY) => {
  const code = String(currency || DEFAULT_CURRENCY).toUpperCase();
  return CURRENCY_METADATA[code] || CURRENCY_METADATA[DEFAULT_CURRENCY];
};

export const isSupportedCurrency = (currency) => {
  if (!currency) return false;
  return SUPPORTED_CURRENCIES.includes(String(currency).toUpperCase());
};

export const formatPrice = (
  amount,
  currency = DEFAULT_CURRENCY,
  {
    includeCode = false,
    minimumFractionDigits,
    maximumFractionDigits
  } = {}
) => {
  const numericAmount = ensureNumber(amount);
  const code = String(currency || DEFAULT_CURRENCY).toUpperCase();
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

  return `${code} ${formattedNumber}`;
};

export const formatApproxUSD = (amount) => {
  const numericAmount = ensureNumber(amount);
  if (numericAmount <= 0) {
    return null;
  }
  return `≈ ${formatPrice(numericAmount, 'USD', {
    includeCode: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const buildPriceDisplay = ({ price, currency, priceUSD }) => {
  const code = isSupportedCurrency(currency) ? currency : DEFAULT_CURRENCY;
  const primary = formatPrice(price, code);
  const secondary = formatApproxUSD(priceUSD);
  return {
    primary,
    secondary,
    combined: secondary ? `${primary} (${secondary})` : primary
  };
};

export const getCurrencyName = (currency = DEFAULT_CURRENCY) => getCurrencyMeta(currency).name;

export const getCurrencyOptions = () => SUPPORTED_CURRENCIES.map((code) => ({
  code,
  name: getCurrencyName(code)
}));

export default {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  CURRENCY_METADATA,
  getCurrencyMeta,
  isSupportedCurrency,
  formatPrice,
  formatApproxUSD,
  buildPriceDisplay,
  getCurrencyName,
  getCurrencyOptions
};
