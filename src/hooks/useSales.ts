import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useSeason } from '../context/SeasonContext';
import {
  getAllSales,
  addSale as addSaleDB,
  updateSale as updateSaleDB,
  deleteSale as deleteSaleDB,
  markSalePaid,
  getTotalRevenue,
  getTotalGKGSold,
  getWeightedAvgPrice,
  getTotalRevenuePaid,
  getTotalUnpaidRevenue,
  type Sale,
  type SaleInput,
} from '../database/salesService';

interface UseSalesReturn {
  sales: Sale[];
  totalRevenue: number;
  totalGKGSold: number;
  avgPricePerKg: number;
  totalRevenuePaid: number;
  unpaidRevenue: number;
  isLoading: boolean;
  addSale: (input: Omit<SaleInput, 'season_code'>) => Promise<void>;
  updateSale: (id: number, gkgSold: number, pricePerKg: number) => Promise<void>;
  deleteSale: (id: number) => Promise<void>;
  markPaid: (id: number, paymentDate: string) => Promise<void>;
  refreshSales: () => Promise<void>;
}

export function useSales(): UseSalesReturn {
  const db = useSQLiteContext();
  const { selectedSeason } = useSeason();
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalGKGSold, setTotalGKGSold] = useState(0);
  const [avgPricePerKg, setAvgPricePerKg] = useState(0);
  const [totalRevenuePaid, setTotalRevenuePaid] = useState(0);
  const [unpaidRevenue, setUnpaidRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSales = useCallback(async () => {
    try {
      const [records, revenue, sold, avgPrice, paid, unpaid] = await Promise.all([
        getAllSales(db, selectedSeason),
        getTotalRevenue(db, selectedSeason),
        getTotalGKGSold(db, selectedSeason),
        getWeightedAvgPrice(db, selectedSeason),
        getTotalRevenuePaid(db, selectedSeason),
        getTotalUnpaidRevenue(db, selectedSeason),
      ]);
      setSales(records);
      setTotalRevenue(revenue);
      setTotalGKGSold(sold);
      setAvgPricePerKg(avgPrice);
      setTotalRevenuePaid(paid);
      setUnpaidRevenue(unpaid);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, selectedSeason]);

  useEffect(() => {
    refreshSales();
  }, [refreshSales]);

  const addSale = useCallback(
    async (input: Omit<SaleInput, 'season_code'>) => {
      await addSaleDB(db, { ...input, season_code: selectedSeason });
      await refreshSales();
    },
    [db, selectedSeason, refreshSales],
  );

  const updateSale = useCallback(
    async (id: number, gkgSold: number, pricePerKg: number) => {
      await updateSaleDB(db, id, gkgSold, pricePerKg);
      await refreshSales();
    },
    [db, refreshSales],
  );

  const deleteSale = useCallback(
    async (id: number) => {
      await deleteSaleDB(db, id);
      await refreshSales();
    },
    [db, refreshSales],
  );

  const markPaid = useCallback(
    async (id: number, paymentDate: string) => {
      await markSalePaid(db, id, paymentDate);
      await refreshSales();
    },
    [db, refreshSales],
  );

  return {
    sales,
    totalRevenue,
    totalGKGSold,
    avgPricePerKg,
    totalRevenuePaid,
    unpaidRevenue,
    isLoading,
    addSale,
    updateSale,
    deleteSale,
    markPaid,
    refreshSales,
  };
}
