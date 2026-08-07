import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
} from '../constants/theme';
import { formatIDR } from '../utils/currency';
import type { BudgetVsActual } from '../database/budgetService';

interface Props {
  budgetVsActual: BudgetVsActual[];
  totalBudget: number;
  totalActual: number;
  overBudgetCount: number;
  onEditBudget: (category: string) => void;
  onOpenLog: () => void;
}

function statusColor(status: BudgetVsActual['status']): string {
  switch (status) {
    case 'danger': return COLORS.danger;
    case 'warning': return COLORS.warning;
    default: return COLORS.success;
  }
}

function statusBg(status: BudgetVsActual['status']): string {
  switch (status) {
    case 'danger': return COLORS.dangerLight;
    case 'warning': return COLORS.warningLight;
    default: return COLORS.successLight;
  }
}

export default function BudgetCard({
  budgetVsActual,
  totalBudget,
  totalActual,
  overBudgetCount,
  onEditBudget,
  onOpenLog,
}: Props) {
  const overallPct = totalBudget > 0
    ? Math.min((totalActual / totalBudget) * 100, 100)
    : 0;

  const overallRemaining = totalBudget - totalActual;
  const isOver = overallRemaining < 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Anggaran Modal</Text>
        <TouchableOpacity
          style={styles.logBtn}
          onPress={onOpenLog}
          activeOpacity={0.7}
        >
          <Text style={styles.logBtnText}>Riwayat</Text>
        </TouchableOpacity>
      </View>

      {overBudgetCount > 0 && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            {overBudgetCount} kategori lewat anggaran
          </Text>
        </View>
      )}

      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Anggaran</Text>
          <Text style={styles.summaryValue}>{formatIDR(totalBudget)}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Realisasi</Text>
          <Text style={styles.summaryValue}>{formatIDR(totalActual)}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>
            {isOver ? 'Lewat anggaran' : 'Sisa'}
          </Text>
          <Text
            style={[
              styles.progressPct,
              { color: isOver ? COLORS.danger : COLORS.primary },
            ]}
          >
            {isOver ? '+' : ''}{formatIDR(Math.abs(overallRemaining))}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${overallPct}%`,
                backgroundColor: isOver ? COLORS.danger : COLORS.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.pctText}>
          {overallPct.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%
        </Text>
      </View>

      {budgetVsActual.map((item) => (
        <TouchableOpacity
          key={item.category}
          style={styles.categoryRow}
          onPress={() => onEditBudget(item.category)}
          activeOpacity={0.7}
        >
          <View style={styles.catLeft}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
            <Text style={styles.catName}>{item.category}</Text>
          </View>

          <View style={styles.catRight}>
            <View style={styles.catBarBg}>
              <View
                style={[
                  styles.catBarFill,
                  {
                    width: `${Math.min(item.percentUsed, 100)}%`,
                    backgroundColor: statusColor(item.status),
                  },
                ]}
              />
            </View>
            <View style={styles.catAmounts}>
              <Text style={styles.catActual}>
                {formatIDR(item.actualAmount)}
              </Text>
              <Text style={styles.catBudget}>
                {' / '}{formatIDR(item.budgetAmount)}
              </Text>
            </View>
            <Text
              style={[
                styles.catPct,
                { color: statusColor(item.status) },
              ]}
            >
              {item.percentUsed.toLocaleString('id-ID', { maximumFractionDigits: 0 })}%
            </Text>
          </View>

          <View style={[styles.remainingBadge, { backgroundColor: statusBg(item.status) }]}>
            <Text style={[styles.remainingText, { color: statusColor(item.status) }]}>
              {item.remaining >= 0
                ? `Sisa ${formatIDR(item.remaining)}`
                : `Lewat ${formatIDR(Math.abs(item.remaining))}`}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md + 4,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  logBtn: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
  },
  logBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryDark,
  },
  warningBanner: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  warningText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.danger,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  progressSection: {
    marginBottom: SPACING.md,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  progressPct: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  pctText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  categoryRow: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.xs,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catName: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  catRight: {
    marginBottom: SPACING.xs,
  },
  catBarBg: {
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: 3,
  },
  catBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  catAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  catActual: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  catBudget: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textLight,
  },
  catPct: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'right',
  },
  remainingBadge: {
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: 1,
    paddingHorizontal: SPACING.xs,
    alignSelf: 'flex-start',
  },
  remainingText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.medium,
  },
});
