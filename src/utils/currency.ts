export type Currency = 'EUR' | 'GBP' | 'USD' | 'AUD';
export type Language = 'en' | 'nl' | 'es';

// Simple static rates vs EUR to keep things lightweight. Update as needed.
// 1 EUR equals the following amounts (approx):
const ratesPerEUR: Record<Currency, number> = {
  EUR: 1,
  USD: 1.09,
  GBP: 0.85,
  AUD: 1.63,
};

export function convertCurrency(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  const amountInEUR = amount / (ratesPerEUR[from] || 1);
  return amountInEUR * (ratesPerEUR[to] || 1);
}

export function languageToLocale(lang: Language): string {
  switch (lang) {
    case 'nl':
      return 'nl-NL';
    case 'es':
      return 'es-ES';
    default:
      return 'en-US';
  }
}

export function formatDisplayCurrency(amount: number, currency: Currency, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}
