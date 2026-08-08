/**
 * Unit tests for notification planning logic
 * Run: npm test
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDebtNotifications,
  computeBudgetWarningBody,
  REMINDER_HOUR,
  LEAD_DAYS,
} from './notificationCore';

const at = (date: string, hour = 9) => new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`);

describe('computeDebtNotifications', () => {
  it('menjadwalkan pengingat H-3 dan H-0 untuk hutang yang belum jatuh tempo', () => {
    const now = at('2026-08-08');
    const debts = [
      { id: 1, counterparty: 'Budi', amount: 1000000, due_date: '2026-08-18', is_settled: 0 },
    ];
    const res = computeDebtNotifications(debts, now);
    assert.equal(res.length, 2);
    assert.equal(res[0].id, 'debt_lead_1');
    assert.equal(res[0].triggerAt.getTime(), at('2026-08-15', REMINDER_HOUR).getTime());
    assert.equal(res[1].id, 'debt_due_1');
    assert.equal(res[1].triggerAt.getTime(), at('2026-08-18', REMINDER_HOUR).getTime());
    assert.match(res[1].body, /Budi/);
  });

  it('tidak menjadwalkan H-3 jika kurang dari LEAD_DAYS tersisa, hanya H-0', () => {
    const now = at('2026-08-16');
    const debts = [
      { id: 1, counterparty: 'Budi', amount: 500000, due_date: '2026-08-18', is_settled: 0 },
    ];
    const res = computeDebtNotifications(debts, now);
    assert.equal(res.length, 1);
    assert.equal(res[0].id, 'debt_due_1');
  });

  it('menjadwalkan pengingat overdue harian (besok pagi) untuk hutang lewat jatuh tempo', () => {
    const now = at('2026-08-20');
    const debts = [
      { id: 2, counterparty: 'Sari', amount: 250000, due_date: '2026-08-18', is_settled: 0 },
    ];
    const res = computeDebtNotifications(debts, now);
    assert.equal(res.length, 1);
    assert.equal(res[0].id, 'debt_overdue_2');
    assert.equal(res[0].triggerAt.getTime(), at('2026-08-21', REMINDER_HOUR).getTime());
    assert.match(res[0].body, /melewati jatuh tempo/);
  });

  it('mengabaikan hutang lunas atau tanpa due_date', () => {
    const now = at('2026-08-08');
    const debts = [
      { id: 1, counterparty: 'A', amount: 100000, due_date: '2026-08-18', is_settled: 1 },
      { id: 2, counterparty: 'B', amount: 100000, due_date: null, is_settled: 0 },
    ];
    assert.equal(computeDebtNotifications(debts, now).length, 0);
  });
});

describe('computeBudgetWarningBody', () => {
  it('null jika semua kategori aman', () => {
    const res = computeBudgetWarningBody([
      { category: 'Pupuk', percentUsed: 50 },
      { category: 'Insektisida', percentUsed: 79.9 },
    ]);
    assert.equal(res, null);
  });

  it('menyebut kategori yang lewat anggaran', () => {
    const res = computeBudgetWarningBody([
      { category: 'Pupuk', percentUsed: 120 },
      { category: 'Herbisida', percentUsed: 60 },
    ]);
    assert.ok(res);
    assert.match(res, /Pupuk/);
  });

  it('menyebut kategori warning (80-99%)', () => {
    const res = computeBudgetWarningBody([
      { category: 'Jasa Pegawai', percentUsed: 85 },
    ]);
    assert.ok(res);
    assert.match(res, /Jasa Pegawai/);
  });
});
