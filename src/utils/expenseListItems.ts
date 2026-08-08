/**
 * Pure list-building logic for ExpenseList.
 * Extracted so the rendering contract is unit-testable without a React renderer.
 * Regression: keyed <Fragment> caused "Element type is invalid" on RN 0.86;
 * items now get plain numeric keys and separator spacing via hasTopSpacing.
 */
import { type Expense } from '../database/expenseService';

export interface ExpenseListItemView {
  key: number;
  item: Expense;
  hasTopSpacing: boolean;
}

export function buildExpenseListItems(expenses: Expense[]): ExpenseListItemView[] {
  return expenses.map((item, index) => ({
    key: item.id,
    item,
    hasTopSpacing: index > 0,
  }));
}
