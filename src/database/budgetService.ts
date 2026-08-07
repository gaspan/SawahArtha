import { type SQLiteDatabase } from 'expo-sqlite';
import {
  CATEGORIES,
  DEFAULT_BUDGET_PER_HA,
  DEFAULT_BUDGET_RATIO,
  BUDGET_AUDIT_LOG_LIMIT,
  type ExpenseCategory,
} from '../constants/theme';

export interface Budget {
  id: number;
  season_code: string;
  category: string;
  amount: number;
}

export interface BudgetVsActual {
  category: string;
  budgetAmount: number;
  actualAmount: number;
  remaining: number;
  percentUsed: number;
  status: 'safe' | 'warning' | 'danger' | 'none';
}

export interface BudgetLog {
  id: number;
  season_code: string;
  category: string;
  old_amount: number;
  new_amount: number;
  action: 'create' | 'update' | 'delete' | 'seed';
  changed_at: string;
}

function computeStatus(percentUsed: number): BudgetVsActual['status'] {
  if (percentUsed >= 100) return 'danger';
  if (percentUsed >= 80) return 'warning';
  if (percentUsed > 0 || percentUsed === 0) return 'safe';
  return 'safe';
}

export async function seedDefaultBudgets(
  db: SQLiteDatabase,
  seasonCode: string,
  landSizeM2: number,
): Promise<void> {
  if (landSizeM2 <= 0) return;
  const ha = landSizeM2 / 10000;
  const totalBudget = DEFAULT_BUDGET_PER_HA * ha;
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    for (const cat of CATEGORIES) {
      const existing = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM budgets WHERE season_code = ? AND category = ?',
        [seasonCode, cat],
      );
      if (existing && existing.count > 0) continue;

      const ratio = DEFAULT_BUDGET_RATIO[cat as ExpenseCategory] ?? 0;
      const amount = Math.round(totalBudget * ratio);

      await db.runAsync(
        'INSERT OR IGNORE INTO budgets (season_code, category, amount) VALUES (?, ?, ?)',
        [seasonCode, cat, amount],
      );

      await db.runAsync(
        'INSERT INTO budget_logs (season_code, category, old_amount, new_amount, action, changed_at) VALUES (?, ?, 0, ?, ?, ?)',
        [seasonCode, cat, amount, 'seed', now],
      );
    }
  });
}

export async function getBudgets(
  db: SQLiteDatabase,
  seasonCode: string,
): Promise<Budget[]> {
  return db.getAllAsync<Budget>(
    'SELECT * FROM budgets WHERE season_code = ? ORDER BY category ASC',
    [seasonCode],
  );
}

export async function setBudget(
  db: SQLiteDatabase,
  seasonCode: string,
  category: string,
  amount: number,
): Promise<void> {
  if (amount < 0) throw new Error('Jumlah anggaran tidak boleh negatif');

  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync<Budget>(
      'SELECT * FROM budgets WHERE season_code = ? AND category = ?',
      [seasonCode, category],
    );

    const oldAmount = existing?.amount ?? 0;
    const action: BudgetLog['action'] = existing ? 'update' : 'create';

    await db.runAsync(
      'INSERT INTO budgets (season_code, category, amount) VALUES (?, ?, ?) ON CONFLICT(season_code, category) DO UPDATE SET amount = excluded.amount',
      [seasonCode, category, amount],
    );

    if (oldAmount !== amount) {
      await db.runAsync(
        'INSERT INTO budget_logs (season_code, category, old_amount, new_amount, action, changed_at) VALUES (?, ?, ?, ?, ?, ?)',
        [seasonCode, category, oldAmount, amount, action, now],
      );
    }
  });
}

export async function deleteBudget(
  db: SQLiteDatabase,
  seasonCode: string,
  category: string,
): Promise<void> {
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync<Budget>(
      'SELECT * FROM budgets WHERE season_code = ? AND category = ?',
      [seasonCode, category],
    );
    if (!existing) return;

    await db.runAsync(
      'DELETE FROM budgets WHERE season_code = ? AND category = ?',
      [seasonCode, category],
    );

    await db.runAsync(
      'INSERT INTO budget_logs (season_code, category, old_amount, new_amount, action, changed_at) VALUES (?, ?, ?, 0, ?, ?)',
      [seasonCode, category, existing.amount, 'delete', now],
    );
  });
}

export async function getTotalBudget(
  db: SQLiteDatabase,
  seasonCode: string,
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(amount) as total FROM budgets WHERE season_code = ?',
    [seasonCode],
  );
  return result?.total ?? 0;
}

export async function getBudgetVsActual(
  db: SQLiteDatabase,
  seasonCode: string,
): Promise<BudgetVsActual[]> {
  const rows = await db.getAllAsync<{
    category: string;
    budgetAmount: number;
    actualAmount: number;
  }>(
    `SELECT
      b.category,
      b.amount AS budgetAmount,
      COALESCE(e.total, 0) AS actualAmount
    FROM budgets b
    LEFT JOIN (
      SELECT category, SUM(amount) AS total
      FROM expenses WHERE season_code = ?
      GROUP BY category
    ) e ON e.category = b.category
    WHERE b.season_code = ?
    ORDER BY e.total DESC, b.amount DESC`,
    [seasonCode, seasonCode],
  );

  return rows.map((row) => {
    const percentUsed =
      row.budgetAmount > 0
        ? Math.round((row.actualAmount / row.budgetAmount) * 100 * 100) / 100
        : 0;
    return {
      category: row.category,
      budgetAmount: row.budgetAmount,
      actualAmount: row.actualAmount,
      remaining: row.budgetAmount - row.actualAmount,
      percentUsed,
      status: computeStatus(percentUsed),
    };
  });
}

export async function getOverBudgetCount(
  db: SQLiteDatabase,
  seasonCode: string,
): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM budgets b
     WHERE b.season_code = ?
       AND b.amount > 0
       AND b.amount <= COALESCE(
         (SELECT SUM(e.amount) FROM expenses e
          WHERE e.season_code = ? AND e.category = b.category), 0)`,
    [seasonCode, seasonCode],
  );
  return result?.count ?? 0;
}

export async function getBudgetLogs(
  db: SQLiteDatabase,
  seasonCode: string,
  limit: number = BUDGET_AUDIT_LOG_LIMIT,
): Promise<BudgetLog[]> {
  return db.getAllAsync<BudgetLog>(
    `SELECT * FROM budget_logs
     WHERE season_code = ?
     ORDER BY changed_at DESC
     LIMIT ?`,
    [seasonCode, limit],
  );
}
