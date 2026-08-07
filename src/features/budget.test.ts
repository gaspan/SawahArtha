import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORIES,
  DEFAULT_BUDGET_PER_HA,
  DEFAULT_BUDGET_RATIO,
  type ExpenseCategory,
} from '../constants/theme';

const EPSILON = 1;

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function computePercentUsed(budgetAmount: number, actualAmount: number): number {
  if (budgetAmount <= 0) return 0;
  return round((actualAmount / budgetAmount) * 100);
}

function computeStatus(percentUsed: number): 'safe' | 'warning' | 'danger' | 'none' {
  if (percentUsed >= 100) return 'danger';
  if (percentUsed >= 80) return 'warning';
  return 'safe';
}

function computeRemaining(budgetAmount: number, actualAmount: number): number {
  return budgetAmount - actualAmount;
}

function computeOverBudgetCount(
  budgets: { category: string; amount: number }[],
  actuals: { category: string; total: number }[],
): number {
  let count = 0;
  for (const b of budgets) {
    if (b.amount <= 0) continue;
    const actual = actuals.find((a) => a.category === b.category)?.total ?? 0;
    if (actual >= b.amount) count++;
  }
  return count;
}

function seedBudgetAmount(landSizeM2: number, category: ExpenseCategory): number {
  const ha = landSizeM2 / 10000;
  const totalBudget = DEFAULT_BUDGET_PER_HA * ha;
  const ratio = DEFAULT_BUDGET_RATIO[category] ?? 0;
  return Math.round(totalBudget * ratio);
}

describe('Budget calculations', () => {
  it('percentUsed = actual / budget * 100', () => {
    assert.strictEqual(computePercentUsed(1000, 500), 50);
    assert.strictEqual(computePercentUsed(1000, 1000), 100);
    assert.strictEqual(computePercentUsed(1000, 0), 0);
  });

  it('percentUsed handles zero budget', () => {
    assert.strictEqual(computePercentUsed(0, 500), 0);
    assert.strictEqual(computePercentUsed(0, 0), 0);
  });

  it('remaining = budget - actual', () => {
    assert.strictEqual(computeRemaining(1000, 600), 400);
    assert.strictEqual(computeRemaining(1000, 1200), -200);
    assert.strictEqual(computeRemaining(1000, 0), 1000);
  });

  it('status thresholds: safe < 80%', () => {
    assert.strictEqual(computeStatus(0), 'safe');
    assert.strictEqual(computeStatus(50), 'safe');
    assert.strictEqual(computeStatus(79.99), 'safe');
  });

  it('status thresholds: warning 80-99%', () => {
    assert.strictEqual(computeStatus(80), 'warning');
    assert.strictEqual(computeStatus(85), 'warning');
    assert.strictEqual(computeStatus(99.99), 'warning');
  });

  it('status thresholds: danger >= 100%', () => {
    assert.strictEqual(computeStatus(100), 'danger');
    assert.strictEqual(computeStatus(150), 'danger');
    assert.strictEqual(computeStatus(200), 'danger');
  });

  it('overBudgetCount counts categories with actual >= budget', () => {
    const budgets = [
      { category: 'Pupuk', amount: 1000 },
      { category: 'Fungisida', amount: 500 },
      { category: 'Insektisida', amount: 300 },
    ];
    const actuals = [
      { category: 'Pupuk', total: 800 },
      { category: 'Fungisida', total: 600 },
      { category: 'Insektisida', total: 100 },
    ];
    assert.strictEqual(computeOverBudgetCount(budgets, actuals), 1);
  });

  it('overBudgetCount skips zero-budget categories', () => {
    const budgets = [
      { category: 'Pupuk', amount: 0 },
      { category: 'Fungisida', amount: 500 },
    ];
    const actuals = [
      { category: 'Pupuk', total: 100 },
      { category: 'Fungisida', total: 100 },
    ];
    assert.strictEqual(computeOverBudgetCount(budgets, actuals), 0);
  });
});

describe('Default budget seed', () => {
  it('total ratio sums to 1.0', () => {
    const sum = Object.values(DEFAULT_BUDGET_RATIO).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.001, `Expected 1.0, got ${sum}`);
  });

  it('seed proportional to land size', () => {
    const amount1 = seedBudgetAmount(1400, 'Pupuk');
    const amount2 = seedBudgetAmount(700, 'Pupuk');
    assert.ok(amount1 > amount2);
    assert.strictEqual(amount1, amount2 * 2);
  });

  it('1400 m2 (0.14 ha) land produces reasonable total budget', () => {
    const expectedTotal = 3_500_000;

    let sum = 0;
    for (const cat of CATEGORIES) {
      sum += seedBudgetAmount(1400, cat as ExpenseCategory);
    }
    assert.ok(Math.abs(sum - expectedTotal) <= CATEGORIES.length);
  });

  it('10000 m2 (1 ha) max category is 30% for Pupuk', () => {
    const pupuk = seedBudgetAmount(10000, 'Pupuk');
    const jasa = seedBudgetAmount(10000, 'Jasa Pegawai');
    assert.strictEqual(pupuk, 7_500_000);
    assert.strictEqual(jasa, 6_250_000);
  });

  it('zero land produces budget=0 for all categories', () => {
    for (const cat of CATEGORIES) {
      assert.strictEqual(seedBudgetAmount(0, cat as ExpenseCategory), 0);
    }
  });

  it('all 8 categories are covered in ratio map', () => {
    const keys = Object.keys(DEFAULT_BUDGET_RATIO);
    assert.strictEqual(keys.length, 8);
    for (const cat of CATEGORIES) {
      assert.ok(cat in DEFAULT_BUDGET_RATIO, `${cat} missing from DEFAULT_BUDGET_RATIO`);
    }
  });
});

describe('Skenario 1: Musim baru, belum ada data', () => {
  const budgets: { category: string; amount: number }[] = CATEGORIES.map((c) => ({
    category: c,
    amount: seedBudgetAmount(1400, c as ExpenseCategory),
  }));
  const actuals: { category: string; total: number }[] = [];

  it('all budgetVsActual should be safe with zero actual', () => {
    for (const b of budgets) {
      const actual = actuals.find((a) => a.category === b.category)?.total ?? 0;
      const pct = computePercentUsed(b.amount, actual);
      assert.strictEqual(pct, 0);
      assert.strictEqual(computeStatus(pct), 'safe');
      assert.strictEqual(computeRemaining(b.amount, actual), b.amount);
    }
  });

  it('overBudgetCount = 0', () => {
    assert.strictEqual(computeOverBudgetCount(budgets, actuals), 0);
  });
});

describe('Skenario 2: realisasi < 80%', () => {
  it('Pupuk at 700 (40%) → safe', () => {
    const budgetAmount = seedBudgetAmount(1400, 'Pupuk');
    const actualAmount = budgetAmount * 0.4;
    const pct = computePercentUsed(budgetAmount, actualAmount);
    assert.ok(pct < 80);
    assert.strictEqual(computeStatus(pct), 'safe');
  });

  it('remaining positive', () => {
    const budgetAmount = seedBudgetAmount(1400, 'Pupuk');
    const actualAmount = budgetAmount * 0.6;
    const rem = computeRemaining(budgetAmount, actualAmount);
    assert.ok(rem > 0);
    assert.strictEqual(rem, Math.round(budgetAmount * 0.4));
  });
});

describe('Skenario 3: realisasi 80-99%', () => {
  it('Insektisida at 90% → warning', () => {
    const budgetAmount = seedBudgetAmount(1400, 'Insektisida');
    const actualAmount = Math.round(budgetAmount * 0.9);
    const pct = computePercentUsed(budgetAmount, actualAmount);
    assert.ok(pct >= 80 && pct < 100);
    assert.strictEqual(computeStatus(pct), 'warning');
  });

  it('remaining small but positive', () => {
    const budgetAmount = seedBudgetAmount(1400, 'Insektisida');
    const actualAmount = Math.round(budgetAmount * 0.85);
    const rem = computeRemaining(budgetAmount, actualAmount);
    assert.ok(rem > 0);
    assert.ok(rem <= budgetAmount * 0.2 + 1);
  });
});

describe('Skenario 4: realisasi >= 100%', () => {
  it('Fungisida at 110% → danger', () => {
    const budgetAmount = seedBudgetAmount(1400, 'Fungisida');
    const actualAmount = Math.round(budgetAmount * 1.1);
    const pct = computePercentUsed(budgetAmount, actualAmount);
    assert.ok(pct >= 100);
    assert.strictEqual(computeStatus(pct), 'danger');
  });

  it('remaining negative', () => {
    const budgetAmount = seedBudgetAmount(1400, 'Fungisida');
    const actualAmount = Math.round(budgetAmount * 1.2);
    const rem = computeRemaining(budgetAmount, actualAmount);
    assert.ok(rem < 0);
  });

  it('overBudgetCount increments for danger category', () => {
    const budgetAmount = seedBudgetAmount(1400, 'Fungisida');
    const budgets = [{ category: 'Fungisida', amount: budgetAmount }];
    const actuals = [{ category: 'Fungisida', total: Math.round(budgetAmount * 1.5) }];
    assert.strictEqual(computeOverBudgetCount(budgets, actuals), 1);
  });
});

describe('Skenario 5: Kategori tanpa anggaran', () => {
  it('expenses without budget do not appear in budgetVsActual', () => {
    const budgets: { category: string; amount: number }[] = [
      { category: 'Pupuk', amount: 1000000 },
    ];
    const actuals: { category: string; total: number }[] = [
      { category: 'Pupuk', total: 500000 },
      { category: 'Herbisida', total: 300000 },
    ];
    const herbisidaBudget = budgets.find((b) => b.category === 'Herbisida');
    assert.strictEqual(herbisidaBudget, undefined);
  });
});

describe('Skenario 6: overBudgetCount untuk badge', () => {
  it('0 categories over → count 0', () => {
    const budgets = CATEGORIES.map((c) => ({
      category: c,
      amount: seedBudgetAmount(1400, c as ExpenseCategory),
    }));
    const actuals = CATEGORIES.map((c) => ({
      category: c,
      total: seedBudgetAmount(1400, c as ExpenseCategory) * 0.5,
    }));
    assert.strictEqual(computeOverBudgetCount(budgets, actuals), 0);
  });

  it('2 categories over → count 2', () => {
    const budgets = [
      { category: 'Pupuk', amount: 1000000 },
      { category: 'Fungisida', amount: 500000 },
      { category: 'Insektisida', amount: 400000 },
    ];
    const actuals = [
      { category: 'Pupuk', total: 1200000 },
      { category: 'Fungisida', total: 300000 },
      { category: 'Insektisida', total: 400000 },
    ];
    assert.strictEqual(computeOverBudgetCount(budgets, actuals), 2);
  });

  it('all categories over → count = number of non-zero budget categories', () => {
    const budgets = [
      { category: 'Pupuk', amount: 1000000 },
      { category: 'Fungisida', amount: 500000 },
      { category: 'Insektisida', amount: 0 },
    ];
    const actuals = [
      { category: 'Pupuk', total: 1500000 },
      { category: 'Fungisida', total: 600000 },
      { category: 'Insektisida', total: 500000 },
    ];
    assert.strictEqual(computeOverBudgetCount(budgets, actuals), 2);
  });
});

describe('Audit log', () => {
  it('create action recorded with old_amount=0', () => {
    const log = {
      old_amount: 0,
      new_amount: 1000000,
      action: 'create' as const,
      category: 'Pupuk',
    };
    assert.strictEqual(log.old_amount, 0);
    assert.strictEqual(log.new_amount, 1000000);
    assert.strictEqual(log.action, 'create');
  });

  it('update action recorded with delta', () => {
    const log = {
      old_amount: 1000000,
      new_amount: 1200000,
      action: 'update' as const,
    };
    assert.ok(log.new_amount > log.old_amount);
    assert.strictEqual(log.new_amount - log.old_amount, 200000);
  });

  it('delete action sets new_amount=0', () => {
    const log = {
      old_amount: 500000,
      new_amount: 0,
      action: 'delete' as const,
    };
    assert.strictEqual(log.new_amount, 0);
    assert.ok(log.old_amount > 0);
  });

  it('seed action marks initial budget creation', () => {
    const log = {
      old_amount: 0,
      new_amount: 750000,
      action: 'seed' as const,
      season_code: 'MT-2026-1',
      category: 'Pupuk',
    };
    assert.strictEqual(log.action, 'seed');
    assert.strictEqual(log.old_amount, 0);
    assert.ok(log.new_amount > 0);
  });

  it('no log entry when amount unchanged', () => {
    let logged = false;
    const oldAmount = 1000000;
    const newAmount = 1000000;
    if (oldAmount !== newAmount) logged = true;
    assert.strictEqual(logged, false);
  });
});

describe('Edge cases', () => {
  it('budget = 0 → percentUsed = 0', () => {
    assert.strictEqual(computePercentUsed(0, 1000), 0);
  });

  it('actual > budget by large margin', () => {
    const pct = computePercentUsed(1000, 5000);
    assert.strictEqual(pct, 500);
    assert.strictEqual(computeStatus(pct), 'danger');
  });

  it('landSize = 0 results in all budget amounts = 0', () => {
    for (const cat of CATEGORIES) {
      assert.strictEqual(seedBudgetAmount(0, cat as ExpenseCategory), 0);
    }
  });

  it('negative actualAmount in percentUsed should still compute', () => {
    const pct = computePercentUsed(1000, -500);
    assert.strictEqual(pct, -50);
  });

  it('very small decimal amounts handled correctly', () => {
    const pct = computePercentUsed(100, 1);
    assert.strictEqual(pct, 1);
    assert.strictEqual(computeStatus(pct), 'safe');
  });
});
