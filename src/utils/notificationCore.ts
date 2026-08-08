/**
 * Pure notification planning logic (no expo/react-native imports — testable)
 * Tier 5: debt due reminders, budget overrun warnings, farming schedule reminder.
 */

export interface DebtForNotif {
  id: number;
  counterparty: string;
  amount: number;
  due_date: string | null;
  is_settled: number;
}

export interface PlannedNotification {
  id: string;
  title: string;
  body: string;
  triggerAt: Date;
}

export interface BudgetForNotif {
  category: string;
  percentUsed: number;
}

export const REMINDER_HOUR = 9; // hutang & anggaran
export const FARM_HOUR = 7; // pengingat jadwal tani
export const LEAD_DAYS = 3; // pengingat N hari sebelum jatuh tempo

export function debtDueDateToDate(dueDate: string): Date | null {
  const d = new Date(`${dueDate}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Build one-shot reminders for unsettled debts:
 * - 3 days before due date (09:00)
 * - on due date (09:00) — "jatuh tempo hari ini"
 * - if already overdue and unsettled: next morning (09:00) — "masih belum lunas"
 */
export function computeDebtNotifications(
  debts: DebtForNotif[],
  now: Date
): PlannedNotification[] {
  const out: PlannedNotification[] = [];
  for (const debt of debts) {
    if (debt.is_settled || !debt.due_date) continue;
    const due = debtDueDateToDate(debt.due_date);
    if (!due) continue;
    const fmt = formatIDRShort(debt.amount);

    const lead = new Date(due);
    lead.setDate(lead.getDate() - LEAD_DAYS);
    lead.setHours(REMINDER_HOUR, 0, 0, 0);
    if (lead.getTime() > now.getTime()) {
      out.push({
        id: `debt_lead_${debt.id}`,
        title: 'Hutang segera jatuh tempo ⏰',
        body: `${debt.counterparty} · ${fmt} jatuh tempo ${LEAD_DAYS} hari lagi.`,
        triggerAt: lead,
      });
    }

    const dayOf = new Date(due);
    dayOf.setHours(REMINDER_HOUR, 0, 0, 0);
    if (dayOf.getTime() > now.getTime()) {
      out.push({
        id: `debt_due_${debt.id}`,
        title: 'Hutang jatuh tempo hari ini ⚠️',
        body: `Segera lunasi hutang ke ${debt.counterparty} sebesar ${fmt}.`,
        triggerAt: dayOf,
      });
    }

    if (dayOf.getTime() <= now.getTime()) {
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(REMINDER_HOUR, 0, 0, 0);
      if (next.getTime() > now.getTime()) {
        out.push({
          id: `debt_overdue_${debt.id}`,
          title: 'Hutang belum lunas 🔴',
          body: `Hutang ke ${debt.counterparty} (${fmt}) melewati jatuh tempo.`,
          triggerAt: next,
        });
      }
    }
  }
  return out;
}

/**
 * If any budget category is >= 100% (danger) or >= 80% (warning),
 * return the daily summary body; otherwise null.
 */
export function computeBudgetWarningBody(
  budgets: BudgetForNotif[]
): string | null {
  const danger = budgets.filter((b) => b.percentUsed >= 100);
  const warning = budgets.filter(
    (b) => b.percentUsed >= 80 && b.percentUsed < 100
  );
  const parts: string[] = [];
  if (danger.length > 0) {
    parts.push(`${danger.length} kategori lewat anggaran`);
  }
  if (warning.length > 0) {
    parts.push(`${warning.length} kategori mendekati batas`);
  }
  if (parts.length === 0) return null;
  const names = [...danger, ...warning]
    .slice(0, 3)
    .map((b) => b.category)
    .join(', ');
  return `${parts.join(' · ')}: ${names}. Cek anggaran musim aktif.`;
}

function formatIDRShort(amount: number): string {
  if (amount >= 1_000_000) {
    const jt = amount / 1_000_000;
    return `Rp ${jt % 1 === 0 ? jt.toFixed(0) : jt.toFixed(1)}jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${Math.round(amount / 1000)}rb`;
  }
  return `Rp ${Math.round(amount)}`;
}
