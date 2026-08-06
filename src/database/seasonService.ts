/**
 * Season database service
 * Manages farming seasons (Musim Tanam)
 */
import { type SQLiteDatabase } from 'expo-sqlite';

export interface Season {
  id: number;
  season_code: string;
  land_size_m2: number;
  ref_price_per_kg: number;
  is_active: number;
}

export async function getAllSeasons(db: SQLiteDatabase): Promise<Season[]> {
  return db.getAllAsync<Season>('SELECT * FROM seasons ORDER BY id DESC');
}

export async function getActiveSeason(db: SQLiteDatabase): Promise<Season | null> {
  return db.getFirstAsync<Season>(
    'SELECT * FROM seasons WHERE is_active = 1 LIMIT 1'
  );
}

export async function addSeason(
  db: SQLiteDatabase,
  seasonCode: string,
  landSizeM2: number
): Promise<void> {
  await db.withTransactionAsync(async () => {
    // Deactivate all existing seasons
    await db.runAsync('UPDATE seasons SET is_active = 0');
    // Insert and activate the new season
    await db.runAsync(
      'INSERT INTO seasons (season_code, is_active, land_size_m2) VALUES (?, 1, ?)',
      [seasonCode, landSizeM2]
    );
  });
}

export async function setActiveSeason(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE seasons SET is_active = 0');
    await db.runAsync(
      'UPDATE seasons SET is_active = 1 WHERE season_code = ?',
      [seasonCode]
    );
  });
}

export async function updateSeasonLandSize(
  db: SQLiteDatabase,
  seasonCode: string,
  landSizeM2: number
): Promise<void> {
  await db.runAsync(
    'UPDATE seasons SET land_size_m2 = ? WHERE season_code = ?',
    [landSizeM2, seasonCode]
  );
}

export async function updateSeasonRefPrice(
  db: SQLiteDatabase,
  seasonCode: string,
  refPricePerKg: number
): Promise<void> {
  await db.runAsync(
    'UPDATE seasons SET ref_price_per_kg = ? WHERE season_code = ?',
    [refPricePerKg, seasonCode]
  );
}
