import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { formatIDR } from '../utils/currency';

export interface FeedTransaction {
  id: string;
  type: 'expense' | 'income';
  title: string;
  amount: number;
  date: string;
  categoryOrMeta: string;
}

interface Props {
  transactions: FeedTransaction[];
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

export default function QuickFeed({ transactions }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>⏱️ Transaksi Terbaru</Text>

      {transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Belum ada transaksi musim ini</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {transactions.map((tx, index) => {
            const isIncome = tx.type === 'income';
            
            return (
              <View key={tx.id} style={styles.feedItem}>
                {/* Left side: Icon Badge */}
                <View
                  style={[
                    styles.iconBadge,
                    {
                      backgroundColor: isIncome
                        ? colors.successLight
                        : colors.dangerLight,
                    },
                  ]}
                >
                  <Text style={styles.iconEmoji}>
                    {isIncome ? '🌾' : '💰'}
                  </Text>
                </View>

                {/* Center: Title & Meta */}
                <View style={styles.centerBlock}>
                  <Text style={styles.title} numberOfLines={1}>
                    {tx.title}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.date}>📅 {formatDate(tx.date)}</Text>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {tx.categoryOrMeta}
                    </Text>
                  </View>
                </View>

                {/* Right: Amount */}
                <Text
                  style={[
                    styles.amount,
                    { color: isIncome ? colors.success : colors.danger },
                  ]}
                  numberOfLines={1}
                >
                  {isIncome ? '+' : '-'}
                  {formatIDR(tx.amount)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md + 4,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  cardTitle: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
    marginBottom: SPACING.sm + 2,
  },
  list: {
    gap: SPACING.sm + 2,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: SPACING.sm,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  iconEmoji: {
    fontSize: fs.md + 2,
  },
  centerBlock: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: fs.sm + 1,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  date: {
    fontSize: fs.xs - 1,
    color: colors.textLight,
  },
  bullet: {
    fontSize: fs.xs - 1,
    color: colors.textLight,
  },
  meta: {
    fontSize: fs.xs - 1,
    color: colors.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  amount: {
    fontSize: fs.sm + 1,
    fontWeight: FONT_WEIGHT.bold,
  },
  emptyContainer: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fs.sm,
    color: colors.textLight,
  },
});
