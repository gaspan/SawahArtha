import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
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
import type { Sale } from '../database/salesService';

interface Props {
  sales: Sale[];
  onUpdate: (id: number, gkgSold: number, pricePerKg: number) => Promise<void>;
  onDelete: (id: number) => void;
  onMarkPaid?: (id: number) => void;
}

export default function SalesList({ sales, onUpdate, onDelete, onMarkPaid }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editKg, setEditKg] = useState('');
  const [editPriceDisplay, setEditPriceDisplay] = useState('');
  const [editPriceValue, setEditPriceValue] = useState(0);

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleEditStart = useCallback((sale: Sale) => {
    setEditingId(sale.id);
    setEditKg(sale.gkg_sold.toString());
    const { display } = formatCurrencyInput(sale.price_per_kg.toString());
    setEditPriceDisplay(display);
    setEditPriceValue(sale.price_per_kg);
  }, []);

  const handlePriceChange = useCallback((text: string) => {
    const { display, value } = formatCurrencyInput(text);
    setEditPriceDisplay(display);
    setEditPriceValue(value);
  }, []);

  const handleSave = useCallback(
    (id: number) => {
      const gkg = parseFloat(editKg) || 0;
      if (gkg <= 0 || editPriceValue <= 0) return;
      onUpdate(id, gkg, editPriceValue);
      setEditingId(null);
    },
    [editKg, editPriceValue, onUpdate],
  );

  const handleCancel = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      Alert.alert('Hapus Penjualan', 'Hapus data penjualan ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => onDelete(id) },
      ]);
    },
    [onDelete],
  );

  if (sales.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>Belum ada penjualan</Text>
        <Text style={styles.emptySubtitle}>Catat penjualan gabah Anda untuk melacak pendapatan</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContent}>
      {sales.map((sale, index) => {
        const isEditing = editingId === sale.id;
        return (
          <React.Fragment key={sale.id.toString()}>
            {index > 0 && <View style={styles.separator} />}

            <View style={styles.card}>
              {!sale.is_paid && (
                <View style={styles.unpaidBadge}>
                  <Text style={styles.unpaidBadgeText}>⏳ Piutang</Text>
                  {onMarkPaid && (
                    <TouchableOpacity
                      style={styles.markPaidBtn}
                      onPress={() => onMarkPaid(sale.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.markPaidBtnText}>Tandai Lunas</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={styles.cardHeader}>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateIcon}>📅</Text>
                  <Text style={styles.dateText}>{formatDate(sale.date)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(sale.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>

              {isEditing ? (
                <View style={styles.editContainer}>
                  <View style={styles.editRow}>
                    <TextInput
                      style={styles.editKgInput}
                      value={editKg}
                      onChangeText={setEditKg}
                      keyboardType="decimal-pad"
                      placeholder="kg"
                      maxLength={10}
                    />
                    <Text style={styles.editKgLabel}>kg ×</Text>
                    <Text style={styles.editRpLabel}>Rp</Text>
                    <TextInput
                      style={styles.editPriceInput}
                      value={editPriceDisplay}
                      onChangeText={handlePriceChange}
                      keyboardType="numeric"
                      placeholder="0"
                      maxLength={12}
                    />
                  </View>
                  <View style={styles.editActions}>
                    <TouchableOpacity style={styles.saveBtn} onPress={() => handleSave(sale.id)}>
                      <Text style={styles.saveBtnText}>Simpan</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                      <Text style={styles.cancelBtnText}>Batal</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.infoRow}>
                    <View style={styles.infoBox}>
                      <Text style={styles.infoLabel}>Jumlah</Text>
                      <Text style={styles.infoValue}>
                        {sale.gkg_sold.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
                      </Text>
                    </View>
                    <View style={styles.infoBox}>
                      <Text style={styles.infoLabel}>Harga</Text>
                      <Text style={styles.infoValue}>{formatIDR(sale.price_per_kg)}/kg</Text>
                    </View>
                    <View style={styles.infoBox}>
                      <Text style={styles.infoLabel}>Total</Text>
                      <Text style={styles.infoValueBold}>{formatIDR(sale.total_revenue)}</Text>
                    </View>
                  </View>

                  {sale.buyer_name ? (
                    <View style={styles.buyerRow}>
                      <Text style={styles.buyerLabel}>Pembeli:</Text>
                      <Text style={styles.buyerName}>{sale.buyer_name}</Text>
                    </View>
                  ) : null}

                  {sale.note ? (
                    <Text style={styles.noteText}>{sale.note}</Text>
                  ) : null}

                  <View style={styles.cardBottom}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => handleEditStart(sale)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.editBtnText}>✏️ Edit</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </React.Fragment>
        );
      })}
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  infoBox: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  infoValueBold: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  buyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  buyerLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  buyerName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text,
  },
  noteText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.xs,
  },
  editBtn: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  editBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.amberDark,
  },
  editContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  editKgInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    textAlign: 'center',
  },
  editKgLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
  editRpLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
  editPriceInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textInverse,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
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
});
