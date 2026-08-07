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

interface Props {
  totalGKG: number;
  totalGKPSold: number;
}

export default function StockCard({ totalGKG, totalGKPSold }: Props) {
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
          <Text style={[styles.metricValue, { color: COLORS.primary }]}>
            {totalGKPSold.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Sisa</Text>
          <Text style={[styles.metricValue, { color: remaining > 0 ? COLORS.warning : COLORS.textLight }]}>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md + 4,
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  title: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
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
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  pctText: {
    fontSize: 10,
    color: COLORS.textLight,
    textAlign: 'right',
  },
});
