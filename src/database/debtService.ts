import { type SQLiteDatabase } from 'expo-sqlite';

export interface DebtInput {
  season_code: string;
  type: 'loan_in' | 'loan_out';
  counterparty: string;
  amount: number;
  interest_rate?: number;
  due_date?: string | null;
  note?: string | null;
}

export interface Debt {
  id: number;
  season_code: string;
  type: 'loan_in' | 'loan_out';
  counterparty: string;
  amount: number;
  paid_amount: number;
  interest_rate: number;
  due_date: string | null;
  note: string | null;
  date: string;
  is_settled: number;
}

export interface DebtPayment {
  id: number;
  debt_id: number;
  amount: number;
  payment_date: string;
  note: string | null;
}

export function computeTotalWithInterest(
  principal: number,
  interestRate: number,
  startDate: string,
): number {
  if (interestRate <= 0) return principal;
  const months = Math.max(0, monthsSince(startDate));
  const monthlyRate = interestRate / 100 / 12;
  const interest = principal * monthlyRate * months;
  return Math.round((principal + interest) * 100) / 100;
}

export function monthsSince(dateStr: string): number {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const d = new Date(dueDate);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

export async function addDebt(
  db: SQLiteDatabase,
  debt: DebtInput,
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO debts (season_code, type, counterparty, amount, interest_rate, due_date, note, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      debt.season_code,
      debt.type,
      debt.counterparty,
      debt.amount,
      debt.interest_rate ?? 0,
      debt.due_date || null,
      debt.note || null,
      new Date().toISOString().split('T')[0],
    ],
  );
  return result.lastInsertRowId;
}

export async function getDebts(
  db: SQLiteDatabase,
  seasonCode: string,
  type?: Debt['type'],
): Promise<Debt[]> {
  if (type) {
    return db.getAllAsync<Debt>(
      'SELECT * FROM debts WHERE season_code = ? AND type = ? ORDER BY date DESC, id DESC',
      [seasonCode, type],
    );
  }
  return db.getAllAsync<Debt>(
    'SELECT * FROM debts WHERE season_code = ? ORDER BY date DESC, id DESC',
    [seasonCode],
  );
}

export async function getTotalLoanIn(
  db: SQLiteDatabase,
  seasonCode: string,
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(amount) as total FROM debts WHERE season_code = ? AND type = 'loan_in'",
    [seasonCode],
  );
  return result?.total ?? 0;
}

export async function getTotalLoanOut(
  db: SQLiteDatabase,
  seasonCode: string,
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(amount) as total FROM debts WHERE season_code = ? AND type = 'loan_out'",
    [seasonCode],
  );
  return result?.total ?? 0;
}

export async function addPayment(
  db: SQLiteDatabase,
  debtId: number,
  amount: number,
  paymentDate: string,
  note?: string | null,
): Promise<void> {
  if (amount <= 0) throw new Error('Jumlah pembayaran harus > 0');

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO debt_payments (debt_id, amount, payment_date, note) VALUES (?, ?, ?, ?)',
      [debtId, amount, paymentDate, note || null],
    );

    await db.runAsync(
      'UPDATE debts SET paid_amount = paid_amount + ? WHERE id = ?',
      [amount, debtId],
    );

    const debt = await db.getFirstAsync<Debt>(
      'SELECT * FROM debts WHERE id = ?',
      [debtId],
    );
    if (debt && debt.paid_amount >= debt.amount) {
      await db.runAsync(
        'UPDATE debts SET is_settled = 1 WHERE id = ?',
        [debtId],
      );
    }
  });
}

export async function getDebtPayments(
  db: SQLiteDatabase,
  debtId: number,
): Promise<DebtPayment[]> {
  return db.getAllAsync<DebtPayment>(
    'SELECT * FROM debt_payments WHERE debt_id = ? ORDER BY payment_date DESC, id DESC',
    [debtId],
  );
}

export async function deleteDebt(
  db: SQLiteDatabase,
  id: number,
): Promise<void> {
  await db.runAsync('DELETE FROM debts WHERE id = ?', [id]);
}

export async function getOverdueCount(
  db: SQLiteDatabase,
  seasonCode: string,
): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM debts WHERE season_code = ? AND is_settled = 0 AND due_date IS NOT NULL AND due_date < ?',
    [seasonCode, today],
  );
  return result?.count ?? 0;
}
