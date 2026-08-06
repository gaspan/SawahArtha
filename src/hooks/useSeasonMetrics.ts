import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getAllSeasonMetrics, type SeasonMetrics } from '../database/analyticsService';

interface UseSeasonMetricsReturn {
  metrics: SeasonMetrics[];
  isLoading: boolean;
  refreshMetrics: () => Promise<void>;
}

export function useSeasonMetrics(): UseSeasonMetricsReturn {
  const db = useSQLiteContext();
  const [metrics, setMetrics] = useState<SeasonMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMetrics = useCallback(async () => {
    try {
      const data = await getAllSeasonMetrics(db);
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching season metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  return { metrics, isLoading, refreshMetrics };
}
