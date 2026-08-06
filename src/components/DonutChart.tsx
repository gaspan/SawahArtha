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
  zakatRp: number;
}

const DonutChart: React.FC<Props> = ({ totalExpenses, totalRevenue, zakatRp }) => {
  const netProfit = totalRevenue - zakatRp - totalExpenses;
  const isEmpty = totalExpenses === 0 && totalRevenue === 0;

  const segments: { name: string; population: number; color: string; legendFontColor: string; legendFontSize: number }[] = [];

  if (totalExpenses > 0) {
    segments.push({
      name: 'Modal',
      population: totalExpenses,
      color: COLORS.chartExpense,
      legendFontColor: COLORS.textSecondary,
      legendFontSize: 12,
    });
  }

  if (zakatRp > 0) {
    segments.push({
      name: 'Zakat',
      population: zakatRp,
      color: COLORS.secondary,
      legendFontColor: COLORS.textSecondary,
      legendFontSize: 12,
    });
  }

  if (netProfit > 0) {
    segments.push({
      name: 'Laba Bersih',
      population: netProfit,
      color: COLORS.chartRevenue,
      legendFontColor: COLORS.textSecondary,
      legendFontSize: 12,
    });
  } else if (netProfit < 0) {
    segments.push({
      name: 'Defisit',
      population: Math.abs(netProfit),
      color: '#FCA5A5',
      legendFontColor: COLORS.textSecondary,
      legendFontSize: 12,
    });
  }

  if (segments.length === 0) {
    segments.push({
      name: 'Belum ada data',
      population: 1,
      color: COLORS.borderLight,
      legendFontColor: COLORS.textSecondary,
      legendFontSize: 12,
    });
  }

  const data = segments;

  const chartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <Text style={styles.title}>Rincian Modal, Zakat & Laba</Text>

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
            <LegendItem color={COLORS.chartExpense} label="Modal" value={formatIDR(totalExpenses)} />
            {zakatRp > 0 && (
              <LegendItem color={COLORS.secondary} label="Zakat" value={formatIDR(zakatRp)} />
            )}
            {netProfit >= 0 ? (
              <LegendItem color={COLORS.chartRevenue} label="Laba Bersih" value={formatIDR(netProfit)} />
            ) : (
              <LegendItem color="#FCA5A5" label="Defisit" value={formatIDR(Math.abs(netProfit))} />
            )}
          </View>
        </>
      )}
    </View>
  );
};

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <View style={styles.legendTextContainer}>
        <Text style={styles.legendLabel}>{label}</Text>
        <Text style={styles.legendValue}>{value}</Text>
      </View>
    </View>
  );
}

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

export default DonutChart;
