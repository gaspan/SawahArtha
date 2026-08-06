/**
 * Zakat Pertanian Calculator
 *
 * Based on Indonesian rice farming standards:
 * - Net GKP to GKG conversion: 80% (standard moisture reduction)
 * - Nisab: 653 kg GKG (Gabah Kering Giling)
 * - Rate: 5% (for irrigated/artificial irrigation farming with high operational costs)
 * - Gacong (harvest fee) is deducted from gross GKP before GKG conversion
 */

export const NISAB_KG = 653;
export const ZAKAT_RATE = 0.05;
export const GKP_TO_GKG_RATIO = 0.8;

export const GACONG_BERAT = 'berat';
export const GACONG_PEMBAGIAN = 'pembagian';
export type GacongType = typeof GACONG_BERAT | typeof GACONG_PEMBAGIAN;

/**
 * Calculate gacong (harvest fee) deduction weight in kg.
 * - 'berat': direct kg deduction (gacongInput = kg)
 * - 'pembagian': fraction deduction (gacongInput = denominator n, e.g. 6 for 1/6)
 */
export function calculateGacongWeight(
  gkpWeight: number,
  gacongType: GacongType,
  gacongInput: number,
): number {
  if (gacongInput <= 0 || gkpWeight <= 0) return 0;
  if (gacongType === GACONG_BERAT) return Math.min(gacongInput, gkpWeight);
  return gkpWeight / gacongInput;
}

/**
 * Net GKP after gacong deduction (what the farmer actually keeps)
 */
export function calculateNetGKP(gkpWeight: number, gacongWeight: number): number {
  return Math.max(gkpWeight - gacongWeight, 0);
}

/**
 * Convert net GKP (Gabah Kering Panen after gacong) to GKG (Gabah Kering Giling)
 */
export function calculateGKG(netGkp: number): number {
  return netGkp * GKP_TO_GKG_RATIO;
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
