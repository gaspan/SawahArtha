import React, { useState, useMemo } from 'react';
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

interface Props {
  unsoldKgGKG: number;
  totalExpenses: number;
  totalRevenueSold: number;
  zakatRp: number;
  minPrice: number;
  maxPrice: number;
}

const STEPS = 20;

export default function PriceSimulatorCard({
  unsoldKgGKG,
  totalExpenses,
  totalRevenueSold,
  zakatRp,
  minPrice,
  maxPrice,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const stepSize = (maxPrice - minPrice) / STEPS;
  const [stepIndex, setStepIndex] = useState(5);

  const sliderPrice = Math.round(minPrice + stepIndex * stepSize);

  const estimatedRevenue = totalRevenueSold + unsoldKgGKG * sliderPrice;
  const netProfit = estimatedRevenue - zakatRp - totalExpenses;
  const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;
  const margin = estimatedRevenue > 0 ? (netProfit / estimatedRevenue) * 100 : 0;

  const isProfit = netProfit >= 0;

  const isMin = stepIndex <= 0;
  const isMax = stepIndex >= STEPS;

  if (unsoldKgGKG === 0 || minPrice <= 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Simulasi Harga Jual</Text>

      <View style={styles.sliderSection}>
        <TouchableOpacity
          style={[styles.stepBtn, isMin && styles.stepBtnDisabled]}
          onPress={() => setStepIndex(Math.max(0, stepIndex - 1))}
          disabled={isMin}
          activeOpacity={0.6}
        >
          <Text style={[styles.stepBtnText, isMin && styles.stepBtnTextDisabled]}>−</Text>
        </TouchableOpacity>

        <View style={styles.sliderCenter}>
          <View style={styles.sliderBar}>
            <View
              style={[
                styles.sliderFill,
                {
                  width: `${(stepIndex / STEPS) * 100}%`,
                  backgroundColor: stepIndex > 0
                    ? isProfit ? colors.success : colors.warning
                    : colors.borderLight,
                },
              ]}
            />
          </View>

          <View style={styles.priceDisplay}>
            <Text style={styles.priceDisplayLabel}>Harga simulasi</Text>
            <Text style={[styles.priceDisplayValue, { color: isProfit ? colors.success : colors.danger }]}>
              {formatIDR(sliderPrice)}
            </Text>
            <Text style={styles.priceDisplayUnit}>/kg GKG</Text>
          </View>

          <View style={styles.markerRow}>
            <Text style={styles.markerText}>
              {formatIDR(minPrice)}
              <Text style={styles.markerHint}> (HPP)</Text>
            </Text>
            <Text style={styles.markerText}>{formatIDR(maxPrice)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.stepBtn, isMax && styles.stepBtnDisabled]}
          onPress={() => setStepIndex(Math.min(STEPS, stepIndex + 1))}
          disabled={isMax}
          activeOpacity={0.6}
        >
          <Text style={[styles.stepBtnText, isMax && styles.stepBtnTextDisabled]}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultRow}>
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Laba Proyeksi</Text>
          <Text style={[styles.resultValue, { color: isProfit ? colors.success : colors.danger }]}>
            {isProfit ? '+' : ''}
            {formatIDR(netProfit)}
          </Text>
        </View>

        <View style={styles.resultDivider} />

        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>ROI</Text>
          <Text style={[styles.resultValueSm, { color: isProfit ? colors.success : colors.danger }]}>
            {isProfit ? '+' : ''}
            {roi.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%
          </Text>
        </View>

        <View style={styles.resultDivider} />

        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Margin</Text>
          <Text style={[styles.resultValueSm, { color: isProfit ? colors.success : colors.danger }]}>
            {isProfit ? '+' : ''}
            {margin.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%
          </Text>
        </View>
      </View>

      <Text style={styles.hint}>
        Estimasi jika {unsoldKgGKG.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg stok terjual di {formatIDR(sliderPrice)}/kg
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
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  title: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
    marginBottom: SPACING.md,
  },
  sliderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.3,
  },
  stepBtnText: {
    fontSize: fs.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primaryDark,
  },
  stepBtnTextDisabled: {
    color: colors.textLight,
  },
  sliderCenter: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  sliderBar: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  sliderFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  priceDisplay: {
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  priceDisplayLabel: {
    fontSize: fs.xs - 1,
    color: colors.textLight,
    marginBottom: 2,
  },
  priceDisplayValue: {
    fontSize: fs.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  priceDisplayUnit: {
    fontSize: fs.xs - 1,
    color: colors.textLight,
  },
  markerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  markerText: {
    fontSize: 9,
    color: colors.textLight,
  },
  markerHint: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  resultRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.sm,
  },
  resultBox: {
    flex: 1,
    alignItems: 'center',
  },
  resultDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
    marginVertical: SPACING.xs,
  },
  resultLabel: {
    fontSize: fs.xs - 1,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  resultValue: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  resultValueSm: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  hint: {
    fontSize: 9,
    color: colors.textLight,
    textAlign: 'center',
  },
});
