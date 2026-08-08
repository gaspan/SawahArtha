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
import { isEstimatedGKG } from '../utils/zakat';
import { isValidGKG } from '../database/incomeService';
import type { Income } from '../database/incomeService';

interface Props {
  records: Income[];
  totalGKGSold: number;
  onDelete: (id: number) => void;
  onUpdateGKG: (id: number, gkgWeight: number) => Promise<void>;
}

export default function IncomeList({ records, totalGKGSold, onDelete, onUpdateGKG }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editGkg, setEditGkg] = useState('');

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

  const handleEditStart = useCallback((item: Income) => {
    setEditingId(item.id);
    setEditGkg(item.gkg_weight.toString());
  }, []);

  const handleSave = useCallback(
    (id: number, gkgWeight: number) => {
      const gkg = parseFloat(editGkg);
      if (!isValidGKG(gkg)) return;
      if (gkg < totalGKGSold) {
        Alert.alert(
          'Perhatian',
          `Stok terjual (${totalGKGSold.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg) melebihi GKG baru. Stok sisa akan 0 kg. Tetap simpan?`,
          [
            { text: 'Batal', style: 'cancel', onPress: () => setEditingId(null) },
            {
              text: 'Simpan',
              onPress: () => {
                onUpdateGKG(id, gkg);
                setEditingId(null);
              },
            },
          ],
        );
        return;
      }
      onUpdateGKG(id, gkg);
      setEditingId(null);
    },
    [editGkg, totalGKGSold, onUpdateGKG],
  );

  const handleCancel = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      Alert.alert('Hapus Data Panen', 'Hapus data panen ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => onDelete(id) },
      ]);
    },
    [onDelete],
  );

  if (records.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🌾</Text>
        <Text style={styles.emptyTitle}>Belum ada data panen</Text>
        <Text style={styles.emptySubtitle}>
          Tambahkan data hasil panen Anda untuk mulai menghitung pendapatan
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listContent}>
      {records.map((item, index) => {
        const isEditing = editingId === item.id;
        const estimated = isEstimatedGKG(item.gkg_weight, item.net_gkp);
        return (
          <React.Fragment key={item.id.toString()}>
            {index > 0 && <View style={styles.separator} />}

            <View style={styles.card}>
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

              <View style={styles.weightRow}>
                <View style={styles.weightItem}>
                  <Text style={styles.weightLabel}>GKP</Text>
                  <Text style={styles.weightValue}>
                    {item.gkp_weight.toLocaleString('id-ID')} kg
                  </Text>
                </View>
                <View style={styles.weightDivider} />
                <View style={styles.weightItem}>
                  <Text style={styles.weightLabel}>Gacong</Text>
                  <Text style={styles.weightValue}>
                    {item.gacong_weight > 0
                      ? `${item.gacong_weight.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg`
                      : '—'}
                  </Text>
                  {item.gacong_weight > 0 && (
                    <Text style={styles.weightSublabel}>
                      {item.gacong_type === 'pembagian'
                        ? `1/${item.gacong_input.toLocaleString('id-ID', { maximumFractionDigits: 1 })}`
                        : 'berat'}
                    </Text>
                  )}
                </View>
                <View style={styles.weightDivider} />
                <View style={styles.weightItem}>
                  <Text style={styles.weightLabel}>Bersih</Text>
                  <Text style={styles.weightValue}>
                    {item.net_gkp.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                  </Text>
                  <Text style={styles.weightSublabel}>kg</Text>
                </View>
                <View style={styles.weightDivider} />
                <View style={styles.weightItem}>
                  <Text style={styles.weightLabel}>GKG</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.editGkgInput}
                      value={editGkg}
                      onChangeText={setEditGkg}
                      keyboardType="decimal-pad"
                      maxLength={10}
                      autoFocus
                      selectTextOnFocus
                    />
                  ) : (
                    <>
                      <Text style={styles.weightValue}>
                        {item.gkg_weight.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
                      </Text>
                      <View style={styles.gkgBadgeRow}>
                        <Text style={styles.weightSublabel}>kg</Text>
                        {estimated ? (
                          <View style={styles.estimatedBadge}>
                            <Text style={styles.estimatedBadgeText}>~estimasi</Text>
                          </View>
                        ) : (
                          <View style={styles.actualBadge}>
                            <Text style={styles.actualBadgeText}>riil</Text>
                          </View>
                        )}
                      </View>
                    </>
                  )}
                </View>
              </View>

              {isEditing ? (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => handleSave(item.id, parseFloat(editGkg))}
                  >
                    <Text style={styles.saveBtnText}>Simpan</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                    <Text style={styles.cancelBtnText}>Batal</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.cardBottom}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleEditStart(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editBtnText}>✏️ Edit GKG</Text>
                  </TouchableOpacity>
                </View>
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
  weightRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  weightItem: {
    flex: 1,
    alignItems: 'center',
  },
  weightDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: SPACING.xs,
  },
  weightLabel: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  weightValue: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
  },
  weightSublabel: {
    fontSize: 9,
    color: colors.textLight,
    marginTop: 1,
  },
  gkgBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  estimatedBadge: {
    backgroundColor: colors.warningLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.xs + 1,
    paddingVertical: 1,
    borderWidth: 0.5,
    borderColor: colors.warning,
  },
  estimatedBadgeText: {
    fontSize: 8,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.warning,
  },
  actualBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.xs + 1,
    paddingVertical: 1,
    borderWidth: 0.5,
    borderColor: colors.primary,
  },
  actualBadgeText: {
    fontSize: 8,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primaryDark,
  },
  editGkgInput: {
    height: 32,
    width: 56,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlign: 'center',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
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
  editActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
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
});
