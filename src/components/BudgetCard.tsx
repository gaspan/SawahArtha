import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
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

function statusColor(
  status: BudgetVsActual['status'],
  colors: ThemeColors
): string {
  switch (status) {
    case 'danger': return colors.danger;
    case 'warning': return colors.warning;
    default: return colors.success;
  }
}

function statusBg(
  status: BudgetVsActual['status'],
  colors: ThemeColors
): string {
  switch (status) {
    case 'danger': return colors.dangerLight;
    case 'warning': return colors.warningLight;
    default: return colors.successLight;
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
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [isExpanded, setIsExpanded] = useState(false);

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
              { color: isOver ? colors.danger : colors.primary },
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
                backgroundColor: isOver ? colors.danger : colors.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.pctText}>
          {overallPct.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%
        </Text>
      </View>

      <TouchableOpacity
        style={styles.toggleBtn}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.toggleBtnText}>
          {isExpanded ? 'Tutup Rincian ▲' : 'Lihat Rincian ▼'}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedSection}>
          {budgetVsActual.map((item) => (
            <TouchableOpacity
              key={item.category}
              style={styles.categoryRow}
              onPress={() => onEditBudget(item.category)}
              activeOpacity={0.7}
            >
              <View style={styles.catLeft}>
                <View style={[styles.statusDot, { backgroundColor: statusColor(item.status, colors) }]} />
                <Text style={styles.catName}>{item.category}</Text>
              </View>

              <View style={styles.catRight}>
                <View style={styles.catBarBg}>
                  <View
                    style={[
                      styles.catBarFill,
                      {
                        width: `${Math.min(item.percentUsed, 100)}%`,
                        backgroundColor: statusColor(item.status, colors),
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
                    { color: statusColor(item.status, colors) },
                  ]}
                >
                  {item.percentUsed.toLocaleString('id-ID', { maximumFractionDigits: 0 })}%
                </Text>
              </View>

              <View style={[styles.remainingBadge, { backgroundColor: statusBg(item.status, colors) }]}>
                <Text style={[styles.remainingText, { color: statusColor(item.status, colors) }]}>
                  {item.remaining >= 0
                    ? `Sisa ${formatIDR(item.remaining)}`
                    : `Lewat ${formatIDR(Math.abs(item.remaining))}`}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
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
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
    },
    logBtn: {
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: colors.primaryLight,
    },
    logBtnText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.primaryDark,
    },
    warningBanner: {
      backgroundColor: colors.dangerLight,
      borderRadius: BORDER_RADIUS.sm,
      paddingVertical: SPACING.xs + 2,
      paddingHorizontal: SPACING.sm,
      marginBottom: SPACING.sm,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    warningText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.danger,
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
      backgroundColor: colors.background,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.sm,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: fs.xs - 1,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    summaryValue: {
      fontSize: fs.sm,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
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
      fontSize: fs.xs,
      color: colors.textSecondary,
    },
    progressPct: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.bold,
    },
    progressBarBg: {
      height: 10,
      backgroundColor: colors.borderLight,
      borderRadius: BORDER_RADIUS.full,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: BORDER_RADIUS.full,
    },
    pctText: {
      fontSize: fs.xs,
      color: colors.textSecondary,
      textAlign: 'right',
    },
    toggleBtn: {
      paddingVertical: SPACING.sm,
      alignItems: 'center',
      marginBottom: SPACING.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      marginTop: SPACING.xs,
    },
    toggleBtnText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.primaryDark,
    },
    expandedSection: {
      marginTop: SPACING.xs,
    },
    categoryRow: {
      backgroundColor: colors.background,
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
      fontSize: fs.xs + 1,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.text,
    },
    catRight: {
      marginBottom: SPACING.xs,
    },
    catBarBg: {
      height: 6,
      backgroundColor: colors.borderLight,
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
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.text,
    },
    catBudget: {
      fontSize: fs.xs - 1,
      color: colors.textLight,
    },
    catPct: {
      fontSize: fs.xs,
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
