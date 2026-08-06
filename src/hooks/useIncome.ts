/**
 * useIncome hook
 * Manages harvest income state with SQLite persistence, filtered by selected season
 * Includes price update functionality for deferred grain sales
 */
import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useSeason } from '../context/SeasonContext';
import {
  getAllIncome,
  addIncome as addIncomeDB,
  updateIncomePrice as updateIncomePriceDB,
  deleteIncome as deleteIncomeDB,
  getTotalRevenue,
  getTotalGKG,
  getTotalGKP,
  getAveragePricePerKg,
  getUnsoldGKG,
  getTotalRevenueSold,
  getGacongValueRp,
  type Income,
  type IncomeInput,
} from '../database/incomeService';

interface UseIncomeReturn {
  incomeRecords: Income[];
  totalRevenue: number;
  totalGKG: number;
  totalGKP: number;
  avgPricePerKg: number;
  unsoldGKG: number;
  totalRevenueSold: number;
  gacongValueRp: number;
  isLoading: boolean;
  addIncome: (input: Omit<IncomeInput, 'season_code'>) => Promise<void>;
  updatePrice: (id: number, pricePerKg: number) => Promise<void>;
  deleteIncome: (id: number) => Promise<void>;
  refreshIncome: () => Promise<void>;
}

export function useIncome(): UseIncomeReturn {
  const db = useSQLiteContext();
  const { selectedSeason } = useSeason();
  const [incomeRecords, setIncomeRecords] = useState<Income[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalGKG, setTotalGKG] = useState(0);
  const [totalGKP, setTotalGKP] = useState(0);
  const [avgPricePerKg, setAvgPricePerKg] = useState(0);
  const [unsoldGKG, setUnsoldGKG] = useState(0);
  const [totalRevenueSold, setTotalRevenueSold] = useState(0);
  const [gacongValueRp, setGacongValueRp] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshIncome = useCallback(async () => {
    try {
      const [records, revenue, gkg, gkp, avgPrice, unsold, revSold, gacongVal] = await Promise.all([
        getAllIncome(db, selectedSeason),
        getTotalRevenue(db, selectedSeason),
        getTotalGKG(db, selectedSeason),
        getTotalGKP(db, selectedSeason),
        getAveragePricePerKg(db, selectedSeason),
        getUnsoldGKG(db, selectedSeason),
        getTotalRevenueSold(db, selectedSeason),
        getGacongValueRp(db, selectedSeason),
      ]);
      setIncomeRecords(records);
      setTotalRevenue(revenue);
      setTotalGKG(gkg);
      setTotalGKP(gkp);
      setAvgPricePerKg(avgPrice);
      setUnsoldGKG(unsold);
      setTotalRevenueSold(revSold);
      setGacongValueRp(gacongVal);
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

  const updatePrice = useCallback(
    async (id: number, pricePerKg: number) => {
      try {
        await updateIncomePriceDB(db, id, pricePerKg);
        await refreshIncome();
      } catch (error) {
        console.error('Error updating price:', error);
        throw error;
      }
    },
    [db, refreshIncome]
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

  return {
    incomeRecords,
    totalRevenue,
    totalGKG,
    totalGKP,
    avgPricePerKg,
    unsoldGKG,
    totalRevenueSold,
    gacongValueRp,
    isLoading,
    addIncome,
    updatePrice,
    deleteIncome,
    refreshIncome,
  };
}
