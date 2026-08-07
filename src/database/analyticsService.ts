/**
 * Cross-season analytics queries
 * Aggregates expense/income totals per season for comparison charts.
 */
import { type SQLiteDatabase } from 'expo-sqlite';

export interface SeasonMetrics {
  id: number;
  season_code: string;
  land_size_m2: number;
  totalExpenses: number;
  totalRevenue: number;
  totalGKG: number;
  totalGKP: number;
  avgPricePerKg: number;
}

export async function getAllSeasonMetrics(
  db: SQLiteDatabase,
): Promise<SeasonMetrics[]> {
  return db.getAllAsync<SeasonMetrics>(
    `SELECT
      s.id,
      s.season_code,
      s.land_size_m2,
      COALESCE(e.total_expenses, 0) AS totalExpenses,
      COALESCE(sa.total_revenue, 0) AS totalRevenue,
      COALESCE(i.total_gkg, 0) AS totalGKG,
      COALESCE(i.total_gkp, 0) AS totalGKP,
      COALESCE(sa.avg_price, 0) AS avgPricePerKg
    FROM seasons s
    LEFT JOIN (
      SELECT season_code, SUM(amount) AS total_expenses
      FROM expenses GROUP BY season_code
    ) e ON s.season_code = e.season_code
    LEFT JOIN (
      SELECT
        season_code,
        SUM(gkg_weight) AS total_gkg,
        SUM(gkp_weight) AS total_gkp
      FROM income GROUP BY season_code
    ) i ON s.season_code = i.season_code
    LEFT JOIN (
      SELECT
        season_code,
        SUM(total_revenue) AS total_revenue,
        CASE WHEN SUM(gkg_sold) > 0
          THEN SUM(gkg_sold * price_per_kg) / SUM(gkg_sold)
          ELSE 0 END AS avg_price
      FROM sales GROUP BY season_code
    ) sa ON s.season_code = sa.season_code
    ORDER BY s.id ASC`
  );
}
