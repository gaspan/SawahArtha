import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
} from '../constants/theme';
import { formatIDR } from '../utils/currency';

interface Expense {
  id: number;
  title: string;
  description: string | null;
  amount: number;
  category: string;
  date: string;
}

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: number) => void;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>Belum ada pengeluaran</Text>
      <Text style={styles.emptySubtitle}>
        Mulai catat biaya operasional sawah Anda di sini
      </Text>
    </View>
  );
}

function ExpenseItem({
  item,
  onDelete,
}: {
  item: Expense;
  onDelete: (id: number) => void;
}) {
  const bgColor = COLORS.categoryBg[item.category] || COLORS.borderLight;
  const textColor = COLORS.categoryText[item.category] || COLORS.textSecondary;

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Hapus Pengeluaran',
      `Yakin ingin menghapus "${item.title}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => onDelete(item.id),
        },
      ],
    );
  }, [item.id, item.title, onDelete]);

  return (
    <View style={styles.card}>
      {/* Top Row: Title + Amount */}
      <View style={styles.cardTopRow}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.description ? (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>
        <Text style={styles.cardAmount}>{formatIDR(item.amount)}</Text>
      </View>

      {/* Bottom Row: Category Badge + Date + Delete */}
      <View style={styles.cardBottomRow}>
        <View style={styles.cardMeta}>
          <View style={[styles.categoryBadge, { backgroundColor: bgColor }]}>
            <Text style={[styles.categoryBadgeText, { color: textColor }]}>
              {item.category}
            </Text>
          </View>
          <Text style={styles.dateText}>📅 {formatDate(item.date)}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ExpenseList({ expenses, onDelete }: ExpenseListProps) {
  const renderItem = useCallback(
    ({ item }: { item: Expense }) => (
      <ExpenseItem item={item} onDelete={onDelete} />
    ),
    [onDelete],
  );

  const keyExtractor = useCallback(
    (item: Expense) => item.id.toString(),
    [],
  );

  return (
    <FlatList
      data={expenses}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={[
        styles.listContent,
        expenses.length === 0 && styles.listContentEmpty,
      ]}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={EmptyState}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  separator: {
    height: SPACING.sm,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: SPACING.md,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.md,
  },

  // Top Row
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm + 2,
  },
  cardInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  cardAmount: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.danger,
    letterSpacing: 0.3,
  },

  // Bottom Row
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  categoryBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: 0.2,
  },
  dateText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },

  // Delete
  deleteButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.dangerLight,
    marginLeft: SPACING.sm,
  },
  deleteIcon: {
    fontSize: 16,
  },
});
