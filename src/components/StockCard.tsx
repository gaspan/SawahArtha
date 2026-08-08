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

interface Props {
  totalGKG: number;
  totalGKPSold: number;
}

export default function StockCard({ totalGKG, totalGKPSold }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const remaining = Math.max(0, totalGKG - totalGKPSold);
  const pctSold = totalGKG > 0 ? (totalGKPSold / totalGKG) * 100 : 0;
  const safePct = Math.min(pctSold, 100);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Stok Gabah</Text>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Total Panen</Text>
          <Text style={styles.metricValue}>
            {totalGKG.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Terjual</Text>
          <Text style={[styles.metricValue, { color: colors.primary }]}>
            {totalGKPSold.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Sisa</Text>
          <Text style={[styles.metricValue, { color: remaining > 0 ? colors.warning : colors.textLight }]}>
            {remaining.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
          </Text>
        </View>
      </View>

      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${safePct}%` },
          ]}
        />
      </View>

      <Text style={styles.pctText}>
        {safePct.toLocaleString('id-ID', { maximumFractionDigits: 0 })}% terjual
      </Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md + 4,
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  title: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textSecondary,
    marginBottom: SPACING.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: fs.xs - 1,
    color: colors.textLight,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: colors.primary,
  },
  pctText: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'right',
  },
});
