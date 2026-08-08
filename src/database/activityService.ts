/**
 * ActivityService - Jurnal kegiatan tani
 * Tanam / Pupuk / Semprot / Panen / Lainnya, dengan tanggal & plot opsional.
 */
import { type SQLiteDatabase } from 'expo-sqlite';

export const ACTIVITY_TYPES = [
  'Tanam',
  'Pupuk',
  'Semprot',
  'Panen',
  'Lainnya',
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface FarmingActivity {
  id: number;
  season_code: string;
  activity_type: ActivityType;
  title: string;
  date: string;
  plot_id: number | null;
  note: string | null;
}

export interface ActivityInput {
  activityType: ActivityType;
  title: string;
  date: string;
  plotId?: number | null;
  note?: string;
}

export async function getActivities(
  db: SQLiteDatabase,
  seasonCode: string,
  activityType?: ActivityType
): Promise<FarmingActivity[]> {
  if (activityType) {
    return db.getAllAsync<FarmingActivity>(
      'SELECT * FROM farming_activities WHERE season_code = ? AND activity_type = ? ORDER BY date DESC, id DESC',
      [seasonCode, activityType]
    );
  }
  return db.getAllAsync<FarmingActivity>(
    'SELECT * FROM farming_activities WHERE season_code = ? ORDER BY date DESC, id DESC',
    [seasonCode]
  );
}

export async function addActivity(
  db: SQLiteDatabase,
  seasonCode: string,
  input: ActivityInput
): Promise<void> {
  await db.runAsync(
    'INSERT INTO farming_activities (season_code, activity_type, title, date, plot_id, note) VALUES (?, ?, ?, ?, ?, ?)',
    [
      seasonCode,
      input.activityType,
      input.title,
      input.date,
      input.plotId ?? null,
      input.note ?? null,
    ]
  );
}

export async function deleteActivity(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM farming_activities WHERE id = ?', [id]);
}
