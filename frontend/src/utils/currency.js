const currencyFormats = {
  USD: { locale: 'en-US', symbol: '$', symbolPosition: 'prefix' },
  EUR: { locale: 'de-DE', symbol: '€', symbolPosition: 'prefix' },
  GBP: { locale: 'en-GB', symbol: '£', symbolPosition: 'prefix' },
  MAD: { locale: 'fr-FR', symbol: 'د.م', symbolPosition: 'prefix' }
};

export const formatCurrency = (value = 0, currency = 'USD') => {
  const amount = Number(value) || 0;
  const config = currencyFormats[currency] || currencyFormats.USD;
  const formattedNumber = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);

  return config.symbolPosition === 'prefix'
    ? `${config.symbol}${formattedNumber}`
    : `${formattedNumber}${config.symbol}`;
};

export const getCurrencySymbol = (currency = 'USD') => {
  return currencyFormats[currency]?.symbol || currencyFormats.USD.symbol;
};
