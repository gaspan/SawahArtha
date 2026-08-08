import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { formatIDR } from '../utils/currency';

interface Props {
  totalExpenses: number;
  totalRevenue: number;
  zakatRp: number;
}

export default function SummaryCards({ totalExpenses, totalRevenue, zakatRp }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const netProfit = totalRevenue - zakatRp - totalExpenses;
  const isProfit = netProfit >= 0;

  return (
    <View style={styles.container}>
      {/* 1. Net Profit Card (Full Width) */}
      <View style={styles.fullCard}>
        <View
          style={[
            styles.accentBar,
            { backgroundColor: isProfit ? colors.success : colors.danger },
          ]}
        />
        <View style={styles.cardBody}>
          <View style={styles.labelRow}>
            <Text style={styles.icon}>{isProfit ? '📈' : '📉'}</Text>
            <Text style={styles.label}>Laba / Rugi Bersih (Setelah Zakat)</Text>
          </View>
          <Text
            style={[
              styles.profitValue,
              { color: isProfit ? colors.success : colors.danger },
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
          <View style={[styles.accentBar, { backgroundColor: colors.danger }]} />
          <View style={styles.cardBody}>
            <View style={styles.labelRow}>
              <Text style={styles.icon}>💰</Text>
              <Text style={styles.label} numberOfLines={1}>
                Total Modal
              </Text>
            </View>
            <Text
              style={[styles.value, { color: colors.danger }]}
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
          <View style={[styles.accentBar, { backgroundColor: colors.success }]} />
          <View style={styles.cardBody}>
            <View style={styles.labelRow}>
              <Text style={styles.icon}>🌾</Text>
              <Text style={styles.label} numberOfLines={1}>
                Total Pendapatan
              </Text>
            </View>
            <Text
              style={[styles.value, { color: colors.success }]}
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

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  fullCard: {
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
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
    fontSize: fs.md,
  },
  label: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.textSecondary,
  },
  profitValue: {
    fontSize: fs.xxl,
    fontWeight: FONT_WEIGHT.bold,
    marginVertical: 2,
  },
  profitSubtext: {
    fontSize: fs.xs - 1,
    color: colors.textLight,
    marginTop: 2,
  },
  value: {
    fontSize: fs.md + 2,
    fontWeight: FONT_WEIGHT.bold,
    marginVertical: 2,
  },
  subtext: {
    fontSize: fs.xs - 1,
    color: colors.textLight,
    marginTop: 2,
  },
});
