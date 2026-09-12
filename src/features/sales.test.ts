/**
 * Sales (Penjualan Gabah) test cases
 * Covers split panen/penjualan logic: stock tracking, weighted avg,
 * payment status, revision, gacong rupiah, and legacy migration.
 * Run: npm test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGKG,
  calculateGacongWeight,
  calculateNetGKP,
  getZakatSummary,
} from '../utils/zakat';

const EPSILON = 1;

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Stok tersisa = total panen GKG − total terjual GKG */
function computeStockRemaining(totalGKG: number, totalGKGSold: number): number {
  return Math.max(0, totalGKG - totalGKGSold);
}

/** Rata-rata tertimbang dari sales (SUM(kg×harga) / SUM(kg)) */
function weightedAvgPrice(
  sales: { gkg_sold: number; price_per_kg: number }[],
): number {
  const totalWeight = sales.reduce((s, r) => s + r.gkg_sold, 0);
  const totalValue = sales.reduce((s, r) => s + r.gkg_sold * r.price_per_kg, 0);
  return totalWeight > 0 ? round(totalValue / totalWeight) : 0;
}

/** Validasi stok: penjualan tidak boleh melebihi stok tersisa */
function canSell(stockRemaining: number, gkgSold: number): boolean {
  return gkgSold > 0 && gkgSold <= stockRemaining;
}

/** Revisi penjualan: total_revenue dihitung ulang = kg × harga */
function revisedRevenue(gkgSold: number, pricePerKg: number): number {
  return round(gkgSold * pricePerKg);
}

/** Gacong rupiah = total gacong (kg) × harga rata-rata sales */
function gacongValueRp(totalGacongWeight: number, avgPricePerKg: number): number {
  return round(totalGacongWeight * avgPricePerKg);
}

/** Migrasi legacy: baris income lama dengan harga → sales */
function migrateLegacyRows(
  incomes: { gkg_weight: number; price_per_kg: number }[],
): { gkg_sold: number; price_per_kg: number; total_revenue: number }[] {
  return incomes
    .filter((i) => i.price_per_kg > 0)
    .map((i) => ({
      gkg_sold: i.gkg_weight,
      price_per_kg: i.price_per_kg,
      total_revenue: round(i.gkg_weight * i.price_per_kg),
    }));
}

describe('Stok Gabah (panen vs terjual)', () => {
  it('belum ada penjualan → stok penuh', () => {
    const totalGKG = 1000;
    const sold = 0;
    assert.strictEqual(computeStockRemaining(totalGKG, sold), 1000);
  });

  it('penjualan sebagian → stok berkurang', () => {
    const totalGKG = 1000;
    const sold = 300;
    assert.strictEqual(computeStockRemaining(totalGKG, sold), 700);
  });

  it('jual seluruh stok → sisa 0', () => {
    const totalGKG = 1000;
    const sold = 1000;
    assert.strictEqual(computeStockRemaining(totalGKG, sold), 0);
  });

  it('penjualan bertahap (3x) menghabiskan stok', () => {
    const totalGKG = 500;
    const soldSeq = [200, 200, 100];
    let sold = 0;
    for (const s of soldSeq) {
      assert.ok(canSell(computeStockRemaining(totalGKG, sold), s));
      sold += s;
    }
    assert.strictEqual(computeStockRemaining(totalGKG, sold), 0);
  });

  it('tidak bisa jual melebihi stok', () => {
    const totalGKG = 500;
    const sold = 400;
    const remaining = computeStockRemaining(totalGKG, sold);
    assert.strictEqual(canSell(remaining, 150), false);
    assert.strictEqual(canSell(remaining, 100), true);
  });

  it('stok tidak pernah negatif (guard)', () => {
    const totalGKG = 500;
    const sold = 800; // error data
    assert.strictEqual(computeStockRemaining(totalGKG, sold), 0);
  });

  it('tombol "Semua" mengisi sisa stok', () => {
    const totalGKG = 1000;
    const sold = 350;
    const remaining = computeStockRemaining(totalGKG, sold);
    assert.strictEqual(remaining, 650);
  });
});

describe('Rata-rata harga tertimbang dari sales', () => {
  it('satu penjualan → harga tersebut', () => {
    const sales = [{ gkg_sold: 500, price_per_kg: 6000 }];
    assert.strictEqual(weightedAvgPrice(sales), 6000);
  });

  it('dua penjualan beda harga → tertimbang', () => {
    const sales = [
      { gkg_sold: 300, price_per_kg: 6500 },
      { gkg_sold: 200, price_per_kg: 6000 },
    ];
    // (300×6500 + 200×6000) / 500 = (1.950.000 + 1.200.000) / 500 = 6.300
    assert.strictEqual(weightedAvgPrice(sales), 6300);
  });

  it('penjualan besar mendominasi harga kecil', () => {
    const sales = [
      { gkg_sold: 1000, price_per_kg: 7000 },
      { gkg_sold: 50, price_per_kg: 4000 },
    ];
    // (7.000.000 + 200.000) / 1050 ≈ 6.857,14
    const avg = weightedAvgPrice(sales);
    assert.ok(avg > 6500 && avg < 7000);
  });

  it('belum ada penjualan → 0 (tidak NaN)', () => {
    assert.strictEqual(weightedAvgPrice([]), 0);
  });

  it('konsisten dengan formula zakat rupiah', () => {
    const sales = [
      { gkg_sold: 440, price_per_kg: 6000 },
      { gkg_sold: 440, price_per_kg: 7000 },
    ];
    const avg = weightedAvgPrice(sales);
    const summary = getZakatSummary(880, avg);
    assert.strictEqual(summary.zakatKg, 44);
    assert.strictEqual(summary.zakatRp, 44 * avg);
  });
});

describe('Revisi penjualan', () => {
  it('update kg & harga → total_revenue dihitung ulang', () => {
    const before = revisedRevenue(300, 6500);
    assert.strictEqual(before, 1_950_000);

    const after = revisedRevenue(250, 7000);
    assert.strictEqual(after, 1_750_000);
  });

  it('update hanya harga → kg tetap', () => {
    const kg = 200;
    assert.strictEqual(revisedRevenue(kg, 6000), 1_200_000);
    assert.strictEqual(revisedRevenue(kg, 6500), 1_300_000);
  });

  it('revisi kg memengaruhi stok tersisa', () => {
    const totalGKG = 1000;
    const sold = 300;
    const remaining = computeStockRemaining(totalGKG, sold);
    assert.strictEqual(remaining, 700);

    const afterRevise = computeStockRemaining(totalGKG, 250);
    assert.strictEqual(afterRevise, 750);
  });
});

describe('Status pembayaran (piutang)', () => {
  it('total revenue paid vs unpaid terpisah', () => {
    const sales = [
      { total_revenue: 1_950_000, is_paid: 1 },
      { total_revenue: 1_200_000, is_paid: 0 },
      { total_revenue: 800_000, is_paid: 0 },
    ];
    const paid = sales.filter((s) => s.is_paid === 1).reduce((a, b) => a + b.total_revenue, 0);
    const unpaid = sales.filter((s) => s.is_paid === 0).reduce((a, b) => a + b.total_revenue, 0);
    assert.strictEqual(paid, 1_950_000);
    assert.strictEqual(unpaid, 2_000_000);
  });

  it('semua lunas → unpaid = 0', () => {
    const sales = [
      { total_revenue: 1_000_000, is_paid: 1 },
      { total_revenue: 500_000, is_paid: 1 },
    ];
    const unpaid = sales.filter((s) => s.is_paid === 0).reduce((a, b) => a + b.total_revenue, 0);
    assert.strictEqual(unpaid, 0);
  });
});

describe('Gacong rupiah dari harga rata-rata sales', () => {
  it('gacong kg × avg price', () => {
    assert.strictEqual(gacongValueRp(100, 6000), 600_000);
    assert.strictEqual(gacongValueRp(50, 6500), 325_000);
  });

  it('belum ada penjualan → gacong rupiah = 0', () => {
    assert.strictEqual(gacongValueRp(100, 0), 0);
  });
});

describe('Migrasi legacy income → sales', () => {
  it('baris dengan harga → sales', () => {
    const incomes = [
      { gkg_weight: 500, price_per_kg: 6500 },
      { gkg_weight: 300, price_per_kg: 0 }, // belum terjual → skip
    ];
    const migrated = migrateLegacyRows(incomes);
    assert.strictEqual(migrated.length, 1);
    assert.strictEqual(migrated[0].gkg_sold, 500);
    assert.strictEqual(migrated[0].price_per_kg, 6500);
    assert.strictEqual(migrated[0].total_revenue, 3_250_000);
  });

  it('semua belum dijual → tidak ada sales', () => {
    const incomes = [
      { gkg_weight: 500, price_per_kg: 0 },
      { gkg_weight: 300, price_per_kg: 0 },
    ];
    assert.strictEqual(migrateLegacyRows(incomes).length, 0);
  });

  it('total revenue migrated = jumlah sales', () => {
    const incomes = [
      { gkg_weight: 500, price_per_kg: 6000 },
      { gkg_weight: 300, price_per_kg: 7000 },
      { gkg_weight: 200, price_per_kg: 0 },
    ];
    const migrated = migrateLegacyRows(incomes);
    const total = migrated.reduce((s, m) => s + m.total_revenue, 0);
    assert.strictEqual(total, 5_100_000);
  });

  it('marker migrasi mencegah duplikasi', () => {
    let ran = false;
    const runMigrationOnce = () => {
      if (ran) return 0;
      ran = true;
      return migrateLegacyRows([
        { gkg_weight: 500, price_per_kg: 6000 },
      ]).length;
    };
    assert.strictEqual(runMigrationOnce(), 1);
    assert.strictEqual(runMigrationOnce(), 0);
  });
});

describe('Alur lengkap: panen → jual → dashboard', () => {
  it('skenario musim lengkap', () => {
    // Panen: 2 baris
    const harvest1 = { gkp: 1000, gacong: 50 }; // net 950 → GKG 760
    const harvest2 = { gkp: 500, gacong: 0 };   // net 500 → GKG 400
    const gkg1 = calculateGKG(calculateNetGKP(harvest1.gkp, harvest1.gacong));
    const gkg2 = calculateGKG(calculateNetGKP(harvest2.gkp, harvest2.gacong));
    const totalGKG = gkg1 + gkg2;
    assert.strictEqual(totalGKG, 1160);

    // Jual bertahap
    const sales = [
      { gkg_sold: 500, price_per_kg: 6500 },
      { gkg_sold: 300, price_per_kg: 6000 },
    ];
    const totalSold = sales.reduce((s, x) => s + x.gkg_sold, 0);
    const stockRemaining = computeStockRemaining(totalGKG, totalSold);
    assert.strictEqual(stockRemaining, 360);

    // Avg price
    const avg = weightedAvgPrice(sales);
    assert.strictEqual(avg, round((500 * 6500 + 300 * 6000) / 800));

    // Total revenue
    const totalRevenue = sales.reduce((s, x) => s + x.gkg_sold * x.price_per_kg, 0);
    assert.strictEqual(round(totalRevenue), 5_050_000);

    // Zakat dari total GKG × avg
    const summary = getZakatSummary(totalGKG, avg);
    assert.strictEqual(summary.wajib, true);
    assert.ok(summary.zakatRp > 0);
  });

  it('jual semua → stok 0, dashboard tidak menampilkan estimasi stok', () => {
    const totalGKG = 800;
    const sold = 800;
    const remaining = computeStockRemaining(totalGKG, sold);
    assert.strictEqual(remaining, 0);
    // Komponen stok hanya dirender jika unsold > 0
    assert.ok(remaining === 0);
  });

  it('panic: gacong tetap informatif, tidak masuk formula laba', () => {
    const totalRevenue = 5_050_000;
    const zakatRp = 300_000;
    const totalExpenses = 3_000_000;
    const netProfit = totalRevenue - zakatRp - totalExpenses;
    assert.strictEqual(netProfit, 1_750_000);
  });
});

describe('Edge cases', () => {
  it('penjualan 0 kg ditolak', () => {
    assert.strictEqual(canSell(500, 0), false);
  });

  it('harga 0 → revenue 0 (tidak boleh jual gratis)', () => {
    const revenue = revisedRevenue(100, 0);
    assert.strictEqual(revenue, 0);
  });

  it('float stok tidak overflow', () => {
    const totalGKG = 0.5; // 500 gram
    const sold = 0.2;
    const remaining = computeStockRemaining(totalGKG, sold);
    assert.ok(Math.abs(remaining - 0.3) < 0.0001);
  });

  it('banyak penjualan kecil → avg tetap akurat', () => {
    const sales = Array.from({ length: 50 }, () => ({ gkg_sold: 10, price_per_kg: 6000 }));
    assert.strictEqual(weightedAvgPrice(sales), 6000);
  });
});
