import { Fragment, useCallback } from 'react';
import {
  View,
  Text,
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

import { type Expense } from '../database/expenseService';

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (item: Expense) => void;
  onDelete: (id: number) => void;
  onMarkPaid?: (id: number) => void;
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
  onEdit,
  onDelete,
  onMarkPaid,
}: {
  item: Expense;
  onEdit: (item: Expense) => void;
  onDelete: (id: number) => void;
  onMarkPaid?: (id: number) => void;
}) {
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
    <View
      style={[
        styles.card,
        { borderLeftWidth: 3, borderLeftColor: COLORS.danger },
      ]}
    >
      {!item.is_paid && (
        <View style={styles.unpaidBadge}>
          <Text style={styles.unpaidBadgeText}>⏳ Hutang</Text>
          {onMarkPaid && (
            <TouchableOpacity
              style={styles.markPaidBtn}
              onPress={() => onMarkPaid(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.markPaidBtnText}>Tandai Lunas</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Header Row: Date + Actions */}
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(item)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>

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

      {/* Title + Amount */}
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

      {item.vendor_name ? (
        <View style={styles.vendorRow}>
          <Text style={styles.vendorLabel}>Supplier:</Text>
          <Text style={styles.vendorName}>{item.vendor_name}</Text>
        </View>
      ) : null}

      {/* Category Badge */}
      <View style={styles.cardBottomRow}>
        <View style={styles.categoryBadge}>
          <Text style={[styles.categoryBadgeText, { color: textColor }]}>
            {item.category}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ExpenseList({ expenses, onEdit, onDelete, onMarkPaid }: ExpenseListProps) {
  if (expenses.length === 0) {
    return <EmptyState />;
  }

  return (
    <View style={styles.listContent}>
      {expenses.map((item, index) => (
        <Fragment key={item.id.toString()}>
          {index > 0 && <View style={styles.separator} />}
          <ExpenseItem item={item} onEdit={onEdit} onDelete={onDelete} onMarkPaid={onMarkPaid} />
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
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
    ...SHADOW.md,
  },

  // Header Row
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm + 2,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dateIcon: {
    fontSize: FONT_SIZE.sm,
  },
  dateText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
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
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.danger,
    letterSpacing: 0.3,
  },

  // Category Badge
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.dangerLight,
  },
  categoryBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: 0.2,
  },

  // Actions
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    fontSize: FONT_SIZE.sm,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 14,
  },

  unpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.warningLight,
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  unpaidBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.warning,
  },
  markPaidBtn: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  markPaidBtnText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textInverse,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  vendorLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  vendorName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text,
  },
});
