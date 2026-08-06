/**
 * SeasonContext - Global season state management
 * Provides selectedSeason across all tabs and components
 */
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import {
  getAllSeasons,
  getActiveSeason,
  addSeason as addSeasonDB,
  setActiveSeason as setActiveSeasonDB,
  updateSeasonLandSize as updateSeasonLandSizeDB,
  updateSeasonRefPrice as updateSeasonRefPriceDB,
  type Season,
} from '../database/seasonService';

interface SeasonContextType {
  selectedSeason: string;
  seasons: Season[];
  isLoading: boolean;
  switchSeason: (seasonCode: string) => Promise<void>;
  createNewSeason: (seasonCode: string, landSizeM2: number) => Promise<void>;
  updateLandSize: (seasonCode: string, landSizeM2: number) => Promise<void>;
  updateRefPrice: (seasonCode: string, refPrice: number) => Promise<void>;
  refreshSeasons: () => Promise<void>;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

export function SeasonProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSeasons = useCallback(async () => {
    try {
      const allSeasons = await getAllSeasons(db);
      setSeasons(allSeasons);
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  }, [db]);

  // Initial load: get active season and all seasons
  useEffect(() => {
    const init = async () => {
      try {
        const active = await getActiveSeason(db);
        const allSeasons = await getAllSeasons(db);
        setSeasons(allSeasons);
        if (active) {
          setSelectedSeason(active.season_code);
        } else if (allSeasons.length > 0) {
          setSelectedSeason(allSeasons[0].season_code);
        }
      } catch (error) {
        console.error('Error initializing seasons:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [db]);

  const switchSeason = useCallback(async (seasonCode: string) => {
    try {
      await setActiveSeasonDB(db, seasonCode);
      setSelectedSeason(seasonCode);
      await refreshSeasons();
    } catch (error) {
      console.error('Error switching season:', error);
    }
  }, [db, refreshSeasons]);

  const createNewSeason = useCallback(async (seasonCode: string, landSizeM2: number) => {
    try {
      await addSeasonDB(db, seasonCode, landSizeM2);
      setSelectedSeason(seasonCode);
      await refreshSeasons();
    } catch (error) {
      console.error('Error creating season:', error);
      throw error;
    }
  }, [db, refreshSeasons]);

  const updateLandSize = useCallback(async (seasonCode: string, landSizeM2: number) => {
    try {
      await updateSeasonLandSizeDB(db, seasonCode, landSizeM2);
      await refreshSeasons();
    } catch (error) {
      console.error('Error updating land size:', error);
      throw error;
    }
  }, [db, refreshSeasons]);

  const updateRefPrice = useCallback(async (seasonCode: string, refPrice: number) => {
    try {
      await updateSeasonRefPriceDB(db, seasonCode, refPrice);
      await refreshSeasons();
    } catch (error) {
      console.error('Error updating ref price:', error);
      throw error;
    }
  }, [db, refreshSeasons]);

  if (isLoading || !selectedSeason) {
    return null; // or a loading spinner
  }

  return (
    <SeasonContext.Provider
      value={{
        selectedSeason,
        seasons,
        isLoading,
        switchSeason,
        createNewSeason,
        updateLandSize,
        updateRefPrice,
        refreshSeasons,
      }}
    >
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason(): SeasonContextType {
  const context = useContext(SeasonContext);
  if (!context) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
}
