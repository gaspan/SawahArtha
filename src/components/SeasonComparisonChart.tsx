import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
} from '../constants/theme';
import { formatIDR, formatCompact } from '../utils/currency';
import type { SeasonMetrics } from '../database/analyticsService';

interface Props {
  metrics: SeasonMetrics[];
  currentSeasonCode: string;
}

type Tab = 'profit' | 'hpp' | 'productivity';

export default function SeasonComparisonChart({ metrics, currentSeasonCode }: Props) {
  const [tab, setTab] = useState<Tab>('profit');

  if (metrics.length < 2) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Perbandingan Antar Musim</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📈</Text>
          <Text style={styles.emptyText}>Butuh minimal 2 musim</Text>
          <Text style={styles.emptySubtext}>Data perbandingan musim akan muncul setelah ada 2 musim atau lebih</Text>
        </View>
      </View>
    );
  }

  const labels = metrics.map((m) => m.season_code);
  const currentIdx = metrics.findIndex((m) => m.season_code === currentSeasonCode);

  const chartData = useMemo(() => {
    return metrics.map((m, i) => {
      let value: number;
      if (tab === 'profit') {
        value = m.totalRevenue - m.totalExpenses;
      } else if (tab === 'hpp') {
        value = m.totalGKG > 0 ? m.totalExpenses / m.totalGKG : 0;
      } else {
        const totalKuintal = m.totalGKP / 100;
        const totalHectares = m.land_size_m2 / 10000;
        value = totalHectares > 0 ? totalKuintal / totalHectares : 0;
      }
      return {
        value: Math.round(value),
        dataPointColor: i === currentIdx ? COLORS.secondary : COLORS.primary,
        labelComponent: () => null as any,
      };
    });
  }, [metrics, tab, currentIdx]);

  const prevIdx = metrics.length > 1 ? metrics.length - 2 : -1;
  const currMetrics = metrics[metrics.length - 1];
  const prevMetrics = prevIdx >= 0 ? metrics[prevIdx] : null;

  const deltaLabel = useMemo(() => {
    if (!prevMetrics || !currMetrics) return '';
    let currVal: number, prevVal: number;
    if (tab === 'profit') {
      currVal = currMetrics.totalRevenue - currMetrics.totalExpenses;
      prevVal = prevMetrics.totalRevenue - prevMetrics.totalExpenses;
    } else if (tab === 'hpp') {
      currVal = currMetrics.totalGKG > 0 ? currMetrics.totalExpenses / currMetrics.totalGKG : 0;
      prevVal = prevMetrics.totalGKG > 0 ? prevMetrics.totalExpenses / prevMetrics.totalGKG : 0;
    } else {
      const toHa = (m: SeasonMetrics) => {
        const ha = m.land_size_m2 / 10000;
        return ha > 0 ? (m.totalGKP / 100) / ha : 0;
      };
      currVal = toHa(currMetrics);
      prevVal = toHa(prevMetrics);
    }
    if (prevVal === 0) return 'Musim sebelumnya: 0';
    const pct = ((currVal - prevVal) / Math.abs(prevVal)) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toLocaleString('id-ID', { maximumFractionDigits: 1 })}% vs ${prevMetrics.season_code}`;
  }, [currMetrics, prevMetrics, tab]);

  const yAxisLabel = tab === 'profit' || tab === 'hpp' ? 'Rp' : 'Ku/Ha';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Perbandingan Antar Musim</Text>

      <View style={styles.tabRow}>
        <TabButton active={tab === 'profit'} label="Laba Bersih" onPress={() => setTab('profit')} />
        <TabButton active={tab === 'hpp'} label="HPP" onPress={() => setTab('hpp')} />
        <TabButton active={tab === 'productivity'} label="Produktivitas" onPress={() => setTab('productivity')} />
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={280}
          height={160}
          spacing={metrics.length <= 3 ? 80 : 50}
          initialSpacing={20}
          endSpacing={20}
          color={COLORS.primary}
          thickness={2}
          startFillColor={`${COLORS.primary}20`}
          endFillColor={`${COLORS.primary}02`}
          startOpacity={0.4}
          endOpacity={0.1}
          hideDataPoints={false}
          dataPointsRadius={4}
          dataPointsColor={COLORS.primary}
          xAxisLabelTexts={labels}
          xAxisLabelTextStyle={styles.axisLabel}
          noOfSections={4}
          yAxisTextStyle={styles.axisLabel}
          yAxisLabelPrefix={yAxisLabel === 'Rp' ? '' : ''}
          yAxisLabelSuffix={yAxisLabel !== 'Rp' ? ` ${yAxisLabel}` : ''}
          formatYLabel={(v) => yAxisLabel === 'Rp' ? formatCompact(Number(v)) : v}
          areaChart
          curved
          showReferenceLine1={tab === 'profit'}
          referenceLine1Position={0}
          referenceLine1Config={{ color: COLORS.borderLight, thickness: 1, dashWidth: 4, dashGap: 4 }}
        />
      </View>

      {deltaLabel ? (
        <View style={styles.deltaRow}>
          <Text style={styles.deltaText}>{deltaLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[tabStyles.button, active && tabStyles.buttonActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[tabStyles.text, active && tabStyles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const tabStyles = StyleSheet.create({
  button: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  buttonActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  text: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
  textActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
});

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
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  chartContainer: {
    alignItems: 'center',
  },
  axisLabel: {
    fontSize: 9,
    color: COLORS.textLight,
  },
  deltaRow: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    alignItems: 'center',
  },
  deltaText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
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
    textAlign: 'center',
  },
});
