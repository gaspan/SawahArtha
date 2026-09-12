/**
 * Income form GKG test cases
 * Covers resolveGKG: user-entered actual weight vs automatic estimate.
 * Run: npm test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveGKG,
  calculateGKG,
  calculateGacongWeight,
  calculateNetGKP,
  isZakatWajib,
  calculateZakatKg,
  isEstimatedGKG,
} from '../utils/zakat';
import { isValidGKG } from '../database/incomeService';

describe('resolveGKG', () => {
  it('input kosong → fallback ke estimasi, isEstimated true', () => {
    const r = resolveGKG(760, '');
    assert.strictEqual(r.value, 760);
    assert.strictEqual(r.isEstimated, true);
  });

  it('input "0" → tidak valid, fallback ke estimasi', () => {
    const r = resolveGKG(760, '0');
    assert.strictEqual(r.value, 760);
    assert.strictEqual(r.isEstimated, true);
  });

  it('input non-numerik → fallback ke estimasi', () => {
    const r = resolveGKG(760, 'abc');
    assert.strictEqual(r.value, 760);
    assert.strictEqual(r.isEstimated, true);
  });

  it('input desimal valid → nilai riil dipakai', () => {
    const r = resolveGKG(760, '912.5');
    assert.strictEqual(r.value, 912.5);
    assert.strictEqual(r.isEstimated, false);
  });

  it('input number valid → nilai riil dipakai', () => {
    const r = resolveGKG(760, 900);
    assert.strictEqual(r.value, 900);
    assert.strictEqual(r.isEstimated, false);
  });

  it('input "-50" (negatif) → fallback ke estimasi', () => {
    const r = resolveGKG(760, '-50');
    assert.strictEqual(r.value, 760);
    assert.strictEqual(r.isEstimated, true);
  });

  it('input "760.0" sama dengan estimasi → tetap dianggap riil (bukan error)', () => {
    const r = resolveGKG(760, '760.0');
    assert.strictEqual(r.value, 760);
    assert.strictEqual(r.isEstimated, false);
  });
});

describe('Alur form: estimasi vs riil', () => {
  const gkp = 1000;
  const gacong = calculateGacongWeight(gkp, 'berat', 50);
  const netGKP = calculateNetGKP(gkp, gacong);
  const estimated = calculateGKG(netGKP); // 950 × 0.8 = 760

  it('GKP 1000, gacong 50, tanpa input GKG → estimasi 760', () => {
    assert.strictEqual(estimated, 760);
    const r = resolveGKG(estimated, '');
    assert.strictEqual(r.value, 760);
    assert.strictEqual(r.isEstimated, true);
  });

  it('GKP 1000, gacong 50, input 800 → riil 800', () => {
    const r = resolveGKG(estimated, '800');
    assert.strictEqual(r.value, 800);
    assert.strictEqual(r.isEstimated, false);
  });

  it('zakat mengikuti effectiveGKG (riil)', () => {
    // estimated 760 → belum wajib (760 < 866.67)
    assert.strictEqual(isZakatWajib(760), false);
    // input riil 900 → wajib (>= 866.67), zakat 45 kg
    assert.strictEqual(calculateZakatKg(900), 45);
  });

  it('reset GKG → kembali ke estimasi', () => {
    const r1 = resolveGKG(760, '800');
    assert.strictEqual(r1.isEstimated, false);
    const r2 = resolveGKG(760, '');
    assert.strictEqual(r2.isEstimated, true);
    assert.strictEqual(r2.value, 760);
  });

  it('input GKG melebihi net GKP → tetap diterima (bisa saja kadar berbeda)', () => {
    const r = resolveGKG(760, '980');
    assert.strictEqual(r.value, 980);
    assert.strictEqual(r.isEstimated, false);
  });
});

describe('isValidGKG', () => {
  it('> 0 → valid', () => assert.strictEqual(isValidGKG(500), true));
  it('0 → invalid', () => assert.strictEqual(isValidGKG(0), false));
  it('negatif → invalid', () => assert.strictEqual(isValidGKG(-1), false));
  it('NaN → invalid', () => assert.strictEqual(isValidGKG(NaN), false));
  it('Infinity → invalid', () => assert.strictEqual(isValidGKG(Infinity), false));
  it('desimal valid → valid', () => assert.strictEqual(isValidGKG(912.5), true));
});

describe('isEstimatedGKG', () => {
  it('exact estimate → true', () => {
    assert.strictEqual(isEstimatedGKG(760, 950), true);
  });

  it('+1 kg from estimate → false', () => {
    assert.strictEqual(isEstimatedGKG(761, 950), false);
  });

  it('-0.1 kg (rounding) → masih true', () => {
    assert.strictEqual(isEstimatedGKG(759.9, 950), true);
  });

  it('net_gkp=0 → true (0 × 0.8 = 0)', () => {
    assert.strictEqual(isEstimatedGKG(0, 0), true);
  });

  it('custom tolerance 0 berhasil mendeteksi deviasi kecil', () => {
    assert.strictEqual(isEstimatedGKG(760.01, 950, 0), false);
    assert.strictEqual(isEstimatedGKG(760, 950, 0), true);
  });
});
