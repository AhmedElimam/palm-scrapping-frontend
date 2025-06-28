export interface CurrencyInfo {
  symbol: string;
  currency: string;
  code: string;
}

export function getCurrencyInfo(price: string): CurrencyInfo {
  if (!price) {
    return { symbol: '', currency: 'Unknown', code: 'UNK' };
  }

  if (price.includes('$') && !price.includes('C$') && !price.includes('A$')) {
    return { symbol: '$', currency: 'USD', code: 'USD' };
  }
  if (price.includes('€')) {
    return { symbol: '€', currency: 'EUR', code: 'EUR' };
  }
  if (price.includes('£')) {
    return { symbol: '£', currency: 'GBP', code: 'GBP' };
  }
  if (price.includes('¥')) {
    return { symbol: '¥', currency: 'JPY', code: 'JPY' };
  }
  if (price.includes('C$')) {
    return { symbol: 'C$', currency: 'CAD', code: 'CAD' };
  }
  if (price.includes('A$')) {
    return { symbol: 'A$', currency: 'AUD', code: 'AUD' };
  }

  const numericPrice = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'));
  if (!isNaN(numericPrice)) {
    return { symbol: '$', currency: 'USD', code: 'USD' };
  }

  return { symbol: '', currency: 'Unknown', code: 'UNK' };
}

export function formatPrice(price: string, currency: string = 'USD'): string {
  const currencyInfo = getCurrencyInfo(price);
  
  const numericPrice = parseFloat(price?.replace(/[^\d.,]/g, '').replace(',', '.'));
  
  if (isNaN(numericPrice)) {
    return price;
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyInfo.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(numericPrice);
}

export function extractNumericPrice(price: string): number {
  const numericPrice = parseFloat(price?.replace(/[^\d.,]/g, '').replace(',', '.'));
  return isNaN(numericPrice) ? 0 : numericPrice;
}

export function formatPriceWithCurrency(price: string): string {
  const currencyInfo = getCurrencyInfo(price);
  const numericPrice = extractNumericPrice(price);
  
  if (numericPrice === 0) {
    return price;
  }

  return `${currencyInfo.symbol}${numericPrice.toFixed(2)}`;
} 