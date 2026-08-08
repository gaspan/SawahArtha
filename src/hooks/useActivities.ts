import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useSeason } from '../context/SeasonContext';
import {
  getActivities,
  addActivity as addActivityDB,
  deleteActivity as deleteActivityDB,
  type FarmingActivity,
  type ActivityInput,
  type ActivityType,
} from '../database/activityService';

interface UseActivitiesReturn {
  activities: FarmingActivity[];
  isLoading: boolean;
  addActivity: (input: ActivityInput) => Promise<void>;
  deleteActivity: (id: number) => Promise<void>;
  refreshActivities: () => Promise<void>;
}

export function useActivities(): UseActivitiesReturn {
  const db = useSQLiteContext();
  const { selectedSeason } = useSeason();
  const [activities, setActivities] = useState<FarmingActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshActivities = useCallback(async () => {
    try {
      const data = await getActivities(db, selectedSeason);
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, selectedSeason]);

  useEffect(() => {
    refreshActivities();
  }, [refreshActivities]);

  const addActivity = useCallback(
    async (input: ActivityInput) => {
      await addActivityDB(db, selectedSeason, input);
      await refreshActivities();
    },
    [db, selectedSeason, refreshActivities]
  );

  const deleteActivity = useCallback(
    async (id: number) => {
      await deleteActivityDB(db, id);
      await refreshActivities();
    },
    [db, refreshActivities]
  );

  return { activities, isLoading, addActivity, deleteActivity, refreshActivities };
}

export type { ActivityType };
