import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
} from '../constants/theme';
import { formatIDR, formatCompact } from '../utils/currency';

interface Props {
  categoryTotals: Array<{ category: string; total: number }>;
  totalGKG: number;
}

const LABEL_MAP: Record<string, string> = {
  Pupuk: 'Pupuk',
  Insektisida: 'Insek.',
  Fungisida: 'Fungi.',
  Rodentisida: 'Roden.',
  'Jasa Pegawai': 'Jasa',
  'Item Barang': 'Barang',
  Herbisida: 'Herbi.',
  Moluksida: 'Moluk.',
};

const COLOR_MAP: Record<string, string> = {
  Pupuk: COLORS.chartPupuk,
  Insektisida: COLORS.chartInsektisida,
  Fungisida: COLORS.chartFungisida,
  Rodentisida: COLORS.chartRodentisida,
  'Jasa Pegawai': COLORS.chartJasaPegawai,
  'Item Barang': COLORS.chartItemBarang,
  Herbisida: COLORS.chartHerbisida,
  Moluksida: COLORS.chartMoluksida,
};

const CategoryBarChart: React.FC<Props> = ({ categoryTotals, totalGKG }) => {
  const totalAll = categoryTotals.reduce((s, c) => s + c.total, 0);
  const hasData = totalAll > 0;

  const barData = useMemo(() =>
    categoryTotals.map((item) => {
      const pct = totalAll > 0 ? (item.total / totalAll) * 100 : 0;
      return {
        value: item.total,
        frontColor: COLOR_MAP[item.category] || COLORS.primary,
        label: LABEL_MAP[item.category] || item.category.slice(0, 5),
        labelTextStyle: { color: COLORS.textLight, fontSize: 9 },
        topLabelComponent: () => (
          <View style={styles.topLabel}>
            <Text style={styles.topLabelText}>
              {pct.toLocaleString('id-ID', { maximumFractionDigits: 0 })}%
            </Text>
          </View>
        ),
      };
    }),
    [categoryTotals, totalAll],
  );

  const largest = useMemo(() =>
    categoryTotals.reduce((max, c) => (c.total > max.total ? c : max), categoryTotals[0]),
    [categoryTotals],
  );

  const showPricePerKg = totalGKG > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Pengeluaran per Kategori</Text>

      {!hasData ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>Belum ada data pengeluaran</Text>
          <Text style={styles.emptySubtext}>
            Tambahkan pengeluaran untuk melihat grafik
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.chartContainer}>
            <BarChart
              data={barData}
              width={280}
              height={200}
              barWidth={22}
              spacing={14}
              initialSpacing={10}
              endSpacing={10}
              noOfSections={4}
              yAxisTextStyle={{ color: COLORS.textLight, fontSize: 9 }}
              yAxisLabelPrefix=""
              yAxisLabelSuffix=""
              formatYLabel={(v) => formatCompact(Number(v))}
              roundedTop
              isAnimated
            />
          </View>

          <View style={styles.legendContainer}>
            {categoryTotals.map((item) => {
              const pct = totalAll > 0 ? (item.total / totalAll) * 100 : 0;
              const pricePerKg = showPricePerKg ? item.total / totalGKG : 0;
              return (
                <View key={item.category} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLOR_MAP[item.category] || COLORS.primary }]} />
                  <View style={styles.legendTextCol}>
                    <View style={styles.legendTopRow}>
                      <Text style={styles.legendLabel}>
                        {LABEL_MAP[item.category] || item.category}
                      </Text>
                      <Text style={styles.legendPct}>
                        {pct.toLocaleString('id-ID', { maximumFractionDigits: 0 })}%
                      </Text>
                    </View>
                    <Text style={styles.legendValue}>
                      {formatCompact(item.total)}
                      {showPricePerKg ? (
                        <Text style={styles.legendSub}> · {formatIDR(pricePerKg)}/kg</Text>
                      ) : null}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {largest && totalAll > 0 && (
            <View style={styles.insightRow}>
              <Text style={styles.insightText}>
                💡 Biaya terbesar: {LABEL_MAP[largest.category] || largest.category} ({((largest.total / totalAll) * 100).toLocaleString('id-ID', { maximumFractionDigits: 0 })}% dari modal)
              </Text>
            </View>
          )}
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
    marginBottom: SPACING.md,
  },
  topLabel: {
    marginBottom: 4,
    alignItems: 'center',
  },
  topLabelText: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
  },
  legendContainer: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SPACING.xs + 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
  },
  legendTextCol: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text,
  },
  legendPct: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  legendValue: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  legendSub: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: FONT_WEIGHT.normal,
    color: COLORS.textLight,
  },
  insightRow: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.warningLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  insightText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.text,
    textAlign: 'center',
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
