/**
 * ExpenseList regression tests
 * Covers the "Element type is invalid" crash from keyed <Fragment>
 * inside expenses.map on RN 0.86 / React 19.2.
 * Run: npm test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildExpenseListItems } from '../utils/expenseListItems';
import { type Expense } from '../database/expenseService';

function makeExpense(overrides: Partial<Expense>): Expense {
  return {
    id: 1,
    title: 'Pupuk',
    description: null,
    amount: 50000,
    category: 'Pupuk',
    season_code: 'M1-2026',
    date: '2026-08-01',
    is_paid: 1,
    vendor_name: null,
    payment_date: null,
    plot_id: null,
    ...overrides,
  };
}

describe('buildExpenseListItems', () => {
  it('membuat 1 view per expense', () => {
    const items = buildExpenseListItems([
      makeExpense({ id: 1 }),
      makeExpense({ id: 2, title: 'Benih' }),
      makeExpense({ id: 3, title: 'Sewa traktor' }),
    ]);
    assert.strictEqual(items.length, 3);
    assert.deepStrictEqual(
      items.map((i) => i.item.title),
      ['Pupuk', 'Benih', 'Sewa traktor']
    );
  });

  it('regression: key adalah number (bukan string hasil .toString())', () => {
    const items = buildExpenseListItems([
      makeExpense({ id: 10 }),
      makeExpense({ id: 11 }),
    ]);
    for (const item of items) {
      assert.strictEqual(typeof item.key, 'number');
      assert.strictEqual(item.key, item.item.id);
    }
  });

  it('regression: id 0 (falsy) tetap jadi key valid tanpa crash', () => {
    const items = buildExpenseListItems([makeExpense({ id: 0 })]);
    assert.strictEqual(items[0].key, 0);
    assert.strictEqual(items[0].hasTopSpacing, false);
  });

  it('separator hanya untuk item setelah yang pertama', () => {
    const items = buildExpenseListItems([
      makeExpense({ id: 1 }),
      makeExpense({ id: 2 }),
      makeExpense({ id: 3 }),
    ]);
    assert.strictEqual(items[0].hasTopSpacing, false);
    assert.strictEqual(items[1].hasTopSpacing, true);
    assert.strictEqual(items[2].hasTopSpacing, true);
  });

  it('single item → tanpa top spacing', () => {
    const items = buildExpenseListItems([makeExpense({ id: 7 })]);
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].hasTopSpacing, false);
  });

  it('list kosong → array kosong (EmptyState ditampilkan)', () => {
    assert.deepStrictEqual(buildExpenseListItems([]), []);
  });

  it('key mengikuti id item, bukan index array', () => {
    const items = buildExpenseListItems([
      makeExpense({ id: 42 }),
      makeExpense({ id: 99 }),
    ]);
    assert.deepStrictEqual(
      items.map((i) => i.key),
      [42, 99]
    );
  });

  it('duplicate id tetap diterjemahkan apa adanya (uniqueness milik DB)', () => {
    const items = buildExpenseListItems([
      makeExpense({ id: 5 }),
      makeExpense({ id: 5 }),
    ]);
    assert.deepStrictEqual(
      items.map((i) => i.key),
      [5, 5]
    );
  });
});
