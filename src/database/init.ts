/**
 * Database initialization for SawahArtha
 * Creates all tables and seeds default season
 */
import { type SQLiteDatabase } from 'expo-sqlite';

export const DEFAULT_SEASON = 'MT-2026-1';

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS seasons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_code TEXT UNIQUE NOT NULL,
      land_size_m2 REAL DEFAULT 0,
      is_active INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      season_code TEXT NOT NULL,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gkp_weight REAL NOT NULL,
      gkg_weight REAL NOT NULL,
      gacong_type TEXT NOT NULL DEFAULT 'berat',
      gacong_input REAL DEFAULT 0,
      gacong_weight REAL DEFAULT 0,
      net_gkp REAL NOT NULL DEFAULT 0,
      price_per_kg REAL DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      season_code TEXT NOT NULL,
      date TEXT NOT NULL
    );
  `);

  // Migrate seasons table to add land_size_m2 column if it doesn't exist yet
  try {
    await db.execAsync('ALTER TABLE seasons ADD COLUMN land_size_m2 REAL DEFAULT 0');
  } catch (error) {
    // Column already exists or table isn't created yet (handled above)
  }

  // Migrate seasons table to add ref_price_per_kg column
  try {
    await db.execAsync('ALTER TABLE seasons ADD COLUMN ref_price_per_kg REAL DEFAULT 0');
  } catch (error) {
    // Column already exists
  }

  // Migrate income table to add gacong (harvest fee) columns
  try {
    await db.execAsync("ALTER TABLE income ADD COLUMN gacong_type TEXT NOT NULL DEFAULT 'berat'");
  } catch (error) {
    // Column already exists
  }
  try {
    await db.execAsync('ALTER TABLE income ADD COLUMN gacong_input REAL DEFAULT 0');
  } catch (error) {
    // Column already exists
  }
  try {
    await db.execAsync('ALTER TABLE income ADD COLUMN gacong_weight REAL DEFAULT 0');
  } catch (error) {
    // Column already exists
  }
  try {
    await db.execAsync('ALTER TABLE income ADD COLUMN net_gkp REAL');
  } catch (error) {
    // Column already exists
  }

  // Backfill legacy rows: net_gkp = gross gkp (no gacong recorded)
  await db.execAsync('UPDATE income SET net_gkp = gkp_weight WHERE net_gkp IS NULL');

  // Seed default season if no seasons exist
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM seasons'
  );

  if (!existing || existing.count === 0) {
    await db.runAsync(
      'INSERT INTO seasons (season_code, is_active, land_size_m2) VALUES (?, 1, 1400)',
      [DEFAULT_SEASON]
    );
  }
}
