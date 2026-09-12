/**
 * SettingsService - Key-value preferences store (Tier 4)
 */
import { type SQLiteDatabase } from 'expo-sqlite';

export const SETTING_KEYS = {
  theme: 'theme', // 'light' | 'dark' | 'system'
  fontScale: 'font_scale', // 'small' | 'medium' | 'large'
  numberFormat: 'number_format', // 'dot' | 'comma'
  defaultLandSize: 'default_land_size',
  defaultRefPrice: 'default_ref_price',
  lastBackupAt: 'last_backup_at',
  notificationsEnabled: 'notifications_enabled', // '1' | '0'
  farmReminderEnabled: 'farm_reminder_enabled', // '1' | '0'
  rendemenRatio: 'rendemen_ratio', // '0.6' GKG → beras milling yield
  appsScriptUrl: 'apps_script_url',
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export async function getAllSettings(
  db: SQLiteDatabase
): Promise<Record<string, string>> {
  try {
    const rows = await db.getAllAsync<{ key: string; value: string }>(
      'SELECT key, value FROM settings'
    );
    const map: Record<string, string> = {};
    for (const r of rows) {
      map[r.key] = r.value;
    }
    return map;
  } catch (error: any) {
    if (
      error?.message?.includes('already released') ||
      error?.message?.includes('closed') ||
      error?.message?.includes('no such table')
    ) {
      return {};
    }
    throw error;
  }
}

export async function getSetting(
  db: SQLiteDatabase,
  key: SettingKey
): Promise<string | null> {
  try {
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [key]
    );
    return row?.value ?? null;
  } catch (error: any) {
    if (
      error?.message?.includes('already released') ||
      error?.message?.includes('closed') ||
      error?.message?.includes('no such table')
    ) {
      return null;
    }
    throw error;
  }
}

export async function setSetting(
  db: SQLiteDatabase,
  key: SettingKey,
  value: string
): Promise<void> {
  try {
    await db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [key, value]
    );
  } catch (error: any) {
    if (
      error?.message?.includes('already released') ||
      error?.message?.includes('closed')
    ) {
      return;
    }
    throw error;
  }
}

