import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useSeason } from './SeasonContext';
import {
  getBudgets,
  getBudgetVsActual,
  getTotalBudget,
  getOverBudgetCount,
  setBudget as setBudgetDB,
  deleteBudget as deleteBudgetDB,
  getBudgetLogs,
  seedDefaultBudgets,
  type Budget,
  type BudgetVsActual,
  type BudgetLog,
} from '../database/budgetService';

interface BudgetContextType {
  budgets: Budget[];
  budgetVsActual: BudgetVsActual[];
  totalBudget: number;
  overBudgetCount: number;
  budgetLogs: BudgetLog[];
  isLoading: boolean;
  setBudget: (category: string, amount: number) => Promise<void>;
  deleteBudget: (category: string) => Promise<void>;
  refreshBudgets: () => Promise<void>;
  seedBudgets: (landSizeM2: number) => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const { selectedSeason } = useSeason();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetVsActual, setBudgetVsActual] = useState<BudgetVsActual[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [overBudgetCount, setOverBudgetCount] = useState(0);
  const [budgetLogs, setBudgetLogs] = useState<BudgetLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshBudgets = useCallback(async () => {
    if (!selectedSeason) return;
    try {
      setIsLoading(true);
      const [budgetsData, vsActual, total, overCount, logs] = await Promise.all([
        getBudgets(db, selectedSeason),
        getBudgetVsActual(db, selectedSeason),
        getTotalBudget(db, selectedSeason),
        getOverBudgetCount(db, selectedSeason),
        getBudgetLogs(db, selectedSeason),
      ]);
      setBudgets(budgetsData);
      setBudgetVsActual(vsActual);
      setTotalBudget(total);
      setOverBudgetCount(overCount);
      setBudgetLogs(logs);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, selectedSeason]);

  useEffect(() => {
    refreshBudgets();
  }, [refreshBudgets]);

  const setBudget = useCallback(
    async (category: string, amount: number) => {
      await setBudgetDB(db, selectedSeason, category, amount);
      await refreshBudgets();
    },
    [db, selectedSeason, refreshBudgets],
  );

  const deleteBudget = useCallback(
    async (category: string) => {
      await deleteBudgetDB(db, selectedSeason, category);
      await refreshBudgets();
    },
    [db, selectedSeason, refreshBudgets],
  );

  const seedBudgets = useCallback(
    async (landSizeM2: number) => {
      await seedDefaultBudgets(db, selectedSeason, landSizeM2);
      await refreshBudgets();
    },
    [db, selectedSeason, refreshBudgets],
  );

  return (
    <BudgetContext.Provider
      value={{
        budgets,
        budgetVsActual,
        totalBudget,
        overBudgetCount,
        budgetLogs,
        isLoading,
        setBudget,
        deleteBudget,
        refreshBudgets,
        seedBudgets,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget(): BudgetContextType {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}
