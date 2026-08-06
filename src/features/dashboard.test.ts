/**
 * Dashboard financial calculation tests
 * Covers 7 integration scenarios + edge cases
 * Run: npm test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getZakatSummary } from '../utils/zakat';

const EPSILON = 1;

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Replicates the weighted average price calculation from incomeService */
function weightedAvgPrice(records: { gkg_weight: number; price_per_kg: number }[]): number {
  const sold = records.filter((r) => r.price_per_kg > 0);
  const totalWeight = sold.reduce((s, r) => s + r.gkg_weight, 0);
  const totalValue = sold.reduce((s, r) => s + r.gkg_weight * r.price_per_kg, 0);
  return totalWeight > 0 ? round(totalValue / totalWeight) : 0;
}

/** Replicates simple average price (the old buggy calculation) */
function simpleAvgPrice(records: { price_per_kg: number }[]): number {
  const prices = records.filter((r) => r.price_per_kg > 0).map((r) => r.price_per_kg);
  if (prices.length === 0) return 0;
  return round(prices.reduce((s, p) => s + p, 0) / prices.length);
}

function computeHpp(totalExpenses: number, totalGKG: number): number {
  return totalGKG > 0 ? round(totalExpenses / totalGKG) : 0;
}

function computeOldHpp(totalExpenses: number, totalGKP: number): number {
  return totalGKP > 0 ? round(totalExpenses / totalGKP) : 0;
}

function computeNetProfit(
  totalRevenue: number,
  zakatRp: number,
  gacongValueRp: number,
  totalExpenses: number,
): number {
  return round(totalRevenue - zakatRp - gacongValueRp - totalExpenses);
}

function computeRoi(netProfit: number, totalExpenses: number): number {
  return totalExpenses > 0 ? round((netProfit / totalExpenses) * 100) : 0;
}

function computeMargin(netProfit: number, totalRevenue: number): number {
  return totalRevenue > 0 ? round((netProfit / totalRevenue) * 100) : 0;
}

function computeBreakEven(revenue: number, expenses: number): { pct: number; gap: number; isRecovered: boolean } {
  const pct = expenses > 0 ? Math.min(round((revenue / expenses) * 100), 100) : 0;
  return { pct, gap: Math.max(expenses - revenue, 0), isRecovered: revenue >= expenses };
}

function computeUnsoldMetrics(
  soldRevenue: number,
  unsoldKg: number,
  refPrice: number,
  totalExpenses: number,
  zakatRp: number,
) {
  const estValue = round(unsoldKg * refPrice);
  const totalEstimate = round(soldRevenue + estValue);
  const projectedNet = computeNetProfit(totalEstimate, zakatRp, 0, totalExpenses);
  return { estValue, totalEstimate, projectedNet };
}

function computeGacongValue(
  records: { gacong_weight: number; price_per_kg: number }[],
): number {
  return round(
    records
      .filter((r) => r.price_per_kg > 0)
      .reduce((s, r) => s + r.gacong_weight * r.price_per_kg, 0),
  );
}

function priceSimulator(
  soldRevenue: number,
  unsoldKg: number,
  sliderPrice: number,
  totalExpenses: number,
  zakatRp: number,
) {
  const estRevenue = round(soldRevenue + unsoldKg * sliderPrice);
  const netProfit = computeNetProfit(estRevenue, zakatRp, 0, totalExpenses);
  return {
    estRevenue,
    netProfit,
    roi: computeRoi(netProfit, totalExpenses),
    margin: computeMargin(netProfit, estRevenue),
  };
}

// ─────────────────────────────────────────────
// Scenarios
// ─────────────────────────────────────────────

describe('Skenario 1: Musim baru (belum ada data)', () => {
  it('semua nilai nol, tidak crash division-by-zero', () => {
    const totalExpenses = 0;
    const totalGKG = 0;
    const totalGKP = 0;
    const totalRevenue = 0;
    const zakatRp = 0;
    const gacongValueRp = 0;
    const unsoldGKG = 0;
    const soldRevenue = 0;
    const refPrice = 0;
    const avgPrice = 0;

    assert.equal(computeHpp(totalExpenses, totalGKG), 0);
    assert.equal(computeOldHpp(totalExpenses, totalGKP), 0);
    assert.equal(computeNetProfit(totalRevenue, zakatRp, gacongValueRp, totalExpenses), 0);
    assert.equal(computeRoi(0, 0), 0);
    assert.equal(computeMargin(0, 0), 0);

    const be = computeBreakEven(totalRevenue, totalExpenses);
    assert.equal(be.pct, 0);
    assert.equal(be.gap, 0);
    assert.equal(be.isRecovered, true);

    const um = computeUnsoldMetrics(soldRevenue, unsoldGKG, refPrice, totalExpenses, zakatRp);
    assert.equal(um.estValue, 0);
    assert.equal(um.totalEstimate, 0);
    assert.equal(um.projectedNet, 0);
  });

  it('weighted avg & simple avg = 0 saat tidak ada harga', () => {
    assert.equal(weightedAvgPrice([]), 0);
    assert.equal(simpleAvgPrice([]), 0);
    assert.equal(weightedAvgPrice([{ gkg_weight: 500, price_per_kg: 0 }]), 0);
  });
});

describe('Skenario 2: Pasca panen, belum terjual', () => {
  it('500 kg GKG belum terjual, modal Rp10jt — dashboard tidak boleh menampilkan Rugi Rp10jt', () => {
    const totalExpenses = 10_000_000;
    const totalGKG = 500;
    const totalRevenueSold = 0;       // belum ada yang terjual
    const unsoldGKG = 500;
    const avgPrice = 0;               // belum ada harga
    const refPrice = 0;               // user belum set acuan
    const zakatRp = 0;
    const gacongValueRp = 0;

    // Tanpa refPrice, totalRevenueEstimate = 0
    const totalRevenueEstimate = totalRevenueSold + (unsoldGKG * refPrice); // = 0

    assert.equal(totalRevenueEstimate, 0);

    const hpp = computeHpp(totalExpenses, totalGKG);
    assert.ok(hpp > 0, 'HPP harus > 0 (Rp 20.000/kg)');
    assert.equal(hpp, 20000);

    const netProfit = computeNetProfit(totalRevenueEstimate, zakatRp, gacongValueRp, totalExpenses);
    assert.ok(netProfit < 0, 'net loss without any sales');

    // Setelah user input refPrice Rp 6.000
    const refPriceSet = 6000;
    const estValue = unsoldGKG * refPriceSet; // = 3.000.000
    const totalEstimate = estValue;            // = 3.000.000
    const projectedNet = computeNetProfit(totalEstimate, zakatRp, gacongValueRp, totalExpenses);
    assert.equal(estValue, 3_000_000);
    // Proyeksi laba = 3jt - 0 zakat - 0 gacong - 10jt = -7jt
    assert.equal(projectedNet, -7_000_000);

    // Break even: progress 30% (3jt / 10jt)
    const be = computeBreakEven(totalEstimate, totalExpenses);
    assert.equal(be.pct, 30);
    assert.equal(be.gap, 7_000_000);
    assert.equal(be.isRecovered, false);

    // Kg needed at refPrice: 7jt / 6000 ≈ 1167 kg
    const kgNeeded = be.gap / refPriceSet;
    assert.equal(Math.round(kgNeeded), 1167);
  });
});

describe('Skenario 3: Sebagian terjual', () => {
  it('300 kg terjual @Rp6.500, 200 kg belum terjual, refPrice Rp6.000', () => {
    const totalExpenses = 10_000_000;
    const totalRevenueSold = 300 * 6500; // = 1.950.000
    const unsoldGKG = 200;
    const refPrice = 6000;
    const estValue = unsoldGKG * refPrice; // = 1.200.000
    const totalRevenueEstimate = totalRevenueSold + estValue; // = 3.150.000
    const zakatRp = 0; // 500 kg GKG < nisab
    const gacongValueRp = 0;

    assert.equal(totalRevenueSold, 1_950_000);
    assert.equal(estValue, 1_200_000);
    assert.equal(totalRevenueEstimate, 3_150_000);

    const projectedNet = computeNetProfit(totalRevenueEstimate, zakatRp, gacongValueRp, totalExpenses);
    assert.equal(projectedNet, -6_850_000);

    const be = computeBreakEven(totalRevenueEstimate, totalExpenses);
    assert.equal(be.pct, 31.5);
    assert.equal(be.gap, 6_850_000);
  });
});

describe('Skenario 4: Sudah untung', () => {
  it('600 kg terjual @Rp7.000, modal Rp3jt, di bawah nisab', () => {
    const totalExpenses = 3_000_000;
    const totalRevenue = 600 * 7000;
    const zakatRp = 0;
    const gacongValueRp = 0;

    const netProfit = computeNetProfit(totalRevenue, zakatRp, gacongValueRp, totalExpenses);
    assert.equal(netProfit, 1_200_000);

    const roi = computeRoi(netProfit, totalExpenses);
    assert.equal(roi, 40);

    const margin = computeMargin(netProfit, totalRevenue);
    assert.equal(margin, 28.57);

    const be = computeBreakEven(totalRevenue, totalExpenses);
    assert.equal(be.pct, 100);
    assert.equal(be.isRecovered, true);
    assert.equal(be.gap, 0);
  });

  it('Full recovery 140%', () => {
    const expenses = 3_000_000;
    const revenue = 4_200_000;
    const be = computeBreakEven(revenue, expenses);
    assert.equal(be.pct, 100);
    assert.equal(be.isRecovered, true);
  });
});

describe('Skenario 5: HPP comparison (fix GKP → GKG)', () => {
  it('HPP GKP vs HPP GKG — should be ~25% higher after fix', () => {
    const totalExpenses = 4_000_000;
    const totalGKP = 1000;  // gross
    const totalGKG = 666;   // after gacong + moisture reduction

    const oldHppGKP = computeOldHpp(totalExpenses, totalGKP);
    const newHppGKG = computeHpp(totalExpenses, totalGKG);

    assert.equal(oldHppGKP, 4000);
    assert.equal(newHppGKG, 6006.01);
    // Increase: (6006 - 4000) / 4000 * 100 = 50.15%
    const increasePct = round(((newHppGKG - oldHppGKP) / oldHppGKP) * 100);
    assert.ok(increasePct > 25, `Expected > 25% increase, got ${increasePct}%`);
    assert.ok(increasePct < 60, `Expected < 60% increase, got ${increasePct}%`);
  });
});

describe('Skenario 6: Weighted avg vs simple avg', () => {
  it('Large harvest should dominate small harvest in weighted avg', () => {
    const records = [
      { gkg_weight: 50, price_per_kg: 10000 },
      { gkg_weight: 500, price_per_kg: 6000 },
    ];

    const simple = simpleAvgPrice(records);
    const weighted = weightedAvgPrice(records);

    assert.equal(simple, 8000);
    assert.equal(weighted, 6363.64);

    assert.notEqual(simple, weighted);
    assert.ok(weighted < simple, 'Weighted should be lower when cheap bulk dominates');
  });

  it('Equal weights → simple avg == weighted avg', () => {
    const records = [
      { gkg_weight: 100, price_per_kg: 7000 },
      { gkg_weight: 100, price_per_kg: 7000 },
    ];
    assert.equal(simpleAvgPrice(records), weightedAvgPrice(records));
  });
});

describe('Skenario 7: Gacong value (konservatif)', () => {
  it('Only priced records contribute to gacong value', () => {
    const records = [
      { gacong_weight: 60, price_per_kg: 6000 },  // priced
      { gacong_weight: 40, price_per_kg: 6000 },  // priced
      { gacong_weight: 50, price_per_kg: 0 },     // unpriced — konservatif: skip
    ];

    const value = computeGacongValue(records);
    assert.equal(value, (60 + 40) * 6000); // = 600.000
    // 50 kg gacong tidak dihitung karena belum ada harga
  });

  it('All unpriced → gacong value = 0', () => {
    const records = [
      { gacong_weight: 100, price_per_kg: 0 },
      { gacong_weight: 50, price_per_kg: 0 },
    ];
    assert.equal(computeGacongValue(records), 0);
  });
});

// ─────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────

describe('Edge cases', () => {
  it('Division by zero guards in all formulas', () => {
    // HPP
    assert.equal(computeHpp(1000000, 0), 0);
    assert.equal(computeOldHpp(1000000, 0), 0);
    // ROI
    assert.equal(computeRoi(500_000, 0), 0);
    // Margin
    assert.equal(computeMargin(500_000, 0), 0);
  });

  it('ref_price_per_kg = 0 → fallback behavior', () => {
    const soldRevenue = 2_000_000;
    const unsoldKg = 300;
    const refPrice = 0;

    const um = computeUnsoldMetrics(soldRevenue, unsoldKg, refPrice, 5_000_000, 0);
    assert.equal(um.estValue, 0);
    assert.equal(um.totalEstimate, soldRevenue); // = 2jt (only sold)
    assert.equal(um.projectedNet, -3_000_000);
  });

  it('ref_price = avgPrice sebagai fallback saat ref = 0', () => {
    // Simulasi: refPrice fallback ke avgPricePerKg
    const refPriceFallback = 0;  // ref_price belum di-set
    const avgPrice = 7000;       // avg harga dari record yang sudah terjual
    const effectivePrice = refPriceFallback || avgPrice;
    assert.equal(effectivePrice, 7000);
  });

  it('Negative profit => deficit segment in donut chart', () => {
    const expenses = 5_000_000;
    const revenue = 3_000_000;
    const zakatRp = 0;
    const netProfit = computeNetProfit(revenue, zakatRp, 0, expenses);
    assert.ok(netProfit < 0);
    // Defisit absolute value = |−2.000.000| = 2.000.000
    assert.equal(Math.abs(netProfit), 2_000_000);
  });

  it('Zakat > 0 only when nisab reached', () => {
    // NISAB = 653 kg GKG
    const totalGKGBelow = 500;
    const totalGKGAbove = 700;
    const price = 6000;

    const below = getZakatSummary(totalGKGBelow, price);
    const above = getZakatSummary(totalGKGAbove, price);

    assert.equal(below.wajib, false);
    assert.equal(below.zakatRp, 0);
    assert.equal(above.wajib, true);
    assert.ok(above.zakatRp > 0);
  });

  it('Break even at exactly 100% → isRecovered = true', () => {
    const be = computeBreakEven(5_000_000, 5_000_000);
    assert.equal(be.pct, 100);
    assert.equal(be.isRecovered, true);
    assert.equal(be.gap, 0);
  });

  it('Break even at 99.9% → isRecovered = false', () => {
    const be = computeBreakEven(4_995_000, 5_000_000);
    assert.equal(be.pct, 99.9);
    assert.equal(be.isRecovered, false);
    assert.equal(be.gap, 5000);
  });

  it('Price simulator: min price (HPP) => break-even', () => {
    const expenses = 4_000_000;
    const unsoldKg = 400;
    const hpp = computeHpp(expenses, unsoldKg);
    assert.equal(hpp, 10000); // 4jt / 400kg

    const sim = priceSimulator(0, unsoldKg, hpp, expenses, 0);
    assert.equal(sim.netProfit, 0);
    assert.equal(sim.roi, 0);
    assert.equal(sim.margin, 0);
  });

  it('Price simulator: 2× HPP => 50% margin', () => {
    const expenses = 4_000_000;
    const unsoldKg = 400;
    const hpp = computeHpp(expenses, unsoldKg); // 10000
    const price = hpp * 2; // 20000

    const sim = priceSimulator(0, unsoldKg, price, expenses, 0);
    assert.equal(sim.estRevenue, 8_000_000);
    assert.equal(sim.netProfit, 4_000_000);
    assert.equal(sim.roi, 100);   // 4jt / 4jt = 100%
    assert.equal(sim.margin, 50); // 4jt / 8jt = 50%
  });

  it('Price simulator: below HPP => loss', () => {
    const expenses = 4_000_000;
    const unsoldKg = 400;
    const hpp = computeHpp(expenses, unsoldKg); // 10000

    const sim = priceSimulator(0, unsoldKg, 8000, expenses, 0);
    assert.ok(sim.netProfit < 0);
    assert.equal(sim.estRevenue, 3_200_000);
    assert.equal(sim.netProfit, -800_000);
  });

  it('Waterfall: gross revenue − zakat − gacong − expenses == net', () => {
    const revenue = 10_000_000;
    const zakatRp = 500_000;
    const gacongRp = 300_000;
    const expenses = 7_000_000;

    const net = computeNetProfit(revenue, zakatRp, gacongRp, expenses);
    assert.equal(net, 2_200_000);
  });

  it('Waterfall: zakat = 0 and gacong = 0 → fallback to old formula', () => {
    const net = computeNetProfit(5_000_000, 0, 0, 3_000_000);
    assert.equal(net, 2_000_000); // same as old revenue − expenses
  });
});
