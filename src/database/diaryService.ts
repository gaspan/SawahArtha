/**
 * DiaryService - Farm Diary foto progress tanaman per musim.
 */
import { type SQLiteDatabase } from 'expo-sqlite';

export type FarmingStage = 'planting' | 'vegetative' | 'generative' | 'ripening' | 'harvest';

export interface DiaryPhoto {
  id: number;
  season_code: string;
  plot_id: number | null;
  image_uri: string;
  thumbnail_uri: string | null;
  caption: string | null;
  farming_stage: FarmingStage | null;
  days_since_planting: number | null;
  latitude: number | null;
  longitude: number | null;
  weather_condition: string | null;
  file_size: number | null;
  taken_at: string;
  created_at: string;
  plot_name?: string | null;
}

export interface DiaryPhotoInput {
  imageUri: string;
  caption?: string;
  plotId?: number | null;
  farmingStage?: FarmingStage | null;
  daysSincePlanting?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  fileSize?: number | null;
  takenAt?: string;
}

/** Batas fase (hari sejak tanam): Tanam 0-7, Vegetatif 8-30, Generatif 31-60, Pematangan 61-90, Panen 90+. */
export function detectFarmingStage(daysSincePlanting: number | null | undefined): FarmingStage | null {
  if (daysSincePlanting === null || daysSincePlanting === undefined || daysSincePlanting < 0) return null;
  if (daysSincePlanting <= 7) return 'planting';
  if (daysSincePlanting <= 30) return 'vegetative';
  if (daysSincePlanting <= 60) return 'generative';
  if (daysSincePlanting <= 90) return 'ripening';
  return 'harvest';
}

export function computeDaysSincePlanting(photoDateStr: string, plantingDateStr: string): number | null {
  const photo = new Date(photoDateStr);
  const planting = new Date(`${plantingDateStr}T00:00:00`);
  if (isNaN(photo.getTime()) || isNaN(planting.getTime())) return null;
  return Math.floor((photo.getTime() - planting.getTime()) / (1000 * 60 * 60 * 24));
}

/** Tanggal Tanam paling awal di musim ini (dari jurnal), atau null bila belum ada. */
export async function getPlantingDate(db: SQLiteDatabase, seasonCode: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ date: string }>(
    `SELECT date FROM farming_activities WHERE season_code = ? AND activity_type = 'Tanam' ORDER BY date ASC LIMIT 1`,
    [seasonCode]
  );
  return row?.date ?? null;
}

export async function getDiaryPhotos(db: SQLiteDatabase, seasonCode: string): Promise<DiaryPhoto[]> {
  return db.getAllAsync<DiaryPhoto>(
    `SELECT d.*, p.name as plot_name FROM diary_photos d
     LEFT JOIN plots p ON p.id = d.plot_id
     WHERE d.season_code = ? ORDER BY d.taken_at DESC, d.id DESC`,
    [seasonCode]
  );
}

export async function addDiaryPhoto(
  db: SQLiteDatabase,
  seasonCode: string,
  input: DiaryPhotoInput
): Promise<number> {
  const takenAt = input.takenAt ?? new Date().toISOString();
  const res = await db.runAsync(
    `INSERT INTO diary_photos
     (season_code, plot_id, image_uri, caption, farming_stage, days_since_planting, latitude, longitude, file_size, taken_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      seasonCode,
      input.plotId ?? null,
      input.imageUri,
      input.caption?.trim() || null,
      input.farmingStage ?? null,
      input.daysSincePlanting ?? null,
      input.latitude ?? null,
      input.longitude ?? null,
      input.fileSize ?? null,
      takenAt,
    ]
  );
  return res.lastInsertRowId;
}

export async function getDiaryPhotoById(db: SQLiteDatabase, id: number): Promise<DiaryPhoto | null> {
  const row = await db.getFirstAsync<DiaryPhoto>('SELECT * FROM diary_photos WHERE id = ?', [id]);
  return row ?? null;
}

export async function deleteDiaryPhoto(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM diary_photos WHERE id = ?', [id]);
}
