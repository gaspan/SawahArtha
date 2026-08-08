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
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { formatIDR, formatCurrencyInput } from '../utils/currency';
import type { Sale } from '../database/salesService';

interface Props {
  sales: Sale[];
  onUpdate: (id: number, gkgSold: number, pricePerKg: number) => Promise<void>;
  onDelete: (id: number) => void;
  onMarkPaid?: (id: number) => void;
}

export default function SalesList({ sales, onUpdate, onDelete, onMarkPaid }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

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

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
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
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: fs.sm,
    color: colors.textLight,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
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
    fontSize: fs.sm,
  },
  dateText: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: colors.textSecondary,
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
    fontSize: fs.sm,
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
    fontSize: fs.xs - 1,
    color: colors.textLight,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
  },
  infoValueBold: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primaryDark,
  },
  buyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  buyerLabel: {
    fontSize: fs.xs,
    color: colors.textSecondary,
  },
  buyerName: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: colors.text,
  },
  noteText: {
    fontSize: fs.xs,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.xs,
  },
  editBtn: {
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  editBtnText: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.amberDark,
  },
  editContainer: {
    backgroundColor: colors.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.secondary,
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
    borderColor: colors.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlign: 'center',
  },
  editKgLabel: {
    fontSize: fs.xs,
    color: colors.textLight,
  },
  editRpLabel: {
    fontSize: fs.xs,
    color: colors.textLight,
  },
  editPriceInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textInverse,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: colors.textSecondary,
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
});
