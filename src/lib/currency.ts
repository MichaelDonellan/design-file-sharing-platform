// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
};

/**
 * Get currency symbol for the given currency code
 * @param code Currency code (e.g., 'USD', 'EUR')
 * @returns Currency symbol or the code itself if not found
 */
export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || code;
}
