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
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export async function getSetting(
  db: SQLiteDatabase,
  key: SettingKey
): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(
  db: SQLiteDatabase,
  key: SettingKey,
  value: string
): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}
