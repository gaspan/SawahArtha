/**
 * DonutChart - Expense vs Revenue Comparison
 *
 * A premium donut/pie chart that visualizes Pengeluaran (expenses) vs
 * Penghasilan (revenue) with a centered net profit/loss display.
 * Uses react-native-chart-kit PieChart with a white circle overlay
 * for the donut hole effect.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
} from '../constants/theme';
import { formatIDR } from '../utils/currency';

const screenWidth = Dimensions.get('window').width;

interface Props {
  totalExpenses: number;
  totalRevenue: number;
}

const DonutChart: React.FC<Props> = ({ totalExpenses, totalRevenue }) => {
  const netProfit = totalRevenue - totalExpenses;
  const isEmpty = totalExpenses === 0 && totalRevenue === 0;

  const data = [
    {
      name: 'Pengeluaran',
      population: totalExpenses,
      color: COLORS.chartExpense,
      legendFontColor: COLORS.textSecondary,
      legendFontSize: 12,
    },
    {
      name: 'Penghasilan',
      population: totalRevenue,
      color: COLORS.chartRevenue,
      legendFontColor: COLORS.textSecondary,
      legendFontSize: 12,
    },
  ];

  const chartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <Text style={styles.title}>Pengeluaran vs Penghasilan</Text>

      {isEmpty ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>Belum ada data</Text>
          <Text style={styles.emptySubtext}>
            Data akan muncul setelah ada transaksi
          </Text>
        </View>
      ) : (
        <>
          {/* Chart Container */}
          <View style={styles.chartWrapper}>
            <PieChart
              data={data}
              width={screenWidth - 64}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              hasLegend={false}
            />

            {/* Donut Hole Overlay */}
            <View style={styles.donutHole}>
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
          </View>

          {/* Custom Legend */}
          <View style={styles.legendContainer}>
            {/* Pengeluaran Legend */}
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: COLORS.chartExpense }]}
              />
              <View style={styles.legendTextContainer}>
                <Text style={styles.legendLabel}>Pengeluaran</Text>
                <Text style={styles.legendValue}>{formatIDR(totalExpenses)}</Text>
              </View>
            </View>

            {/* Penghasilan Legend */}
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: COLORS.chartRevenue }]}
              />
              <View style={styles.legendTextContainer}>
                <Text style={styles.legendLabel}>Penghasilan</Text>
                <Text style={styles.legendValue}>{formatIDR(totalRevenue)}</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const DONUT_HOLE_SIZE = 100;

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
    position: 'relative',
  },
  donutHole: {
    position: 'absolute',
    width: DONUT_HOLE_SIZE,
    height: DONUT_HOLE_SIZE,
    borderRadius: DONUT_HOLE_SIZE / 2,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
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
    justifyContent: 'space-around',
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

export default DonutChart;
