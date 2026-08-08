/**
 * Pure plot helpers (no expo imports — unit-testable)
 * Tier: Multi-lahan
 */

export interface PlotArea {
  land_size_m2: number;
}

export function totalPlotArea(plots: PlotArea[]): number {
  return plots.reduce((sum, p) => sum + (p.land_size_m2 || 0), 0);
}
