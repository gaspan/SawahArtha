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
}

export interface ExpenseInput {
  title: string;
  description: string;
  amount: number;
  category: string;
  season_code: string;
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

export async function addExpense(
  db: SQLiteDatabase,
  expense: ExpenseInput
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO expenses (title, description, amount, category, season_code, date) VALUES (?, ?, ?, ?, ?, ?)',
    [
      expense.title,
      expense.description || '',
      expense.amount,
      expense.category,
      expense.season_code,
      new Date().toISOString().split('T')[0],
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
