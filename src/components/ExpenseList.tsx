import { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { formatIDR } from '../utils/currency';

import { buildExpenseListItems } from '../utils/expenseListItems';
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
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

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
  style,
}: {
  item: Expense;
  onEdit: (item: Expense) => void;
  onDelete: (id: number) => void;
  onMarkPaid?: (id: number) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const textColor = colors.categoryText[item.category] || colors.textSecondary;

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
        style,
        { borderLeftWidth: 3, borderLeftColor: colors.danger },
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

      {/* Category Badge & Receipt Indicator */}
      <View style={styles.cardBottomRow}>
        <View style={styles.categoryBadge}>
          <Text style={[styles.categoryBadgeText, { color: textColor }]}>
            {item.category}
          </Text>
        </View>
        {Boolean(item.has_receipt) && (
          <View style={styles.receiptIndicator}>
            <Text style={styles.receiptIndicatorText}>📄 Struk</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function ExpenseList({ expenses, onEdit, onDelete, onMarkPaid }: ExpenseListProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (expenses.length === 0) {
    return <EmptyState />;
  }

  return (
    <View style={styles.listContent}>
      {buildExpenseListItems(expenses).map(({ key, item, hasTopSpacing }) => (
        <ExpenseItem
          key={key}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onMarkPaid={onMarkPaid}
          style={hasTopSpacing ? styles.separator : undefined}
        />
      ))}
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  separator: {
    marginTop: SPACING.sm,
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
    fontSize: fs.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: fs.sm,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.md,
    ...SHADOW.sm,
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
    fontSize: fs.sm,
  },
  dateText: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: colors.textSecondary,
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
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: fs.sm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  cardAmount: {
    fontSize: fs.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.danger,
    letterSpacing: 0.3,
  },

  // Category Badge
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: colors.dangerLight,
  },
  categoryBadgeText: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: 0.2,
  },
  receiptIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.xs,
    backgroundColor: colors.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  receiptIndicatorText: {
    fontSize: fs.xs - 1,
    color: colors.success,
    fontWeight: FONT_WEIGHT.semibold,
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
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    fontSize: fs.sm,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: colors.dangerLight,
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
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  unpaidBadgeText: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.warning,
  },
  markPaidBtn: {
    backgroundColor: colors.success,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  markPaidBtnText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textInverse,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  vendorLabel: {
    fontSize: fs.xs,
    color: colors.textSecondary,
  },
  vendorName: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: colors.text,
  },
});
