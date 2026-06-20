/**
 * Indonesian Rupiah (IDR) currency formatting utilities
 * Uses dot (.) as thousands separator per Indonesian convention
 */

/**
 * Format a numeric value to IDR string: "Rp 150.000"
 */
export function formatIDR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }

  const absAmount = Math.abs(Math.round(amount));
  const formatted = absAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const prefix = amount < 0 ? '-' : '';

  return `${prefix}Rp ${formatted}`;
}

/**
 * Format a number with dots as thousands separator (no "Rp" prefix)
 */
export function formatNumber(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }

  const absAmount = Math.abs(Math.round(amount));
  return absAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Parse a formatted IDR string back to a raw number
 * Handles: "Rp 150.000", "150.000", "150000", "Rp150.000"
 */
export function parseIDR(formatted: string): number {
  if (!formatted) return 0;

  // Remove "Rp", spaces, and dot separators
  const cleaned = formatted
    .replace(/[Rr][Pp]\s*/g, '')
    .replace(/\./g, '')
    .replace(/\s/g, '')
    .trim();

  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format input text as user types (live formatting for TextInput)
 * Returns formatted string and raw numeric value
 */
export function formatCurrencyInput(text: string): { display: string; value: number } {
  // Strip everything except digits
  const digitsOnly = text.replace(/\D/g, '');

  if (!digitsOnly) {
    return { display: '', value: 0 };
  }

  const numericValue = parseInt(digitsOnly, 10);
  const display = numericValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return { display, value: numericValue };
}

/**
 * Format large numbers in compact form for chart labels
 * e.g., 1500000 -> "1,5jt", 500000 -> "500rb"
 */
export function formatCompact(amount: number): string {
  if (amount >= 1_000_000) {
    const jt = amount / 1_000_000;
    return `${jt % 1 === 0 ? jt.toFixed(0) : jt.toFixed(1)}jt`;
  }
  if (amount >= 1_000) {
    const rb = amount / 1_000;
    return `${rb % 1 === 0 ? rb.toFixed(0) : rb.toFixed(0)}rb`;
  }
  return amount.toString();
}
