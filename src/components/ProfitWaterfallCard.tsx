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
  const netProfit = totalRevenue - zakatRp - gacongValueRp - totalExpenses;
  const isProfit = netProfit >= 0;

  const maxAmount = Math.max(totalRevenue, zakatRp, gacongValueRp, totalExpenses, Math.abs(netProfit));

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
          color={COLORS.chartRevenue}
          bar={renderBar(COLORS.chartRevenue, totalRevenue)}
          isPositive={true}
        />

        <WaterfallRow
          label="Zakat (5%)"
          value={zakatRp}
          color={COLORS.secondary}
          bar={renderBar(COLORS.secondary, zakatRp)}
          isPositive={false}
          dimmed={zakatRp === 0}
        />

        {gacongValueRp > 0 && (
          <WaterfallRow
            label="Nilai Gacong"
            value={gacongValueRp}
            color={COLORS.chartGacong}
            bar={renderBar(COLORS.chartGacong, gacongValueRp)}
            isPositive={false}
          />
        )}

        <WaterfallRow
          label="Total Modal"
          value={totalExpenses}
          color={COLORS.danger}
          bar={renderBar(COLORS.danger, totalExpenses)}
          isPositive={false}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: isProfit ? COLORS.successLight : COLORS.dangerLight }]} />

      <WaterfallRow
        label="Laba Bersih Riil"
        value={netProfit}
        color={isProfit ? COLORS.success : COLORS.danger}
        bar={renderBar(isProfit ? COLORS.success : COLORS.danger, netProfit)}
        isPositive={isProfit}
        isBold
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
}: {
  label: string;
  value: number;
  color: string;
  bar: React.ReactNode;
  isPositive: boolean;
  isBold?: boolean;
  dimmed?: boolean;
}) {
  return (
    <View style={[wfStyles.row, dimmed && wfStyles.dimmed]}>
      <Text style={[wfStyles.label, isBold && wfStyles.labelBold]}>{label}</Text>
      {bar}
      <Text
        style={[
          wfStyles.value,
          { color },
          isBold && wfStyles.valueBold,
          dimmed && wfStyles.dimmedText,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {isPositive ? '+' : (dimmed ? '' : '−')}
        {formatIDR(Math.abs(value))}
      </Text>
    </View>
  );
}

const wfStyles = StyleSheet.create({
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
  label: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
    width: 95,
  },
  labelBold: {
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
  },
  value: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: FONT_WEIGHT.semibold,
    width: 110,
    textAlign: 'right',
  },
  valueBold: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
});

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
    backgroundColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
    minWidth: 2,
  },
});
