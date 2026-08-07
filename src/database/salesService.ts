import { type SQLiteDatabase } from 'expo-sqlite';

export interface Sale {
  id: number;
  season_code: string;
  gkg_sold: number;
  price_per_kg: number;
  total_revenue: number;
  buyer_name: string | null;
  is_paid: number;
  payment_date: string | null;
  note: string | null;
  date: string;
}

export interface SaleInput {
  season_code: string;
  gkg_sold: number;
  price_per_kg: number;
  total_revenue: number;
  buyer_name?: string;
  is_paid?: number;
  payment_date?: string;
  note?: string;
}

export async function getAllSales(
  db: SQLiteDatabase,
  seasonCode: string,
): Promise<Sale[]> {
  return db.getAllAsync<Sale>(
    'SELECT * FROM sales WHERE season_code = ? ORDER BY date DESC, id DESC',
    [seasonCode],
  );
}

export async function addSale(
  db: SQLiteDatabase,
  sale: SaleInput,
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO sales (season_code, gkg_sold, price_per_kg, total_revenue, buyer_name, is_paid, payment_date, note, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sale.season_code,
      sale.gkg_sold,
      sale.price_per_kg,
      sale.total_revenue,
      sale.buyer_name || null,
      sale.is_paid ?? 1,
      sale.payment_date || null,
      sale.note || null,
      new Date().toISOString().split('T')[0],
    ],
  );
  return result.lastInsertRowId;
}

export async function updateSale(
  db: SQLiteDatabase,
  id: number,
  gkgSold: number,
  pricePerKg: number,
): Promise<void> {
  await db.runAsync(
    'UPDATE sales SET gkg_sold = ?, price_per_kg = ?, total_revenue = ? * ? WHERE id = ?',
    [gkgSold, pricePerKg, gkgSold, pricePerKg, id],
  );
}

export async function deleteSale(
  db: SQLiteDatabase,
  id: number,
): Promise<void> {
  await db.runAsync('DELETE FROM sales WHERE id = ?', [id]);
}

export async function markSalePaid(
  db: SQLiteDatabase,
  id: number,
  paymentDate: string,
): Promise<void> {
  await db.runAsync(
    'UPDATE sales SET is_paid = 1, payment_date = ? WHERE id = ?',
    [paymentDate, id],
  );
}

export async function getTotalRevenue(
  db: SQLiteDatabase,
  seasonCode: string,
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(total_revenue) as total FROM sales WHERE season_code = ?',
    [seasonCode],
  );
  return result?.total ?? 0;
}

export async function getTotalGKGSold(
  db: SQLiteDatabase,
  seasonCode: string,
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(gkg_sold) as total FROM sales WHERE season_code = ?',
    [seasonCode],
  );
  return result?.total ?? 0;
}

export async function getWeightedAvgPrice(
  db: SQLiteDatabase,
  seasonCode: string,
): Promise<number> {
  const result = await db.getFirstAsync<{ avg_price: number | null }>(
    `SELECT CASE WHEN SUM(gkg_sold) > 0
       THEN SUM(gkg_sold * price_per_kg) / SUM(gkg_sold)
       ELSE 0 END as avg_price
     FROM sales WHERE season_code = ?`,
    [seasonCode],
  );
  return result?.avg_price ?? 0;
}

export async function getTotalRevenuePaid(
  db: SQLiteDatabase,
  seasonCode: string,
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(total_revenue) as total FROM sales WHERE season_code = ? AND is_paid = 1',
    [seasonCode],
  );
  return result?.total ?? 0;
}

export async function getTotalUnpaidRevenue(
  db: SQLiteDatabase,
  seasonCode: string,
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(total_revenue) as total FROM sales WHERE season_code = ? AND is_paid = 0',
    [seasonCode],
  );
  return result?.total ?? 0;
}

export async function getSalesCount(
  db: SQLiteDatabase,
  seasonCode: string,
): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM sales WHERE season_code = ?',
    [seasonCode],
  );
  return result?.count ?? 0;
}
