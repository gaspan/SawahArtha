/**
 * Number format preference (Tier 4C)
 * Singleton so existing call sites of formatIDR/formatNumber keep working.
 */

let thousandsSeparator: '.' | ',' = '.';

export function setThousandsSeparator(sep: '.' | ','): void {
  thousandsSeparator = sep;
}

export function getThousandsSeparator(): '.' | ',' {
  return thousandsSeparator;
}

export function applyThousandsSeparator(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
}
