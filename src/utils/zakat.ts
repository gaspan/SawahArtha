/**
 * Zakat Pertanian Calculator
 * 
 * Based on Indonesian rice farming standards:
 * - GKP to GKG conversion: 85% (standard moisture reduction)
 * - Nisab: 653 kg GKG (Gabah Kering Giling)
 * - Rate: 5% (for irrigated/artificial irrigation farming with high operational costs)
 */

export const NISAB_KG = 653;
export const ZAKAT_RATE = 0.05;
export const GKP_TO_GKG_RATIO = 0.85;

/**
 * Convert GKP (Gabah Kering Panen) to GKG (Gabah Kering Giling)
 */
export function calculateGKG(gkpWeight: number): number {
  return gkpWeight * GKP_TO_GKG_RATIO;
}

/**
 * Check if zakat is obligatory based on total GKG
 */
export function isZakatWajib(totalGKG: number): boolean {
  return totalGKG >= NISAB_KG;
}

/**
 * Calculate zakat amount in kilograms
 */
export function calculateZakatKg(totalGKG: number): number {
  if (!isZakatWajib(totalGKG)) return 0;
  return totalGKG * ZAKAT_RATE;
}

/**
 * Calculate zakat amount in Rupiah
 * Uses the provided price per kg (selling price of grain)
 */
export function calculateZakatRupiah(zakatKg: number, pricePerKg: number): number {
  if (!pricePerKg || pricePerKg <= 0) return 0;
  return zakatKg * pricePerKg;
}

/**
 * Get comprehensive zakat calculation result
 */
export function getZakatSummary(totalGKG: number, avgPricePerKg: number) {
  const wajib = isZakatWajib(totalGKG);
  const zakatKg = calculateZakatKg(totalGKG);
  const zakatRp = calculateZakatRupiah(zakatKg, avgPricePerKg);
  const progressToNisab = Math.min((totalGKG / NISAB_KG) * 100, 100);

  return {
    wajib,
    totalGKG,
    nisab: NISAB_KG,
    rate: ZAKAT_RATE,
    zakatKg,
    zakatRp,
    progressToNisab,
    remainingToNisab: Math.max(NISAB_KG - totalGKG, 0),
  };
}
