/**
 * Database initialization for SawahArtha
 * Creates all tables and seeds default season
 */
import { type SQLiteDatabase } from 'expo-sqlite';
import { seedDefaultBudgets } from './budgetService';

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

  // Migrate: budgets table (Tier 3A - Anggaran/RAB per kategori)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_code TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      UNIQUE(season_code, category)
    );
    CREATE TABLE IF NOT EXISTS budget_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_code TEXT NOT NULL,
      category TEXT NOT NULL,
      old_amount REAL NOT NULL,
      new_amount REAL NOT NULL,
      action TEXT NOT NULL,
      changed_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_budget_logs_season
      ON budget_logs(season_code, changed_at DESC);
  `);

  // Backfill: seed default budgets for existing seasons without budgets
  try {
    const seasons = await db.getAllAsync<{ season_code: string; land_size_m2: number }>(
      'SELECT season_code, land_size_m2 FROM seasons'
    );
    for (const s of seasons) {
      const existing = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM budgets WHERE season_code = ?',
        [s.season_code]
      );
      if (!existing || existing.count === 0) {
        await seedDefaultBudgets(db, s.season_code, s.land_size_m2);
      }
    }
  } catch (error) {
    // Non-fatal: budgets table might not exist yet (fresh install)
  }

  // Migrate: Piutang Gabah (Tier 3B-1)
  try {
    await db.execAsync('ALTER TABLE income ADD COLUMN is_paid INTEGER DEFAULT 1');
  } catch (error) {
    // Column already exists
  }
  try {
    await db.execAsync('ALTER TABLE income ADD COLUMN buyer_name TEXT');
  } catch (error) {
    // Column already exists
  }
  try {
    await db.execAsync('ALTER TABLE income ADD COLUMN payment_date TEXT');
  } catch (error) {
    // Column already exists
  }
  await db.execAsync('UPDATE income SET is_paid = 1 WHERE is_paid IS NULL');

  // Migrate: Hutang Saprotan (Tier 3B-2)
  try {
    await db.execAsync('ALTER TABLE expenses ADD COLUMN is_paid INTEGER DEFAULT 1');
  } catch (error) {
    // Column already exists
  }
  try {
    await db.execAsync('ALTER TABLE expenses ADD COLUMN vendor_name TEXT');
  } catch (error) {
    // Column already exists
  }
  try {
    await db.execAsync('ALTER TABLE expenses ADD COLUMN payment_date TEXT');
  } catch (error) {
    // Column already exists
  }
  await db.execAsync('UPDATE expenses SET is_paid = 1 WHERE is_paid IS NULL');

  // Migrate: debts & debt_payments (Tier 3B-3)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_code TEXT NOT NULL,
      type TEXT NOT NULL,
      counterparty TEXT NOT NULL,
      amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      interest_rate REAL DEFAULT 0,
      due_date TEXT,
      note TEXT,
      date TEXT NOT NULL,
      is_settled INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS debt_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      debt_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_debts_season ON debts(season_code);
    CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON debt_payments(debt_id);
  `);

  // Migrate: sales table (split penjualan dari income)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_code TEXT NOT NULL,
      gkg_sold REAL NOT NULL,
      price_per_kg REAL NOT NULL,
      total_revenue REAL NOT NULL,
      buyer_name TEXT,
      is_paid INTEGER DEFAULT 1,
      payment_date TEXT,
      note TEXT,
      date TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sales_season ON sales(season_code, date DESC);
    CREATE TABLE IF NOT EXISTS _migrations (key TEXT PRIMARY KEY);
  `);

  const marker = await db.getFirstAsync<{ key: string }>(
    "SELECT key FROM _migrations WHERE key = 'sales_split_v1'"
  );
  if (!marker) {
    await db.execAsync(`
      INSERT INTO sales (season_code, gkg_sold, price_per_kg, total_revenue, buyer_name, is_paid, payment_date, date)
        SELECT season_code, gkg_weight, price_per_kg, total_revenue, buyer_name, is_paid, payment_date, date
        FROM income WHERE price_per_kg > 0;
      INSERT OR IGNORE INTO _migrations (key) VALUES ('sales_split_v1');
    `);
  }

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

  // Migrate: settings table (Tier 4 - preferensi & tema)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migrate: multi-lahan (plots) — Tier: Multi-lahan
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS plots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_code TEXT NOT NULL,
      name TEXT NOT NULL,
      land_size_m2 REAL NOT NULL DEFAULT 0,
      note TEXT,
      date TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_plots_season ON plots(season_code);
  `);

  // Migrate: plot_id on expenses/income/sales
  try {
    await db.execAsync('ALTER TABLE expenses ADD COLUMN plot_id INTEGER');
  } catch (error) {
    // Column already exists
  }
  try {
    await db.execAsync('ALTER TABLE income ADD COLUMN plot_id INTEGER');
  } catch (error) {
    // Column already exists
  }
  try {
    await db.execAsync('ALTER TABLE sales ADD COLUMN plot_id INTEGER');
  } catch (error) {
    // Column already exists
  }

  // Migrate: jurnal kegiatan tani (farming_activities)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS farming_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_code TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      plot_id INTEGER,
      note TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_activities_season ON farming_activities(season_code, date DESC);
  `);
}
