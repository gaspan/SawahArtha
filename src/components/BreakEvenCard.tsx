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
  totalGKG: number;
  avgOrRefPrice: number;
}

export default function BreakEvenCard({
  totalExpenses,
  totalRevenue,
  totalGKG,
  avgOrRefPrice,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

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
                backgroundColor: isRecovered ? colors.success : colors.warning,
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

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md + 4,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  title: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
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
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
  },
  badgePending: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  badgeText: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  badgeTextSuccess: {
    color: colors.success,
  },
  badgeTextPending: {
    color: colors.warning,
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
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primary,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: colors.borderLight,
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
    backgroundColor: colors.surfaceElevated,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  metricLabel: {
    fontSize: fs.xs - 1,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: SPACING.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  priceLabel: {
    fontSize: fs.xs,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: fs.md + 2,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
  },
  priceUnit: {
    fontSize: fs.xs,
    color: colors.textLight,
  },
  gapRow: {
    marginTop: SPACING.sm,
    backgroundColor: colors.warningLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  gapText: {
    fontSize: fs.xs + 1,
    color: colors.text,
    textAlign: 'center',
  },
  gapHighlight: {
    fontWeight: FONT_WEIGHT.bold,
    color: colors.danger,
  },
  gapSub: {
    fontSize: fs.xs - 1,
    color: colors.textSecondary,
  },
});
