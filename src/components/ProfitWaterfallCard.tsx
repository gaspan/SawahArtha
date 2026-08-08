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
  totalRevenue: number;
  zakatRp: number;
  gacongValueRp: number;
  totalExpenses: number;
}

export default function ProfitWaterfallCard({
  totalRevenue,
  zakatRp,
  gacongValueRp,
  totalExpenses,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const netProfit = totalRevenue - zakatRp - totalExpenses;
  const isProfit = netProfit >= 0;

  const maxAmount = Math.max(totalRevenue, zakatRp, totalExpenses, Math.abs(netProfit));

  const renderBar = (color: string, amount: number) => {
    const widthPct = maxAmount > 0 ? (Math.abs(amount) / maxAmount) * 100 : 0;
    return (
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${widthPct}%`, backgroundColor: color }]} />
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Rincian Laba Bersih</Text>

      <View style={styles.rows}>
        <WaterfallRow
          label="Pendapatan Kotor"
          value={totalRevenue}
          color={colors.chartRevenue}
          bar={renderBar(colors.chartRevenue, totalRevenue)}
          isPositive={true}
          styles={styles}
        />

        <WaterfallRow
          label="Zakat (5%)"
          value={zakatRp}
          color={colors.secondary}
          bar={renderBar(colors.secondary, zakatRp)}
          isPositive={false}
          dimmed={zakatRp === 0}
          styles={styles}
        />

        {gacongValueRp > 0 && (
          <WaterfallRow
            label="Nilai Gacong"
            value={gacongValueRp}
            color={colors.textLight}
            bar={renderBar(colors.borderLight, gacongValueRp)}
            isPositive={false}
            info
            styles={styles}
          />
        )}

        <WaterfallRow
          label="Total Modal"
          value={totalExpenses}
          color={colors.danger}
          bar={renderBar(colors.danger, totalExpenses)}
          isPositive={false}
          styles={styles}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: isProfit ? colors.successLight : colors.dangerLight }]} />

      <WaterfallRow
        label="Laba Bersih Riil"
        value={netProfit}
        color={isProfit ? colors.success : colors.danger}
        bar={renderBar(isProfit ? colors.success : colors.danger, netProfit)}
        isPositive={isProfit}
        isBold
        styles={styles}
      />
    </View>
  );
}

function WaterfallRow({
  label,
  value,
  color,
  bar,
  isPositive,
  isBold,
  dimmed,
  info,
  styles,
}: {
  label: string;
  value: number;
  color: string;
  bar: React.ReactNode;
  isPositive: boolean;
  isBold?: boolean;
  dimmed?: boolean;
  info?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={[styles.row, dimmed && styles.dimmed]}>
      <Text style={[styles.label, isBold && styles.labelBold, info && styles.infoLabel]}>{label}</Text>
      {bar}
      <Text
        style={[
          styles.value,
          { color },
          isBold && styles.valueBold,
          dimmed && styles.dimmedText,
          info && styles.infoText,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {isPositive ? '+' : (dimmed || info ? '' : '−')}
        {formatIDR(Math.abs(value))}
      </Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs + 2,
    gap: SPACING.sm,
  },
  dimmed: {
    opacity: 0.4,
  },
  dimmedText: {
    textDecorationLine: 'line-through',
  },
  infoLabel: {
    fontSize: fs.xs,
    color: colors.textLight,
  },
  infoText: {
    fontWeight: FONT_WEIGHT.normal,
    color: colors.textLight,
    fontSize: fs.xs,
  },
  label: {
    fontSize: fs.xs + 1,
    fontWeight: FONT_WEIGHT.medium,
    color: colors.textSecondary,
    width: 95,
  },
  labelBold: {
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
    fontSize: fs.sm,
  },
  value: {
    fontSize: fs.xs + 1,
    fontWeight: FONT_WEIGHT.semibold,
    width: 110,
    textAlign: 'right',
  },
  valueBold: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
  },
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
  rows: {
    gap: 2,
  },
  divider: {
    height: 1.5,
    marginVertical: SPACING.sm,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
    minWidth: 2,
  },
});
