/**
 * Expense database service
 * All queries filter by season_code for data isolation
 */
import { type SQLiteDatabase } from 'expo-sqlite';

export interface Expense {
  id: number;
  title: string;
  description: string | null;
  amount: number;
  category: string;
  season_code: string;
  date: string;
  is_paid: number;
  vendor_name: string | null;
  payment_date: string | null;
}

export interface ExpenseInput {
  title: string;
  description: string;
  amount: number;
  category: string;
  season_code: string;
  is_paid?: number;
  vendor_name?: string;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export async function getAllExpenses(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<Expense[]> {
  return db.getAllAsync<Expense>(
    'SELECT * FROM expenses WHERE season_code = ? ORDER BY date DESC, id DESC',
    [seasonCode]
  );
}

export const EXPENSES_PAGE_SIZE = 10;

export async function getExpensesPaginated(
  db: SQLiteDatabase,
  seasonCode: string,
  category: string | null,
  limit: number,
  offset: number
): Promise<Expense[]> {
  if (category) {
    return db.getAllAsync<Expense>(
      'SELECT * FROM expenses WHERE season_code = ? AND category = ? ORDER BY date DESC, id DESC LIMIT ? OFFSET ?',
      [seasonCode, category, limit, offset]
    );
  }
  return db.getAllAsync<Expense>(
    'SELECT * FROM expenses WHERE season_code = ? ORDER BY date DESC, id DESC LIMIT ? OFFSET ?',
    [seasonCode, limit, offset]
  );
}

export async function countExpenses(
  db: SQLiteDatabase,
  seasonCode: string,
  category: string | null
): Promise<number> {
  const result = category
    ? await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM expenses WHERE season_code = ? AND category = ?',
        [seasonCode, category]
      )
    : await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM expenses WHERE season_code = ?',
        [seasonCode]
      );
  return result?.count ?? 0;
}

export async function addExpense(
  db: SQLiteDatabase,
  expense: ExpenseInput
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO expenses (title, description, amount, category, season_code, date, is_paid, vendor_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      expense.title,
      expense.description || '',
      expense.amount,
      expense.category,
      expense.season_code,
      new Date().toISOString().split('T')[0],
      expense.is_paid ?? 1,
      expense.vendor_name || null,
    ]
  );
  return result.lastInsertRowId;
}

export async function deleteExpense(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

export async function updateExpense(
  db: SQLiteDatabase,
  id: number,
  expense: Omit<ExpenseInput, 'season_code'>
): Promise<void> {
  await db.runAsync(
    'UPDATE expenses SET title = ?, description = ?, amount = ?, category = ? WHERE id = ?',
    [
      expense.title,
      expense.description || '',
      expense.amount,
      expense.category,
      id,
    ]
  );
}

export async function getExpensesByCategory(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<CategoryTotal[]> {
  return db.getAllAsync<CategoryTotal>(
    'SELECT category, SUM(amount) as total FROM expenses WHERE season_code = ? GROUP BY category ORDER BY total DESC',
    [seasonCode]
  );
}

export async function getTotalExpenses(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(amount) as total FROM expenses WHERE season_code = ?',
    [seasonCode]
  );
  return result?.total ?? 0;
}

export async function markExpensePaid(
  db: SQLiteDatabase,
  id: number,
  paymentDate: string
): Promise<void> {
  await db.runAsync(
    'UPDATE expenses SET is_paid = 1, payment_date = ? WHERE id = ?',
    [paymentDate, id]
  );
}

export async function getUnpaidExpenses(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<Expense[]> {
  return db.getAllAsync<Expense>(
    'SELECT * FROM expenses WHERE season_code = ? AND is_paid = 0 ORDER BY date DESC, id DESC',
    [seasonCode]
  );
}

export async function getTotalUnpaidExpenses(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(amount) as total FROM expenses WHERE season_code = ? AND is_paid = 0',
    [seasonCode]
  );
  return result?.total ?? 0;
}

export async function getTotalExpensesPaid(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(amount) as total FROM expenses WHERE season_code = ? AND is_paid = 1',
    [seasonCode]
  );
  return result?.total ?? 0;
}
