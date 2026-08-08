import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
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

function getColorMap(colors: ThemeColors): Record<string, string> {
  return {
    Pupuk: colors.chartPupuk,
    Insektisida: colors.chartInsektisida,
    Fungisida: colors.chartFungisida,
    Rodentisida: colors.chartRodentisida,
    'Jasa Pegawai': colors.chartJasaPegawai,
    'Item Barang': colors.chartItemBarang,
    Herbisida: colors.chartHerbisida,
    Moluksida: colors.chartMoluksida,
  };
}

const CategoryBarChart: React.FC<Props> = ({ categoryTotals, totalGKG }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const colorMap = getColorMap(colors);
  const totalAll = categoryTotals.reduce((s, c) => s + c.total, 0);
  const hasData = totalAll > 0;

  const barData = useMemo(() =>
    categoryTotals.map((item) => {
      const pct = totalAll > 0 ? (item.total / totalAll) * 100 : 0;
      return {
        value: item.total,
        frontColor: colorMap[item.category] || colors.primary,
        label: LABEL_MAP[item.category] || item.category.slice(0, 5),
        labelTextStyle: { color: colors.textLight, fontSize: 9 },
        topLabelComponent: () => (
          <View style={styles.topLabel}>
            <Text style={styles.topLabelText}>
              {pct.toLocaleString('id-ID', { maximumFractionDigits: 0 })}%
            </Text>
          </View>
        ),
      };
    }),
    [categoryTotals, totalAll, colors],
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
              yAxisTextStyle={{ color: colors.textLight, fontSize: 9 }}
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
                  <View style={[styles.legendDot, { backgroundColor: colorMap[item.category] || colors.primary }]} />
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
  chartContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  topLabel: {
    marginBottom: 4,
    alignItems: 'center',
  },
  topLabelText: {
    fontSize: fs.xs - 1,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textSecondary,
  },
  legendContainer: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
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
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: colors.text,
  },
  legendPct: {
    fontSize: fs.xs - 1,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.textSecondary,
  },
  legendValue: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.textSecondary,
  },
  legendSub: {
    fontSize: fs.xs - 1,
    fontWeight: FONT_WEIGHT.normal,
    color: colors.textLight,
  },
  insightRow: {
    marginTop: SPACING.sm,
    backgroundColor: colors.warningLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  insightText: {
    fontSize: fs.xs,
    color: colors.text,
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

export default CategoryBarChart;
