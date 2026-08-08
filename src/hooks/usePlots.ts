import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useSeason } from '../context/SeasonContext';
import {
  getPlots,
  addPlot as addPlotDB,
  updatePlot as updatePlotDB,
  deletePlot as deletePlotDB,
  type Plot,
  type PlotInput,
} from '../database/plotService';

interface UsePlotsReturn {
  plots: Plot[];
  isLoading: boolean;
  addPlot: (input: PlotInput) => Promise<void>;
  updatePlot: (id: number, input: PlotInput) => Promise<void>;
  deletePlot: (id: number) => Promise<void>;
  refreshPlots: () => Promise<void>;
}

export function usePlots(): UsePlotsReturn {
  const db = useSQLiteContext();
  const { selectedSeason } = useSeason();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPlots = useCallback(async () => {
    try {
      const data = await getPlots(db, selectedSeason);
      setPlots(data);
    } catch (error) {
      console.error('Error fetching plots:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, selectedSeason]);

  useEffect(() => {
    refreshPlots();
  }, [refreshPlots]);

  const addPlot = useCallback(
    async (input: PlotInput) => {
      await addPlotDB(db, selectedSeason, input);
      await refreshPlots();
    },
    [db, selectedSeason, refreshPlots]
  );

  const updatePlot = useCallback(
    async (id: number, input: PlotInput) => {
      await updatePlotDB(db, id, input);
      await refreshPlots();
    },
    [db, refreshPlots]
  );

  const deletePlot = useCallback(
    async (id: number) => {
      await deletePlotDB(db, id);
      await refreshPlots();
    },
    [db, refreshPlots]
  );

  return { plots, isLoading, addPlot, updatePlot, deletePlot, refreshPlots };
}
