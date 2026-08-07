/**
 * useExpenses hook
 * Manages expense state with SQLite persistence, filtered by selected season.
 * Supports lazy-load pagination and category filtering for the history list.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useSeason } from '../context/SeasonContext';
import {
  getExpensesPaginated,
  countExpenses,
  addExpense as addExpenseDB,
  deleteExpense as deleteExpenseDB,
  updateExpense as updateExpenseDB,
  getExpensesByCategory,
  getTotalExpenses,
  getTotalUnpaidExpenses,
  markExpensePaid,
  EXPENSES_PAGE_SIZE,
  type Expense,
  type ExpenseInput,
  type CategoryTotal,
} from '../database/expenseService';

interface UseExpensesReturn {
  expenses: Expense[];
  categoryTotals: CategoryTotal[];
  totalExpenses: number;
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  unpaidAmount: number;
  addExpense: (input: Omit<ExpenseInput, 'season_code'>) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  updateExpense: (id: number, input: Omit<ExpenseInput, 'season_code'>) => Promise<void>;
  markPaid: (id: number, paymentDate: string) => Promise<void>;
  refreshExpenses: (category?: string | null) => Promise<void>;
  loadMoreExpenses: () => Promise<void>;
}

export function useExpenses(): UseExpensesReturn {
  const db = useSQLiteContext();
  const { selectedSeason } = useSeason();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [unpaidAmount, setUnpaidAmount] = useState(0);
  const categoryRef = useRef<string | null>(null);
  const offsetRef = useRef(0);
  const countRef = useRef(0);

  const refreshExpenses = useCallback(
    async (category?: string | null) => {
      if (category !== undefined) {
        categoryRef.current = category;
      }
      offsetRef.current = 0;
      try {
        setIsLoading(true);
        const cat = categoryRef.current;
        const [page, count, catTotals, total, unpaid] = await Promise.all([
          getExpensesPaginated(db, selectedSeason, cat, EXPENSES_PAGE_SIZE, 0),
          countExpenses(db, selectedSeason, cat),
          getExpensesByCategory(db, selectedSeason),
          getTotalExpenses(db, selectedSeason),
          getTotalUnpaidExpenses(db, selectedSeason),
        ]);
        countRef.current = count;
        setExpenses(page);
        setTotalCount(count);
        setHasMore(page.length < count);
        setCategoryTotals(catTotals);
        setTotalExpenses(total);
        setUnpaidAmount(unpaid);
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [db, selectedSeason]
  );

  const loadMoreExpenses = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    try {
      setIsLoadingMore(true);
      const nextOffset = offsetRef.current + EXPENSES_PAGE_SIZE;
      const page = await getExpensesPaginated(
        db,
        selectedSeason,
        categoryRef.current,
        EXPENSES_PAGE_SIZE,
        nextOffset
      );
      offsetRef.current = nextOffset;
      setExpenses((prev) => [...prev, ...page]);
      setHasMore(nextOffset + page.length < countRef.current);
    } catch (error) {
      console.error('Error loading more expenses:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [db, selectedSeason, isLoadingMore, hasMore]);

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

  const updateExpense = useCallback(
    async (id: number, input: Omit<ExpenseInput, 'season_code'>) => {
      try {
        await updateExpenseDB(db, id, input);
        await refreshExpenses();
      } catch (error) {
        console.error('Error updating expense:', error);
        throw error;
      }
    },
    [db, refreshExpenses]
  );

  const markPaid = useCallback(
    async (id: number, paymentDate: string) => {
      try {
        await markExpensePaid(db, id, paymentDate);
        await refreshExpenses();
      } catch (error) {
        console.error('Error marking expense as paid:', error);
        throw error;
      }
    },
    [db, refreshExpenses]
  );

  return {
    expenses,
    categoryTotals,
    totalExpenses,
    totalCount,
    hasMore,
    isLoading,
    isLoadingMore,
    unpaidAmount,
    addExpense,
    deleteExpense,
    updateExpense,
    markPaid,
    refreshExpenses,
    loadMoreExpenses,
  };
}
