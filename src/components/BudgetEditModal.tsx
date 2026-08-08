import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { formatCurrencyInput, formatIDR } from '../utils/currency';

interface Props {
  visible: boolean;
  category: string | null;
  currentAmount: number;
  actualSpent: number;
  onSave: (amount: number) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

export default function BudgetEditModal({
  visible,
  category,
  currentAmount,
  actualSpent,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [amountDisplay, setAmountDisplay] = useState('');
  const [amountValue, setAmountValue] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && category) {
      const { display } = formatCurrencyInput(currentAmount.toString());
      setAmountDisplay(display);
      setAmountValue(currentAmount);
    } else {
      setAmountDisplay('');
      setAmountValue(0);
    }
  }, [visible, category, currentAmount]);

  const handleAmountChange = useCallback((text: string) => {
    const { display, value } = formatCurrencyInput(text);
    setAmountDisplay(display);
    setAmountValue(value);
  }, []);

  const handleSave = useCallback(async () => {
    if (amountValue < 0) {
      Alert.alert('Input Tidak Valid', 'Jumlah anggaran tidak boleh negatif.');
      return;
    }
    if (amountValue === currentAmount) {
      onClose();
      return;
    }
    if (amountValue < actualSpent) {
      Alert.alert(
        'Konfirmasi',
        `Realisasi (${formatIDR(actualSpent)}) lebih besar dari anggaran baru (${formatIDR(amountValue)}).\n\nKategori langsung berstatus lewat anggaran. Lanjut?`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Lanjut',
            onPress: async () => {
              try {
                setIsSaving(true);
                await onSave(amountValue);
                onClose();
              } catch {
                Alert.alert('Error', 'Gagal menyimpan anggaran.');
              } finally {
                setIsSaving(false);
              }
            },
          },
        ],
      );
      return;
    }

    try {
      setIsSaving(true);
      await onSave(amountValue);
      onClose();
    } catch {
      Alert.alert('Error', 'Gagal menyimpan anggaran.');
    } finally {
      setIsSaving(false);
    }
  }, [amountValue, currentAmount, actualSpent, onSave, onClose]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Hapus Anggaran',
      `Hapus anggaran untuk "${category}"? Data realisasi tetap tersimpan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete();
              onClose();
            } catch {
              Alert.alert('Error', 'Gagal menghapus anggaran.');
            }
          },
        },
      ],
    );
  }, [category, onDelete, onClose]);

  const hasChanged = amountValue !== currentAmount;
  const categoryBg = colors.categoryBg[category ?? ''] || colors.primaryLight;
  const categoryText = colors.categoryText[category ?? ''] || colors.primaryDark;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.card}>
          <View style={styles.header}>
            <View style={[styles.catBadge, { backgroundColor: categoryBg }]}>
              <Text style={[styles.catBadgeText, { color: categoryText }]}>
                {category}
              </Text>
            </View>
            <Text style={styles.title}>Atur Anggaran</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Realisasi saat ini</Text>
            <Text style={styles.infoValue}>{formatIDR(actualSpent)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Anggaran sekarang</Text>
            <Text style={styles.infoValue}>
              {currentAmount > 0 ? formatIDR(currentAmount) : 'Belum diatur'}
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Anggaran Baru</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.currencyPrefix}>
                <Text style={styles.currencyPrefixText}>Rp</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colors.textLight}
                value={amountDisplay}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                maxLength={15}
                autoFocus
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteButtonText}>Hapus</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!hasChanged || isSaving) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={!hasChanged || isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xxl : SPACING.lg,
    ...SHADOW.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  catBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.sm,
  },
  catBadgeText: {
    fontSize: fs.xs + 1,
    fontWeight: FONT_WEIGHT.bold,
  },
  title: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: colors.background,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  infoLabel: {
    fontSize: fs.xs,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    ...SHADOW.sm,
  },
  currencyPrefix: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: BORDER_RADIUS.md - 1,
    borderBottomLeftRadius: BORDER_RADIUS.md - 1,
    alignSelf: 'stretch',
    minWidth: 45,
  },
  currencyPrefixText: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primaryDark,
  },
  input: {
    flex: 1,
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    minHeight: 48,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  deleteButton: {
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  deleteButtonText: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.danger,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.primaryMuted,
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textInverse,
  },
});
