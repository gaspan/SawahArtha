/**
 * CategoryBarChart - Expense Breakdown by Category
 *
 * A bar chart that visualizes expense totals across farming categories
 * (Pupuk, Insektisida, Fungisida, Rodentisida, Jasa Pegawai).
 * Uses react-native-chart-kit BarChart with farming green bars.
 * Shows formatted IDR values and handles empty data gracefully.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
} from '../constants/theme';
import { formatCompact } from '../utils/currency';

const screenWidth = Dimensions.get('window').width;

interface Props {
  categoryTotals: Array<{ category: string; total: number }>;
}

/** Shorten category names for chart labels */
const LABEL_MAP: Record<string, string> = {
  Pupuk: 'Pupuk',
  Insektisida: 'Insek.',
  Fungisida: 'Fungi.',
  Rodentisida: 'Roden.',
  'Jasa Pegawai': 'Jasa',
};

/** Map category names to their chart colors */
const COLOR_MAP: Record<string, string> = {
  Pupuk: COLORS.chartPupuk,
  Insektisida: COLORS.chartInsektisida,
  Fungisida: COLORS.chartFungisida,
  Rodentisida: COLORS.chartRodentisida,
  'Jasa Pegawai': COLORS.chartJasaPegawai,
};

const CategoryBarChart: React.FC<Props> = ({ categoryTotals }) => {
  const hasData = categoryTotals.some((item) => item.total > 0);

  // Build chart data from category totals
  const labels = categoryTotals.map(
    (item) => LABEL_MAP[item.category] || item.category.slice(0, 5)
  );
  const values = categoryTotals.map((item) => item.total);

  // Ensure there's at least a tiny value so the chart renders properly
  const safeValues = values.map((v) => (v === 0 ? 0.01 : v));

  const data = {
    labels,
    datasets: [{ data: safeValues }],
  };

  const chartConfig = {
    backgroundColor: COLORS.surface,
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    fillShadowGradient: COLORS.primary,
    fillShadowGradientOpacity: 1,
    barPercentage: 0.6,
    propsForLabels: {
      fontSize: 10,
    },
    formatYLabel: (yValue: string) => formatCompact(Number(yValue)),
  };

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <Text style={styles.title}>Pengeluaran per Kategori</Text>

      {!hasData ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>Belum ada data pengeluaran</Text>
          <Text style={styles.emptySubtext}>
            Tambahkan pengeluaran untuk melihat grafik
          </Text>
        </View>
      ) : (
        <>
          {/* Bar Chart */}
          <View style={styles.chartContainer}>
            <BarChart
              data={data}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
              fromZero
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>

          {/* Category Color Legend */}
          <View style={styles.legendContainer}>
            {categoryTotals.map((item) => (
              <View key={item.category} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor:
                        COLOR_MAP[item.category] || COLORS.primary,
                    },
                  ]}
                />
                <Text style={styles.legendLabel}>
                  {LABEL_MAP[item.category] || item.category}
                </Text>
                <Text style={styles.legendValue}>
                  {formatCompact(item.total)}
                </Text>
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
  chartContainer: {
    alignItems: 'center',
    marginHorizontal: -SPACING.sm,
  },
  chart: {
    borderRadius: BORDER_RADIUS.md,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.full,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.xs,
  },
  legendLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  legendValue: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
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

export default CategoryBarChart;
