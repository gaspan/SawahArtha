import { type SQLiteDatabase } from 'expo-sqlite';

export interface Income {
  id: number;
  gkp_weight: number;
  gkg_weight: number;
  gacong_type: string;
  gacong_input: number;
  gacong_weight: number;
  net_gkp: number;
  season_code: string;
  date: string;
}

export interface IncomeInput {
  gkp_weight: number;
  gkg_weight: number;
  gacong_type: string;
  gacong_input: number;
  gacong_weight: number;
  net_gkp: number;
  season_code: string;
}

export async function getAllIncome(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<Income[]> {
  return db.getAllAsync<Income>(
    'SELECT id, gkp_weight, gkg_weight, gacong_type, gacong_input, gacong_weight, net_gkp, season_code, date FROM income WHERE season_code = ? ORDER BY date DESC, id DESC',
    [seasonCode]
  );
}

export async function addIncome(
  db: SQLiteDatabase,
  income: IncomeInput
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO income (gkp_weight, gkg_weight, gacong_type, gacong_input, gacong_weight, net_gkp, season_code, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      income.gkp_weight,
      income.gkg_weight,
      income.gacong_type,
      income.gacong_input,
      income.gacong_weight,
      income.net_gkp,
      income.season_code,
      new Date().toISOString().split('T')[0],
    ]
  );
  return result.lastInsertRowId;
}

export async function deleteIncome(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM income WHERE id = ?', [id]);
}

export function isValidGKG(value: number): boolean {
  return value > 0 && isFinite(value) && !isNaN(value);
}

export async function updateIncomeGKG(
  db: SQLiteDatabase,
  id: number,
  gkgWeight: number,
): Promise<void> {
  await db.runAsync('UPDATE income SET gkg_weight = ? WHERE id = ?', [gkgWeight, id]);
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

export async function getTotalGacongWeight(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<number> {
  const result = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(gacong_weight) as total FROM income WHERE season_code = ?',
    [seasonCode]
  );
  return result?.total ?? 0;
}
