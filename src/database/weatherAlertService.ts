/**
 * WeatherAlertService - persist smart weather alerts ke SQLite.
 * Dedupe: satu alert_type hanya disimpan sekali per hari per musim.
 */
import { type SQLiteDatabase } from 'expo-sqlite';
import type { SmartWeatherAlert } from '../utils/weatherAlerts';

export interface StoredWeatherAlert {
  id: number;
  season_code: string | null;
  alert_type: string;
  title: string;
  message: string;
  priority: string;
  is_read: number;
  created_at: string;
}

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export async function getWeatherAlerts(
  db: SQLiteDatabase,
  seasonCode: string,
  limit = 20
): Promise<StoredWeatherAlert[]> {
  return db.getAllAsync<StoredWeatherAlert>(
    'SELECT * FROM weather_alerts WHERE season_code = ? ORDER BY created_at DESC, id DESC LIMIT ?',
    [seasonCode, limit]
  );
}

export async function getUnreadWeatherAlertCount(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM weather_alerts WHERE season_code = ? AND is_read = 0',
    [seasonCode]
  );
  return row?.count ?? 0;
}

export async function markWeatherAlertRead(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('UPDATE weather_alerts SET is_read = 1 WHERE id = ?', [id]);
}

export async function markAllWeatherAlertsRead(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<void> {
  await db.runAsync('UPDATE weather_alerts SET is_read = 1 WHERE season_code = ?', [seasonCode]);
}

/**
 * Simpan hasil evaluateWeatherAlerts. Kembalikan jumlah yang benar-benar baru.
 * Alert dengan type sama yang sudah ada hari ini tidak disimpan ulang.
 */
export async function syncWeatherAlerts(
  db: SQLiteDatabase,
  seasonCode: string,
  alerts: SmartWeatherAlert[]
): Promise<number> {
  if (alerts.length === 0) return 0;
  const today = todayKey();
  let inserted = 0;
  for (const a of alerts) {
    const existing = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM weather_alerts
       WHERE season_code = ? AND alert_type = ? AND substr(created_at, 1, 10) = ?
       LIMIT 1`,
      [seasonCode, a.type, today]
    );
    if (existing) continue;
    await db.runAsync(
      'INSERT INTO weather_alerts (season_code, alert_type, title, message, priority, is_read) VALUES (?, ?, ?, ?, ?, 0)',
      [seasonCode, a.type, a.title, a.message, a.priority]
    );
    inserted += 1;
  }
  return inserted;
}

export async function clearOldWeatherAlerts(
  db: SQLiteDatabase,
  keepDays = 7
): Promise<void> {
  await db.runAsync(
    `DELETE FROM weather_alerts WHERE created_at < datetime('now', ?)`,
    [`-${keepDays} days`]
  );
}
