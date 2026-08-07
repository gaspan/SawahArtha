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
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
} from '../constants/theme';
import { formatCurrencyInput, formatIDR } from '../utils/currency';
import type { Debt } from '../database/debtService';

interface Props {
  visible: boolean;
  debt: Debt | null;
  onSave: (debtId: number, amount: number, paymentDate: string, note?: string) => Promise<void>;
  onClose: () => void;
}

export default function DebtPaymentModal({ visible, debt, onSave, onClose }: Props) {
  const [amountDisplay, setAmountDisplay] = useState('');
  const [amountValue, setAmountValue] = useState(0);
  const [paymentDate, setPaymentDate] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const maxAmount = debt ? debt.amount - debt.paid_amount : 0;

  useEffect(() => {
    if (visible && debt) {
      setAmountDisplay('');
      setAmountValue(0);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
  }, [visible, debt]);

  const handleAmountChange = useCallback((text: string) => {
    const { display, value } = formatCurrencyInput(text);
    setAmountDisplay(display);
    setAmountValue(value);
  }, []);

  const isValid = amountValue > 0 && amountValue <= maxAmount && paymentDate.length > 0;

  const handleSave = useCallback(async () => {
    if (!debt || !isValid) return;
    try {
      setIsSaving(true);
      await onSave(debt.id, amountValue, paymentDate, note.trim() || undefined);
      onClose();
    } catch {
      Alert.alert('Error', 'Gagal mencatat pembayaran.');
    } finally {
      setIsSaving(false);
    }
  }, [debt, isValid, amountValue, paymentDate, note, onSave, onClose]);

  if (!debt) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.card}>
          <Text style={styles.title}>
            {debt.type === 'loan_in' ? 'Bayar Cicilan' : 'Catat Penerimaan'}
          </Text>
          <Text style={styles.subtitle}>{debt.counterparty}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total</Text>
            <Text style={styles.infoValue}>{formatIDR(debt.amount)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sudah Dibayar</Text>
            <Text style={styles.infoValue}>{formatIDR(debt.paid_amount)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sisa</Text>
            <Text style={styles.infoValueHighlight}>{formatIDR(maxAmount)}</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Jumlah Pembayaran</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.currencyPrefix}>
                <Text style={styles.currencyPrefixText}>Rp</Text>
              </View>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={COLORS.textLight}
                value={amountDisplay}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                maxLength={15}
                autoFocus
              />
            </View>
            {amountValue > maxAmount && (
              <Text style={styles.errorText}>
                Maksimum: {formatIDR(maxAmount)}
              </Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Tanggal Pembayaran</Text>
            <TextInput
              style={styles.input}
              value={paymentDate}
              onChangeText={setPaymentDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textLight}
              maxLength={10}
            />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Catatan</Text>
              <Text style={styles.optionalBadge}>opsional</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Cicilan ke-2"
              placeholderTextColor={COLORS.textLight}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
              maxLength={100}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, (!isValid || isSaving) && styles.saveButtonDisabled]}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={!isValid || isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? '...' : 'Simpan'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: '90%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.lg,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  infoLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text,
  },
  infoValueHighlight: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  fieldGroup: {
    marginBottom: SPACING.sm + 2,
  },
  label: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  optionalBadge: {
    fontSize: 10,
    color: COLORS.textLight,
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.full,
  },
  input: {
    height: 46,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    textAlign: 'center',
  },
  textArea: {
    height: 56,
    paddingTop: SPACING.sm,
    textAlign: 'left',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  currencyPrefix: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: BORDER_RADIUS.md - 1,
    borderBottomLeftRadius: BORDER_RADIUS.md - 1,
    alignSelf: 'stretch',
    minWidth: 45,
  },
  currencyPrefixText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  amountInput: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    minHeight: 46,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.danger,
    marginTop: 2,
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  saveButton: {
    flex: 1,
    height: 46,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textInverse,
  },
});
