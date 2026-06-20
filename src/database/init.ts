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
      price_per_kg REAL DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      season_code TEXT NOT NULL,
      date TEXT NOT NULL
    );
  `);

  // Seed default season if no seasons exist
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM seasons'
  );

  if (!existing || existing.count === 0) {
    await db.runAsync(
      'INSERT INTO seasons (season_code, is_active) VALUES (?, 1)',
      [DEFAULT_SEASON]
    );
  }
}
