import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
} from '../constants/theme';
import { formatIDR } from '../utils/currency';

interface Props {
  totalExpenses: number;
  totalRevenue: number;
}

export default function SummaryCards({ totalExpenses, totalRevenue }: Props) {
  const netProfit = totalRevenue - totalExpenses;
  const isProfit = netProfit >= 0;

  return (
    <View style={styles.container}>
      {/* 1. Net Profit Card (Full Width) */}
      <View style={styles.fullCard}>
        <View
          style={[
            styles.accentBar,
            { backgroundColor: isProfit ? COLORS.success : COLORS.danger },
          ]}
        />
        <View style={styles.cardBody}>
          <View style={styles.labelRow}>
            <Text style={styles.icon}>{isProfit ? '📈' : '📉'}</Text>
            <Text style={styles.label}>Laba / Rugi Bersih</Text>
          </View>
          <Text
            style={[
              styles.profitValue,
              { color: isProfit ? COLORS.success : COLORS.danger },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {isProfit ? '+' : ''}
            {formatIDR(netProfit)}
          </Text>
          <Text style={styles.profitSubtext}>
            {isProfit ? 'Surplus pendapatan musim ini' : 'Defisit modal pertanian'}
          </Text>
        </View>
      </View>

      {/* 2. Half Cards Row (Total Capital & Gross Revenue) */}
      <View style={styles.halfRow}>
        {/* Total Capital */}
        <View style={styles.halfCard}>
          <View style={[styles.accentBar, { backgroundColor: COLORS.danger }]} />
          <View style={styles.cardBody}>
            <View style={styles.labelRow}>
              <Text style={styles.icon}>💰</Text>
              <Text style={styles.label} numberOfLines={1}>
                Total Modal
              </Text>
            </View>
            <Text
              style={[styles.value, { color: COLORS.danger }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatIDR(totalExpenses)}
            </Text>
            <Text style={styles.subtext}>Pengeluaran</Text>
          </View>
        </View>

        {/* Gross Revenue */}
        <View style={styles.halfCard}>
          <View style={[styles.accentBar, { backgroundColor: COLORS.success }]} />
          <View style={styles.cardBody}>
            <View style={styles.labelRow}>
              <Text style={styles.icon}>🌾</Text>
              <Text style={styles.label} numberOfLines={1}>
                Total Pendapatan
              </Text>
            </View>
            <Text
              style={[styles.value, { color: COLORS.success }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatIDR(totalRevenue)}
            </Text>
            <Text style={styles.subtext}>Hasil Kotor</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  fullCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  halfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  halfCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  cardBody: {
    padding: SPACING.md,
    paddingTop: SPACING.sm + 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  icon: {
    fontSize: FONT_SIZE.md,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  profitValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    marginVertical: 2,
  },
  profitSubtext: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textLight,
    marginTop: 2,
  },
  value: {
    fontSize: FONT_SIZE.md + 2,
    fontWeight: FONT_WEIGHT.bold,
    marginVertical: 2,
  },
  subtext: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
