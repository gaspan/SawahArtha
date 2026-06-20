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
  totalExpenses: number;
  totalRevenue: number;
  zakatKg: number;
  zakatRp: number;
}

interface CardData {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  accentColor: string;
  valueColor: string;
}

export default function SummaryCards({
  totalExpenses,
  totalRevenue,
  zakatKg,
  zakatRp,
}: Props) {
  const netProfit = totalRevenue - totalExpenses;
  const isNegative = netProfit < 0;

  const cards: CardData[] = [
    {
      icon: '💰',
      label: 'Total Modal',
      value: formatIDR(totalExpenses),
      accentColor: '#EF4444',
      valueColor: '#EF4444',
    },
    {
      icon: '🌾',
      label: 'Total Pendapatan',
      value: formatIDR(totalRevenue),
      accentColor: '#059669',
      valueColor: '#059669',
    },
    {
      icon: '📊',
      label: 'Profit Bersih',
      value: formatIDR(netProfit),
      accentColor: '#3B82F6',
      valueColor: isNegative ? '#EF4444' : '#3B82F6',
    },
    {
      icon: '🕌',
      label: 'Zakat',
      value:
        zakatKg > 0
          ? `${zakatKg.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg`
          : '0 kg',
      subValue: zakatRp > 0 ? formatIDR(zakatRp) : undefined,
      accentColor: '#F59E0B',
      valueColor: '#B45309',
    },
  ];

  return (
    <View style={styles.grid}>
      {cards.map((card, index) => (
        <View key={index} style={styles.cardWrapper}>
          <View style={styles.card}>
            {/* Colored Accent Bar */}
            <View
              style={[styles.accentBar, { backgroundColor: card.accentColor }]}
            />

            {/* Card Body */}
            <View style={styles.cardBody}>
              {/* Icon + Label Row */}
              <View style={styles.labelRow}>
                <Text style={styles.icon}>{card.icon}</Text>
                <Text style={styles.label} numberOfLines={1}>
                  {card.label}
                </Text>
              </View>

              {/* Value */}
              <Text
                style={[styles.value, { color: card.valueColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {card.value}
              </Text>

              {/* Sub-value (for Zakat Rp) */}
              {card.subValue && (
                <Text
                  style={[styles.subValue, { color: card.valueColor }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  ≈ {card.subValue}
                </Text>
              )}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  cardWrapper: {
    width: '48%',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  cardBody: {
    padding: SPACING.sm,
    paddingTop: SPACING.sm + 2,
    paddingBottom: SPACING.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  icon: {
    fontSize: FONT_SIZE.md,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.3,
  },
  subValue: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: 2,
    opacity: 0.8,
  },
});
