import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
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

const DonutChartComponent: React.FC<Props> = ({ totalExpenses, totalRevenue, zakatRp }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const { width: screenWidth } = useWindowDimensions();
  const netProfit = totalRevenue - zakatRp - totalExpenses;
  const isEmpty = totalExpenses === 0 && totalRevenue === 0;

  const segments: { value: number; color: string }[] = [];

  if (totalExpenses > 0) {
    segments.push({ value: totalExpenses, color: colors.chartExpense });
  }
  if (zakatRp > 0) {
    segments.push({ value: zakatRp, color: colors.secondary });
  }
  if (netProfit > 0) {
    segments.push({ value: netProfit, color: colors.chartRevenue });
  } else if (netProfit < 0) {
    segments.push({ value: Math.abs(netProfit), color: colors.chartDeficit });
  }

  if (segments.length === 0) {
    segments.push({ value: 1, color: colors.borderLight });
  }

  const legendItems: { color: string; label: string; value: number }[] = [];
  if (totalExpenses > 0) {
    legendItems.push({ color: colors.chartExpense, label: 'Modal', value: totalExpenses });
  }
  if (zakatRp > 0) {
    legendItems.push({ color: colors.secondary, label: 'Zakat', value: zakatRp });
  }
  if (netProfit >= 0 && netProfit !== 0) {
    legendItems.push({ color: colors.chartRevenue, label: 'Laba Bersih', value: netProfit });
  } else if (netProfit < 0) {
    legendItems.push({ color: colors.chartDeficit, label: 'Defisit', value: Math.abs(netProfit) });
  }
  if (legendItems.length === 0 && isEmpty) {
    legendItems.push({ color: colors.borderLight, label: 'Belum ada data', value: 0 });
  }

  const chartWidth = Math.min(screenWidth - 64, 320);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Rincian Modal, Zakat & Laba</Text>

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>Belum ada data</Text>
          <Text style={styles.emptySubtext}>
            Data akan muncul setelah ada transaksi
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.chartWrapper}>
            <PieChart
              data={segments}
              donut
              radius={chartWidth / 2 - 20}
              innerRadius={chartWidth / 2 - 55}
              innerCircleColor={colors.surface}
              centerLabelComponent={() => (
                <View style={styles.centerLabel}>
                  <Text style={styles.netLabel}>
                    {netProfit >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}
                  </Text>
                  <Text
                    style={[
                      styles.netValue,
                      { color: netProfit >= 0 ? colors.chartRevenue : colors.chartExpense },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatIDR(netProfit)}
                  </Text>
                </View>
              )}
            />
          </View>

          <View style={styles.legendContainer}>
            {legendItems.map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <View style={styles.legendTextContainer}>
                  <Text style={styles.legendLabel}>{item.label}</Text>
                  <Text style={styles.legendValue}>{formatIDR(item.value)}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  title: {
    fontSize: fs.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
    marginBottom: SPACING.md,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  netLabel: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  netValue: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  legendTextContainer: {
    flexDirection: 'column',
  },
  legendLabel: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: colors.textSecondary,
  },
  legendValue: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: fs.sm,
    color: colors.textLight,
  },
});

export default DonutChartComponent;
