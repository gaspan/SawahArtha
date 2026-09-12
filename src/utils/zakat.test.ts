/**
 * Unit tests for zakat pertanian + gacong calculation logic
 * Run: npm test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NISAB_BERAS_KG,
  ZAKAT_RATE,
  GKP_TO_GKG_RATIO,
  DEFAULT_RENDEMEN_RATIO,
  GACONG_BERAT,
  GACONG_PEMBAGIAN,
  calculateGacongWeight,
  calculateNetGKP,
  calculateGKG,
  isZakatWajib,
  calculateZakatKg,
  calculateZakatRupiah,
  getZakatSummary,
  getNisabGKG,
  setRendemenRatio,
  getRendemenRatio,
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

describe('rendemen & nisab', () => {
  const nisabDefault = getNisabGKG();

  it('nisab default = 520 kg beras ÷ rendemen 60% = 866.67 kg GKG', () => {
    closeTo(nisabDefault, 866.6666667);
    assert.equal(NISAB_BERAS_KG, 520);
    assert.equal(DEFAULT_RENDEMEN_RATIO, 0.6);
  });

  it('rendemen bisa diubah: 65% → nisab 800 kg GKG', () => {
    setRendemenRatio(0.65);
    closeTo(getRendemenRatio(), 0.65);
    closeTo(getNisabGKG(), 800);
    setRendemenRatio(0.6);
    closeTo(getNisabGKG(), nisabDefault);
  });

  it('rendemen tidak valid (0/negatif/NaN) diabaikan', () => {
    setRendemenRatio(0);
    assert.equal(getRendemenRatio(), 0.6);
    setRendemenRatio(-0.5);
    assert.equal(getRendemenRatio(), 0.6);
  });
});

describe('isZakatWajib', () => {
  it('GKG di bawah nisab → tidak wajib', () => {
    assert.equal(isZakatWajib(getNisabGKG() - 0.01), false);
  });

  it('GKG tepat di nisab → wajib', () => {
    assert.equal(isZakatWajib(getNisabGKG()), true);
  });

  it('GKG di atas nisab → wajib', () => {
    assert.equal(isZakatWajib(getNisabGKG() + 100), true);
  });
});

describe('calculateZakatKg', () => {
  it('di bawah nisab → 0', () => {
    assert.equal(calculateZakatKg(getNisabGKG() - 0.01), 0);
  });

  it('di atas nisab → 5% dari GKG', () => {
    closeTo(calculateZakatKg(900), 45);
    assert.equal(calculateZakatKg(getNisabGKG()), getNisabGKG() * ZAKAT_RATE);
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
    const s = getZakatSummary(900, 5500);
    assert.equal(s.wajib, true);
    closeTo(s.nisab, getNisabGKG());
    assert.equal(s.nisabBerasKg, NISAB_BERAS_KG);
    assert.equal(s.rendemen, DEFAULT_RENDEMEN_RATIO);
    assert.equal(s.rate, ZAKAT_RATE);
    closeTo(s.zakatKg, 45);
    closeTo(s.zakatRp, 247500);
    assert.equal(s.progressToNisab, 100);
    assert.equal(s.remainingToNisab, 0);
  });

  it('GKG di bawah nisab: tidak wajib, zakat 0, progress & sisa terhitung', () => {
    const s = getZakatSummary(500, 5500);
    assert.equal(s.wajib, false);
    assert.equal(s.zakatKg, 0);
    assert.equal(s.zakatRp, 0);
    closeTo(s.progressToNisab, (500 / getNisabGKG()) * 100);
    closeTo(s.remainingToNisab, getNisabGKG() - 500);
  });
});

describe('skenario alur lengkap (integration)', () => {
  it('GKP 1400 kg, gacong 1/6, harga Rp 5.500', () => {
    const gkp = 1400;
    const gacongType = GACONG_PEMBAGIAN;
    const gacongInput = 6;
    const price = 5500;

    const gacongWeight = calculateGacongWeight(gkp, gacongType, gacongInput);
    const netGKP = calculateNetGKP(gkp, gacongWeight);
    const gkgWeight = calculateGKG(netGKP);
    const revenue = gkgWeight * price;
    const summary = getZakatSummary(gkgWeight, price);

    closeTo(gacongWeight, 233.3333333); // 1400 / 6
    closeTo(netGKP, 1166.6666667); // 1400 - 233.33
    closeTo(gkgWeight, 933.3333333); // 1166.67 × 0.8
    closeTo(revenue, 5133333.3333); // 933.33 × 5500
    assert.equal(summary.wajib, true); // 933.33 >= 866.67
    closeTo(summary.zakatKg, 46.6666667); // 933.33 × 5%
    closeTo(summary.zakatRp, 256666.6667); // 46.67 × 5500
  });

  it('GKP 1200 kg, gacong berat 100 kg, tanpa harga → zakat Rp 0', () => {
    const gacongWeight = calculateGacongWeight(1200, GACONG_BERAT, 100);
    const netGKP = calculateNetGKP(1200, gacongWeight);
    const gkgWeight = calculateGKG(netGKP);
    const summary = getZakatSummary(gkgWeight, 0);

    assert.equal(gacongWeight, 100);
    assert.equal(netGKP, 1100);
    assert.equal(gkgWeight, 880);
    assert.equal(summary.wajib, true); // 880 >= 866.67
    closeTo(summary.zakatKg, 44); // 880 × 5%
    assert.equal(summary.zakatRp, 0); // harga belum diisi
  });

  it('batas nisab: net GKP 1083.34 kg → GKG ~866.67 kg → wajib', () => {
    const gkgWeight = calculateGKG(1083.3334);
    closeTo(gkgWeight, getNisabGKG());
    assert.equal(isZakatWajib(gkgWeight), true);
  });

  it('di bawah batas: net GKP 1083 kg → GKG 866.4 → belum wajib', () => {
    const gkgWeight = calculateGKG(1083);
    closeTo(gkgWeight, 866.4);
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
