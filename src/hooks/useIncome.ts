import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useSeason } from '../context/SeasonContext';
import {
  getAllIncome,
  addIncome as addIncomeDB,
  deleteIncome as deleteIncomeDB,
  updateIncomeGKG as updateIncomeGKGDB,
  getTotalGKG,
  getTotalGKP,
  getTotalGacongWeight,
  type Income,
  type IncomeInput,
} from '../database/incomeService';

interface UseIncomeReturn {
  incomeRecords: Income[];
  totalGKG: number;
  totalGKP: number;
  totalGacongWeight: number;
  isLoading: boolean;
  addIncome: (input: Omit<IncomeInput, 'season_code'>) => Promise<void>;
  deleteIncome: (id: number) => Promise<void>;
  updateIncomeGKG: (id: number, gkgWeight: number) => Promise<void>;
  refreshIncome: () => Promise<void>;
}

export function useIncome(): UseIncomeReturn {
  const db = useSQLiteContext();
  const { selectedSeason } = useSeason();
  const [incomeRecords, setIncomeRecords] = useState<Income[]>([]);
  const [totalGKG, setTotalGKG] = useState(0);
  const [totalGKP, setTotalGKP] = useState(0);
  const [totalGacongWeight, setTotalGacongWeight] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshIncome = useCallback(async () => {
    try {
      const [records, gkg, gkp, gacong] = await Promise.all([
        getAllIncome(db, selectedSeason),
        getTotalGKG(db, selectedSeason),
        getTotalGKP(db, selectedSeason),
        getTotalGacongWeight(db, selectedSeason),
      ]);
      setIncomeRecords(records);
      setTotalGKG(gkg);
      setTotalGKP(gkp);
      setTotalGacongWeight(gacong);
    } catch (error) {
      console.error('Error fetching income:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, selectedSeason]);

  useEffect(() => {
    refreshIncome();
  }, [refreshIncome]);

  const addIncome = useCallback(
    async (input: Omit<IncomeInput, 'season_code'>) => {
      try {
        await addIncomeDB(db, { ...input, season_code: selectedSeason });
        await refreshIncome();
      } catch (error) {
        console.error('Error adding income:', error);
        throw error;
      }
    },
    [db, selectedSeason, refreshIncome]
  );

  const deleteIncome = useCallback(
    async (id: number) => {
      try {
        await deleteIncomeDB(db, id);
        await refreshIncome();
      } catch (error) {
        console.error('Error deleting income:', error);
        throw error;
      }
    },
    [db, refreshIncome]
  );

  const updateIncomeGKG = useCallback(
    async (id: number, gkgWeight: number) => {
      try {
        await updateIncomeGKGDB(db, id, gkgWeight);
        await refreshIncome();
      } catch (error) {
        console.error('Error updating income GKG:', error);
        throw error;
      }
    },
    [db, refreshIncome]
  );

  return {
    incomeRecords,
    totalGKG,
    totalGKP,
    totalGacongWeight,
    isLoading,
    addIncome,
    deleteIncome,
    updateIncomeGKG,
    refreshIncome,
  };
}
