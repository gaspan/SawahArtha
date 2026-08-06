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
  totalGKG: number;
  avgOrRefPrice: number;
}

export default function BreakEvenCard({
  totalExpenses,
  totalRevenue,
  totalGKG,
  avgOrRefPrice,
}: Props) {
  const hpp = totalGKG > 0 ? totalExpenses / totalGKG : 0;
  const recoveryPct = totalExpenses > 0 ? (totalRevenue / totalExpenses) * 100 : 0;
  const isRecovered = totalRevenue >= totalExpenses;
  const gap = totalExpenses - totalRevenue;
  const kgNeeded = avgOrRefPrice > 0 ? gap / avgOrRefPrice : 0;

  const safeRecoveryPct = Math.min(recoveryPct, 100);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Titik Impas / Balik Modal</Text>

      <View style={styles.badgeRow}>
        <View style={[styles.badge, isRecovered ? styles.badgeSuccess : styles.badgePending]}>
          <Text style={[styles.badgeText, isRecovered ? styles.badgeTextSuccess : styles.badgeTextPending]}>
            {isRecovered ? '✅ Sudah Balik Modal' : '⏳ Belum Balik Modal'}
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Progress balik modal</Text>
          <Text style={styles.progressPct}>
            {recoveryPct.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${safeRecoveryPct}%`,
                backgroundColor: isRecovered ? COLORS.success : COLORS.warning,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Modal</Text>
          <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatIDR(totalExpenses)}
          </Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Pendapatan</Text>
          <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatIDR(totalRevenue)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Harga Jual Minimum</Text>
        <Text style={styles.priceValue}>{formatIDR(hpp)}</Text>
        <Text style={styles.priceUnit}>/kg GKG</Text>
      </View>

      {!isRecovered && (
        <View style={styles.gapRow}>
          <Text style={styles.gapText}>
            Kurang{' '}
            <Text style={styles.gapHighlight}>{formatIDR(gap)}</Text>
            {avgOrRefPrice > 0 ? (
              <Text style={styles.gapSub}>
                {' '}(≈ {kgNeeded.toLocaleString('id-ID', { maximumFractionDigits: 0 })} kg GKG di {formatIDR(avgOrRefPrice)}/kg)
              </Text>
            ) : null}
          </Text>
        </View>
      )}
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
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  badgeRow: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeSuccess: {
    backgroundColor: COLORS.successLight,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  badgePending: {
    backgroundColor: COLORS.warningLight,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  badgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  badgeTextSuccess: {
    color: COLORS.success,
  },
  badgeTextPending: {
    color: COLORS.warning,
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
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm + 2,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  priceLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: FONT_SIZE.md + 2,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  priceUnit: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
  gapRow: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.warningLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  gapText: {
    fontSize: FONT_SIZE.xs + 1,
    color: COLORS.text,
    textAlign: 'center',
  },
  gapHighlight: {
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.danger,
  },
  gapSub: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textSecondary,
  },
});
