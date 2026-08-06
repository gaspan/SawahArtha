/**
 * Unit tests for zakat pertanian + gacong calculation logic
 * Run: npm test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NISAB_KG,
  ZAKAT_RATE,
  GKP_TO_GKG_RATIO,
  GACONG_BERAT,
  GACONG_PEMBAGIAN,
  calculateGacongWeight,
  calculateNetGKP,
  calculateGKG,
  isZakatWajib,
  calculateZakatKg,
  calculateZakatRupiah,
  getZakatSummary,
} from './zakat';

const EPSILON = 1e-4;
const closeTo = (actual: number, expected: number, eps = EPSILON) =>
  assert.ok(
    Math.abs(actual - expected) < eps,
    `expected ${actual} to be within ${eps} of ${expected}`,
  );
const closeToRupiah = (actual: number, expected: number) =>
  assert.equal(Math.round(actual), Math.round(expected));

describe('calculateGacongWeight', () => {
  it('mode berat: potongan langsung dalam kg', () => {
    assert.equal(calculateGacongWeight(1000, GACONG_BERAT, 100), 100);
  });

  it('mode berat: di-clamp agar tidak melebihi GKP', () => {
    assert.equal(calculateGacongWeight(1000, GACONG_BERAT, 1200), 1000);
  });

  it('mode berat: input 0 atau kosong berarti tidak ada gacong', () => {
    assert.equal(calculateGacongWeight(1000, GACONG_BERAT, 0), 0);
  });

  it('mode pembagian: GKP / n (contoh 1/6)', () => {
    closeTo(calculateGacongWeight(1000, GACONG_PEMBAGIAN, 6), 1000 / 6);
  });

  it('mode pembagian: n = 0 → 0 (cegah pembagian oleh nol)', () => {
    assert.equal(calculateGacongWeight(1000, GACONG_PEMBAGIAN, 0), 0);
  });

  it('GKP 0 → 0 di kedua mode', () => {
    assert.equal(calculateGacongWeight(0, GACONG_BERAT, 100), 0);
    assert.equal(calculateGacongWeight(0, GACONG_PEMBAGIAN, 6), 0);
  });
});

describe('calculateNetGKP', () => {
  it('GKP dikurangi gacong', () => {
    closeTo(calculateNetGKP(1000, 166.6666667), 833.3333333);
  });

  it('gacong >= GKP → hasil bersih 0 (tidak negatif)', () => {
    assert.equal(calculateNetGKP(1000, 1000), 0);
    assert.equal(calculateNetGKP(500, 800), 0);
  });

  it('tanpa gacong → net = gross', () => {
    assert.equal(calculateNetGKP(1000, 0), 1000);
  });
});

describe('calculateGKG', () => {
  it('GKG = net GKP × 0.8', () => {
    closeTo(calculateGKG(833.3333333), 666.6666666);
    assert.equal(calculateGKG(900), 720);
    assert.equal(calculateGKG(0), 0);
    assert.equal(calculateGKG(1000), 1000 * GKP_TO_GKG_RATIO);
  });
});

describe('isZakatWajib', () => {
  it('GKG di bawah nisab → tidak wajib', () => {
    assert.equal(isZakatWajib(NISAB_KG - 0.01), false);
  });

  it('GKG tepat di nisab → wajib', () => {
    assert.equal(isZakatWajib(NISAB_KG), true);
  });

  it('GKG di atas nisab → wajib', () => {
    assert.equal(isZakatWajib(NISAB_KG + 100), true);
  });
});

describe('calculateZakatKg', () => {
  it('di bawah nisab → 0', () => {
    assert.equal(calculateZakatKg(NISAB_KG - 0.01), 0);
  });

  it('di atas nisab → 5% dari GKG', () => {
    closeTo(calculateZakatKg(666.6666666), 666.6666666 * ZAKAT_RATE);
    assert.equal(calculateZakatKg(NISAB_KG), NISAB_KG * ZAKAT_RATE);
  });
});

describe('calculateZakatRupiah', () => {
  it('zakat kg × harga jual per kg', () => {
    closeToRupiah(calculateZakatRupiah(33.3333333, 5500), 183333);
  });

  it('harga tidak diisi (0) → 0', () => {
    assert.equal(calculateZakatRupiah(33.3333333, 0), 0);
  });

  it('harga negatif → 0', () => {
    assert.equal(calculateZakatRupiah(33.3333333, -5500), 0);
  });
});

describe('getZakatSummary', () => {
  it('GKG di atas nisab: wajib, progress 100%, sisa 0', () => {
    const s = getZakatSummary(666.6666666, 5500);
    assert.equal(s.wajib, true);
    assert.equal(s.nisab, NISAB_KG);
    assert.equal(s.rate, ZAKAT_RATE);
    closeTo(s.zakatKg, 33.3333333);
    closeTo(s.zakatRp, 183333.3333);
    assert.equal(s.progressToNisab, 100);
    assert.equal(s.remainingToNisab, 0);
  });

  it('GKG di bawah nisab: tidak wajib, zakat 0, progress & sisa terhitung', () => {
    const s = getZakatSummary(500, 5500);
    assert.equal(s.wajib, false);
    assert.equal(s.zakatKg, 0);
    assert.equal(s.zakatRp, 0);
    closeTo(s.progressToNisab, (500 / NISAB_KG) * 100);
    closeTo(s.remainingToNisab, NISAB_KG - 500);
  });
});

describe('skenario alur lengkap (integration)', () => {
  it('GKP 1000 kg, gacong 1/6, harga Rp 5.500', () => {
    const gkp = 1000;
    const gacongType = GACONG_PEMBAGIAN;
    const gacongInput = 6;
    const price = 5500;

    const gacongWeight = calculateGacongWeight(gkp, gacongType, gacongInput);
    const netGKP = calculateNetGKP(gkp, gacongWeight);
    const gkgWeight = calculateGKG(netGKP);
    const revenue = gkgWeight * price;
    const summary = getZakatSummary(gkgWeight, price);

    closeTo(gacongWeight, 166.6666667); // 1000 / 6
    closeTo(netGKP, 833.3333333); // 1000 - 166.67
    closeTo(gkgWeight, 666.6666666); // 833.33 × 0.8
    closeTo(revenue, 3666666.6666); // 666.67 × 5500
    assert.equal(summary.wajib, true); // 666.67 >= 653
    closeTo(summary.zakatKg, 33.3333333); // 666.67 × 5%
    closeTo(summary.zakatRp, 183333.3333); // 33.33 × 5500
  });

  it('GKP 1000 kg, gacong berat 100 kg, tanpa harga → zakat Rp 0', () => {
    const gacongWeight = calculateGacongWeight(1000, GACONG_BERAT, 100);
    const netGKP = calculateNetGKP(1000, gacongWeight);
    const gkgWeight = calculateGKG(netGKP);
    const summary = getZakatSummary(gkgWeight, 0);

    assert.equal(gacongWeight, 100);
    assert.equal(netGKP, 900);
    assert.equal(gkgWeight, 720);
    assert.equal(summary.wajib, true); // 720 >= 653
    closeTo(summary.zakatKg, 36); // 720 × 5%
    assert.equal(summary.zakatRp, 0); // harga belum diisi
  });

  it('batas nisab: net GKP 816.25 kg → GKG tepat 653 kg → wajib', () => {
    const gkgWeight = calculateGKG(816.25);
    closeTo(gkgWeight, 653);
    assert.equal(isZakatWajib(gkgWeight), true);
  });

  it('di bawah batas: net GKP 816 kg → GKG 652.8 → belum wajib', () => {
    const gkgWeight = calculateGKG(816);
    closeTo(gkgWeight, 652.8);
    assert.equal(isZakatWajib(gkgWeight), false);
  });

  it('tanpa gacong: GKP 800 kg → GKG 640 kg → belum wajib', () => {
    const gacongWeight = calculateGacongWeight(800, GACONG_BERAT, 0);
    const netGKP = calculateNetGKP(800, gacongWeight);
    const gkgWeight = calculateGKG(netGKP);
    assert.equal(gkgWeight, 640);
    assert.equal(isZakatWajib(gkgWeight), false);
    assert.equal(calculateZakatKg(gkgWeight), 0);
  });
});
