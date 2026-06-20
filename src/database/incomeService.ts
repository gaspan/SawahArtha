/**
 * Income (Panen/Harvest) database service
 * All queries filter by season_code for data isolation
 * 
 * Critical: updateIncomePrice recalculates total_revenue atomically in SQL
 */
import { type SQLiteDatabase } from 'expo-sqlite';

export interface Income {
  id: number;
  gkp_weight: number;
  gkg_weight: number;
  price_per_kg: number;
  total_revenue: number;
  season_code: string;
  date: string;
}

export interface IncomeInput {
  gkp_weight: number;
  gkg_weight: number;
  price_per_kg: number;
  total_revenue: number;
  season_code: string;
}

export async function getAllIncome(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<Income[]> {
  return db.getAllAsync<Income>(
    'SELECT * FROM income WHERE season_code = ? ORDER BY date DESC, id DESC',
    [seasonCode]
  );
}

export async function addIncome(
  db: SQLiteDatabase,
  income: IncomeInput
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO income (gkp_weight, gkg_weight, price_per_kg, total_revenue, season_code, date) VALUES (?, ?, ?, ?, ?, ?)',
    [
      income.gkp_weight,
      income.gkg_weight,
      income.price_per_kg,
      income.total_revenue,
      income.season_code,
      new Date().toISOString().split('T')[0],
    ]
  );
  return result.lastInsertRowId;
}

/**
 * Update selling price and recalculate total revenue atomically.
 * total_revenue = gkp_weight * new_price_per_kg (calculated in SQL using stored gkp_weight)
 */
export async function updateIncomePrice(
  db: SQLiteDatabase,
  id: number,
  pricePerKg: number
): Promise<void> {
  await db.runAsync(
    'UPDATE income SET price_per_kg = ?, total_revenue = gkp_weight * ? WHERE id = ?',
    [pricePerKg, pricePerKg, id]
  );
}

export async function deleteIncome(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM income WHERE id = ?', [id]);
}

export async function getTotalRevenue(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(total_revenue) as total FROM income WHERE season_code = ?',
    [seasonCode]
  );
  return result?.total ?? 0;
}

export async function getTotalGKG(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(gkg_weight) as total FROM income WHERE season_code = ?',
    [seasonCode]
  );
  return result?.total ?? 0;
}

export async function getTotalGKP(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(gkp_weight) as total FROM income WHERE season_code = ?',
    [seasonCode]
  );
  return result?.total ?? 0;
}

/**
 * Calculate weighted average price per kg for zakat rupiah calculation.
 * Only includes records that have a price set (price_per_kg > 0).
 */
export async function getAveragePricePerKg(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<number> {
  const result = await db.getFirstAsync<{ avg_price: number | null }>(
    'SELECT AVG(price_per_kg) as avg_price FROM income WHERE season_code = ? AND price_per_kg > 0',
    [seasonCode]
  );
  return result?.avg_price ?? 0;
}
