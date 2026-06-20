import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
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
import { formatIDR, formatCurrencyInput } from '../utils/currency';

interface HarvestRecord {
  id: number;
  gkp_weight: number;
  gkg_weight: number;
  price_per_kg: number;
  total_revenue: number;
  date: string;
}

interface Props {
  records: Array<HarvestRecord>;
  onUpdatePrice: (id: number, price: number) => void;
  onDelete: (id: number) => void;
}

export default function IncomeList({ records, onUpdatePrice, onDelete }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDisplay, setEditDisplay] = useState('');
  const [editValue, setEditValue] = useState(0);

  const handleEditStart = useCallback((record: HarvestRecord) => {
    setEditingId(record.id);
    if (record.price_per_kg > 0) {
      const { display } = formatCurrencyInput(record.price_per_kg.toString());
      setEditDisplay(display);
      setEditValue(record.price_per_kg);
    } else {
      setEditDisplay('');
      setEditValue(0);
    }
  }, []);

  const handlePriceChange = useCallback((text: string) => {
    const { display, value } = formatCurrencyInput(text);
    setEditDisplay(display);
    setEditValue(value);
  }, []);

  const handleSave = useCallback(
    (id: number) => {
      onUpdatePrice(id, editValue);
      setEditingId(null);
      setEditDisplay('');
      setEditValue(0);
    },
    [editValue, onUpdatePrice],
  );

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setEditDisplay('');
    setEditValue(0);
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      Alert.alert(
        'Hapus Data Panen',
        'Apakah Anda yakin ingin menghapus data panen ini?',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: () => onDelete(id),
          },
        ],
      );
    },
    [onDelete],
  );

  const formatDate = (dateStr: string): string => {
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
  };

  const renderItem = useCallback(
    ({ item }: { item: HarvestRecord }) => {
      const isEditing = editingId === item.id;

      return (
        <View style={styles.card}>
          {/* Header Row: Date + Delete */}
          <View style={styles.cardHeader}>
            <View style={styles.dateContainer}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={styles.dateText}>{formatDate(item.date)}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>

          {/* Weight Info */}
          <View style={styles.weightRow}>
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>GKP</Text>
              <Text style={styles.weightValue}>
                {item.gkp_weight.toLocaleString('id-ID')} kg
              </Text>
            </View>
            <View style={styles.weightDivider} />
            <View style={styles.weightItem}>
              <Text style={styles.weightLabel}>GKG</Text>
              <Text style={styles.weightValue}>
                {item.gkg_weight.toLocaleString('id-ID', {
                  maximumFractionDigits: 1,
                })}{' '}
                kg
              </Text>
              <Text style={styles.weightSublabel}>Gabah Kering Giling</Text>
            </View>
          </View>

          {/* Price Section */}
          <View style={styles.priceSection}>
            {isEditing ? (
              <View style={styles.editContainer}>
                <Text style={styles.editLabel}>Harga per kg:</Text>
                <View style={styles.editInputRow}>
                  <Text style={styles.inputPrefix}>Rp</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={editDisplay}
                    onChangeText={handlePriceChange}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={COLORS.textLight}
                    autoFocus
                  />
                </View>
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => handleSave(item.id)}
                  >
                    <Text style={styles.saveButtonText}>Simpan</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>Batal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.priceDisplay}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Harga/kg:</Text>
                  {item.price_per_kg > 0 ? (
                    <Text style={styles.priceValue}>
                      {formatIDR(item.price_per_kg)}
                    </Text>
                  ) : (
                    <View style={styles.unsoldBadge}>
                      <Text style={styles.unsoldBadgeText}>Belum dijual</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.editPriceButton}
                  onPress={() => handleEditStart(item)}
                >
                  <Text style={styles.editPriceButtonText}>✏️ Edit Harga</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Total Revenue */}
          <View style={styles.revenueSection}>
            <Text style={styles.revenueLabel}>Total Pendapatan</Text>
            <Text
              style={[
                styles.revenueValue,
                item.total_revenue === 0 && styles.revenueZero,
              ]}
            >
              {formatIDR(item.total_revenue)}
            </Text>
          </View>
        </View>
      );
    },
    [
      editingId,
      editDisplay,
      handlePriceChange,
      handleSave,
      handleCancel,
      handleEditStart,
      handleDelete,
    ],
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🌾</Text>
      <Text style={styles.emptyTitle}>Belum ada data panen</Text>
      <Text style={styles.emptySubtitle}>
        Tambahkan data hasil panen Anda untuk mulai menghitung pendapatan
      </Text>
    </View>
  );

  return (
    <FlatList
      data={records}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={[
        styles.listContent,
        records.length === 0 && styles.listContentEmpty,
      ]}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  separator: {
    height: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOW.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
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
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: FONT_SIZE.sm,
  },

  // Weight Section
  weightRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  weightItem: {
    flex: 1,
    alignItems: 'center',
  },
  weightDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  weightLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  weightValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  weightSublabel: {
    fontSize: 9,
    color: COLORS.textLight,
    marginTop: 1,
  },

  // Price Section
  priceSection: {
    marginBottom: SPACING.sm,
  },
  priceDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  priceLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  unsoldBadge: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  unsoldBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: '#B45309',
  },
  editPriceButton: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  editPriceButtonText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: '#B45309',
  },

  // Edit Mode
  editContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  editLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  editInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  inputPrefix: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  priceInput: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
  },
  editActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textInverse,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },

  // Revenue Section
  revenueSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm,
  },
  revenueLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
  revenueValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  revenueZero: {
    color: COLORS.textLight,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
