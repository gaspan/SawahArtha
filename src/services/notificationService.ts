/**
 * NotificationService (Tier 5)
 * Local scheduled notifications via expo-notifications:
 *  - Reminder jatuh tempo hutang (H-3 & H-0, lalu harian jika overdue)
 *  - Peringatan anggaran terlampaui (harian saat ada kategori >= 80%)
 *  - Pengingat jadwal tani (harian, opsional)
 *
 * Expo Go (SDK 53+) removed expo-notifications — importing/requiring it at
 * runtime crashes the JS environment. We detect Expo Go via Constants and
 * skip ALL expo-notifications access in that environment.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { type SQLiteDatabase } from 'expo-sqlite';
import { getSetting, SETTING_KEYS } from '../database/settingsService';
import {
  computeDebtNotifications,
  computeBudgetWarningBody,
  REMINDER_HOUR,
  FARM_HOUR,
  type PlannedNotification,
} from '../utils/notificationCore';

const IS_EXPO_GO = Constants.expoGoConfig != null;

const CHANNEL_ID = 'sawahartha';
const DAILY_BUDGET_ID = 'budget_daily';
const DAILY_FARM_ID = 'farm_daily';

type NotifApi = typeof import('expo-notifications');

let _checked = false;
let _apiCache: NotifApi | null = null;

function getNotificationsApi(): NotifApi | null {
  if (IS_EXPO_GO) return null;
  if (_checked) return _apiCache;
  _checked = true;
  try {
    _apiCache = require('expo-notifications');
  } catch {
    _apiCache = null;
  }
  return _apiCache;
}

export function isNotificationsAvailable(): boolean {
  return getNotificationsApi() !== null;
}

function ensureApi(): NonNullable<ReturnType<typeof getNotificationsApi>> {
  const api = getNotificationsApi();
  if (!api) throw new Error('expo-notifications tidak tersedia');
  return api;
}

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const N = getNotificationsApi();
  if (!N) return;
  await N.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Pengingat SawahArtha',
    importance: N.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#059669',
  });
}

export async function hasNotificationPermission(): Promise<boolean> {
  const N = getNotificationsApi();
  if (!N) return false;
  const s = await N.getPermissionsAsync();
  return s.granted || s.ios?.status === N.IosAuthorizationStatus.PROVISIONAL;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!getNotificationsApi()) return false;
  if (await hasNotificationPermission()) return true;
  const N = ensureApi();
  const res = await N.requestPermissionsAsync();
  return res.granted || res.ios?.status === N.IosAuthorizationStatus.PROVISIONAL;
}

export async function notificationsEnabled(db: SQLiteDatabase): Promise<boolean> {
  const raw = await getSetting(db, SETTING_KEYS.notificationsEnabled);
  return raw === '1';
}

export async function farmReminderEnabled(db: SQLiteDatabase): Promise<boolean> {
  const raw = await getSetting(db, SETTING_KEYS.farmReminderEnabled);
  return raw === '1';
}

async function schedulePlanned(planned: PlannedNotification[]): Promise<void> {
  const N = ensureApi();
  const now = Date.now();
  for (const p of planned) {
    if (p.triggerAt.getTime() <= now) continue;
    await N.scheduleNotificationAsync({
      identifier: p.id,
      content: { title: p.title, body: p.body, sound: false },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DATE,
        date: p.triggerAt,
        channelId: CHANNEL_ID,
      },
    });
  }
}

async function scheduleDaily(
  id: string,
  title: string,
  body: string,
  hour: number
): Promise<void> {
  const N = ensureApi();
  await N.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, sound: false },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
      channelId: CHANNEL_ID,
    },
  });
}

export async function syncScheduledNotifications(
  db: SQLiteDatabase
): Promise<void> {
  const N = getNotificationsApi();
  if (!N) return;
  await ensureNotificationChannel();
  if (!(await hasNotificationPermission())) return;
  const on = await notificationsEnabled(db);
  await N.cancelAllScheduledNotificationsAsync();
  if (!on) return;

  const debts = await db.getAllAsync<{
    id: number; counterparty: string; amount: number; due_date: string | null; is_settled: number;
  }>("SELECT id, counterparty, amount, due_date, is_settled FROM debts WHERE is_settled = 0 AND due_date IS NOT NULL");

  const budgets = await db.getAllAsync<{ category: string; percentUsed: number }>(`
    SELECT b.category AS category,
           COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.season_code = b.season_code AND e.category = b.category), 0)
           / NULLIF(b.amount, 0) * 100 AS percentUsed
    FROM budgets b
  `);

  const budgetBody = computeBudgetWarningBody(budgets);
  if (budgetBody) {
    await scheduleDaily(
      DAILY_BUDGET_ID,
      'Anggaran melebihi batas 📊',
      budgetBody,
      REMINDER_HOUR
    );
  }

  if (await farmReminderEnabled(db)) {
    await scheduleDaily(
      DAILY_FARM_ID,
      'Pengingat jadwal tani 🌾',
      'Jangan lupa cek jadwal kegiatan tani Anda hari ini.',
      FARM_HOUR
    );
  }

  await schedulePlanned(computeDebtNotifications(debts, new Date()));
}

export async function sendTestNotification(): Promise<void> {
  const N = ensureApi();
  await ensureNotificationChannel();
  await N.scheduleNotificationAsync({
    content: {
      title: 'Notifikasi SawahArtha 🔔',
      body: 'Pengingat berfungsi! Jatuh tempo hutang & anggaran akan dikirim otomatis.',
      sound: false,
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: CHANNEL_ID,
    },
  });
}
