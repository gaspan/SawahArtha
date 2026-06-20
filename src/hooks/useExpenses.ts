/**
 * useExpenses hook
 * Manages expense state with SQLite persistence, filtered by selected season
 */
import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useSeason } from '../context/SeasonContext';
import {
  getAllExpenses,
  addExpense as addExpenseDB,
  deleteExpense as deleteExpenseDB,
  getExpensesByCategory,
  getTotalExpenses,
  type Expense,
  type ExpenseInput,
  type CategoryTotal,
} from '../database/expenseService';

interface UseExpensesReturn {
  expenses: Expense[];
  categoryTotals: CategoryTotal[];
  totalExpenses: number;
  isLoading: boolean;
  addExpense: (input: Omit<ExpenseInput, 'season_code'>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  refreshExpenses: () => Promise<void>;
}

export function useExpenses(): UseExpensesReturn {
  const db = useSQLiteContext();
  const { selectedSeason } = useSeason();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshExpenses = useCallback(async () => {
    try {
      const [allExpenses, catTotals, total] = await Promise.all([
        getAllExpenses(db, selectedSeason),
        getExpensesByCategory(db, selectedSeason),
        getTotalExpenses(db, selectedSeason),
      ]);
      setExpenses(allExpenses);
      setCategoryTotals(catTotals);
      setTotalExpenses(total);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, selectedSeason]);

  useEffect(() => {
    refreshExpenses();
  }, [refreshExpenses]);

  const addExpense = useCallback(
    async (input: Omit<ExpenseInput, 'season_code'>) => {
      try {
        await addExpenseDB(db, { ...input, season_code: selectedSeason });
        await refreshExpenses();
      } catch (error) {
        console.error('Error adding expense:', error);
        throw error;
      }
    },
    [db, selectedSeason, refreshExpenses]
  );

  const deleteExpense = useCallback(
    async (id: number) => {
      try {
        await deleteExpenseDB(db, id);
        await refreshExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
        throw error;
      }
    },
    [db, refreshExpenses]
  );

  return {
    expenses,
    categoryTotals,
    totalExpenses,
    isLoading,
    addExpense,
    deleteExpense,
    refreshExpenses,
  };
}
