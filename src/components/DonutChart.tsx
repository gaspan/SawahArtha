import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
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
  zakatRp: number;
}

const DonutChartComponent: React.FC<Props> = ({ totalExpenses, totalRevenue, zakatRp }) => {
  const { width: screenWidth } = useWindowDimensions();
  const netProfit = totalRevenue - zakatRp - totalExpenses;
  const isEmpty = totalExpenses === 0 && totalRevenue === 0;

  const segments: { value: number; color: string }[] = [];

  if (totalExpenses > 0) {
    segments.push({ value: totalExpenses, color: COLORS.chartExpense });
  }
  if (zakatRp > 0) {
    segments.push({ value: zakatRp, color: COLORS.secondary });
  }
  if (netProfit > 0) {
    segments.push({ value: netProfit, color: COLORS.chartRevenue });
  } else if (netProfit < 0) {
    segments.push({ value: Math.abs(netProfit), color: COLORS.chartDeficit });
  }

  if (segments.length === 0) {
    segments.push({ value: 1, color: COLORS.borderLight });
  }

  const legendItems: { color: string; label: string; value: number }[] = [];
  if (totalExpenses > 0) {
    legendItems.push({ color: COLORS.chartExpense, label: 'Modal', value: totalExpenses });
  }
  if (zakatRp > 0) {
    legendItems.push({ color: COLORS.secondary, label: 'Zakat', value: zakatRp });
  }
  if (netProfit >= 0 && netProfit !== 0) {
    legendItems.push({ color: COLORS.chartRevenue, label: 'Laba Bersih', value: netProfit });
  } else if (netProfit < 0) {
    legendItems.push({ color: COLORS.chartDeficit, label: 'Defisit', value: Math.abs(netProfit) });
  }
  if (legendItems.length === 0 && isEmpty) {
    legendItems.push({ color: COLORS.borderLight, label: 'Belum ada data', value: 0 });
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
              innerCircleColor={COLORS.surface}
              centerLabelComponent={() => (
                <View style={styles.centerLabel}>
                  <Text style={styles.netLabel}>
                    {netProfit >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}
                  </Text>
                  <Text
                    style={[
                      styles.netValue,
                      { color: netProfit >= 0 ? COLORS.chartRevenue : COLORS.chartExpense },
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
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
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  netValue: {
    fontSize: FONT_SIZE.sm,
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
    borderTopColor: COLORS.borderLight,
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
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
  legendValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
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
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
  },
});

export default DonutChartComponent;
