/**
 * PlotService - Multi-lahan (petak lahan dalam satu musim)
 */
import { type SQLiteDatabase } from 'expo-sqlite';
import { totalPlotArea } from '../utils/plotCore';

export { totalPlotArea };

export interface Plot {
  id: number;
  season_code: string;
  name: string;
  land_size_m2: number;
  note: string | null;
  date: string;
  location_type?: 'none' | 'point' | 'polygon';
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy?: number | null;
  polygon_coords?: string | null;
  calculated_area?: number | null;
  address?: string | null;
  location_tagged_at?: string | null;
}

export interface PlotInput {
  name: string;
  landSizeM2: number;
  note?: string;
  location_type?: 'none' | 'point' | 'polygon';
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy?: number | null;
  polygon_coords?: string | null;
  calculated_area?: number | null;
  address?: string | null;
  location_tagged_at?: string | null;
}

export async function getPlots(
  db: SQLiteDatabase,
  seasonCode: string
): Promise<Plot[]> {
  return db.getAllAsync<Plot>(
    'SELECT * FROM plots WHERE season_code = ? ORDER BY id ASC',
    [seasonCode]
  );
}

export async function addPlot(
  db: SQLiteDatabase,
  seasonCode: string,
  input: PlotInput
): Promise<void> {
  await db.runAsync(
    `INSERT INTO plots (
      season_code, name, land_size_m2, note, date,
      location_type, latitude, longitude, location_accuracy,
      polygon_coords, calculated_area, address, location_tagged_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      seasonCode,
      input.name,
      input.landSizeM2,
      input.note ?? null,
      new Date().toISOString().split('T')[0],
      input.location_type ?? 'none',
      input.latitude ?? null,
      input.longitude ?? null,
      input.location_accuracy ?? null,
      input.polygon_coords ?? null,
      input.calculated_area ?? null,
      input.address ?? null,
      input.location_tagged_at ?? (input.latitude || input.polygon_coords ? new Date().toISOString() : null),
    ]
  );
}

export async function updatePlot(
  db: SQLiteDatabase,
  id: number,
  input: PlotInput
): Promise<void> {
  await db.runAsync(
    `UPDATE plots SET
      name = ?, land_size_m2 = ?, note = ?,
      location_type = ?, latitude = ?, longitude = ?, location_accuracy = ?,
      polygon_coords = ?, calculated_area = ?, address = ?, location_tagged_at = ?
    WHERE id = ?`,
    [
      input.name,
      input.landSizeM2,
      input.note ?? null,
      input.location_type ?? 'none',
      input.latitude ?? null,
      input.longitude ?? null,
      input.location_accuracy ?? null,
      input.polygon_coords ?? null,
      input.calculated_area ?? null,
      input.address ?? null,
      input.location_tagged_at ?? (input.latitude || input.polygon_coords ? new Date().toISOString() : null),
      id,
    ]
  );
}

export async function deletePlot(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM plots WHERE id = ?', [id]);
    await db.runAsync(
      'UPDATE expenses SET plot_id = NULL WHERE plot_id = ?',
      [id]
    );
    await db.runAsync(
      'UPDATE income SET plot_id = NULL WHERE plot_id = ?',
      [id]
    );
    await db.runAsync(
      'UPDATE sales SET plot_id = NULL WHERE plot_id = ?',
      [id]
    );
    await db.runAsync(
      'UPDATE farming_activities SET plot_id = NULL WHERE plot_id = ?',
      [id]
    );
  });
}
