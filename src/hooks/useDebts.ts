import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useSeason } from '../context/SeasonContext';
import {
  getDebts,
  getTotalLoanIn,
  getTotalLoanOut,
  getOverdueCount,
  addDebt as addDebtDB,
  addPayment as addPaymentDB,
  deleteDebt as deleteDebtDB,
  type Debt,
  type DebtInput,
  type DebtPayment,
} from '../database/debtService';

interface UseDebtsReturn {
  debts: Debt[];
  loanIn: Debt[];
  loanOut: Debt[];
  totalLoanIn: number;
  totalLoanOut: number;
  overdueCount: number;
  isLoading: boolean;
  addDebt: (debt: Omit<DebtInput, 'season_code'>) => Promise<void>;
  addPayment: (debtId: number, amount: number, paymentDate: string, note?: string) => Promise<void>;
  deleteDebt: (id: number) => Promise<void>;
  refreshDebts: () => Promise<void>;
}

export function useDebts(): UseDebtsReturn {
  const db = useSQLiteContext();
  const { selectedSeason } = useSeason();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loanIn, setLoanIn] = useState<Debt[]>([]);
  const [loanOut, setLoanOut] = useState<Debt[]>([]);
  const [totalLoanIn, setTotalLoanIn] = useState(0);
  const [totalLoanOut, setTotalLoanOut] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshDebts = useCallback(async () => {
    try {
      const [all, loanInData, loanOutData, totalIn, totalOut, overdue] = await Promise.all([
        getDebts(db, selectedSeason),
        getDebts(db, selectedSeason, 'loan_in'),
        getDebts(db, selectedSeason, 'loan_out'),
        getTotalLoanIn(db, selectedSeason),
        getTotalLoanOut(db, selectedSeason),
        getOverdueCount(db, selectedSeason),
      ]);
      setDebts(all);
      setLoanIn(loanInData);
      setLoanOut(loanOutData);
      setTotalLoanIn(totalIn);
      setTotalLoanOut(totalOut);
      setOverdueCount(overdue);
    } catch (error) {
      console.error('Error fetching debts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, selectedSeason]);

  useEffect(() => {
    refreshDebts();
  }, [refreshDebts]);

  const addDebt = useCallback(
    async (debt: Omit<DebtInput, 'season_code'>) => {
      await addDebtDB(db, { ...debt, season_code: selectedSeason });
      await refreshDebts();
    },
    [db, selectedSeason, refreshDebts],
  );

  const addPayment = useCallback(
    async (debtId: number, amount: number, paymentDate: string, note?: string) => {
      await addPaymentDB(db, debtId, amount, paymentDate, note);
      await refreshDebts();
    },
    [db, refreshDebts],
  );

  const deleteDebt = useCallback(
    async (id: number) => {
      await deleteDebtDB(db, id);
      await refreshDebts();
    },
    [db, refreshDebts],
  );

  return {
    debts,
    loanIn,
    loanOut,
    totalLoanIn,
    totalLoanOut,
    overdueCount,
    isLoading,
    addDebt,
    addPayment,
    deleteDebt,
    refreshDebts,
  };
}
