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
import { formatCurrencyInput } from '../utils/currency';

interface Props {
  visible: boolean;
  onSave: (data: {
    type: 'loan_in' | 'loan_out';
    counterparty: string;
    amount: number;
    interest_rate: number;
    due_date: string;
    note: string;
  }) => Promise<void>;
  onClose: () => void;
}

export default function AddDebtModal({ visible, onSave, onClose }: Props) {
  const [type, setType] = useState<'loan_in' | 'loan_out'>('loan_in');
  const [counterparty, setCounterparty] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [amountValue, setAmountValue] = useState(0);
  const [interestDisplay, setInterestDisplay] = useState('');
  const [interestValue, setInterestValue] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      setType('loan_in');
      setCounterparty('');
      setAmountDisplay('');
      setAmountValue(0);
      setInterestDisplay('');
      setInterestValue(0);
      setDueDate('');
      setNote('');
    }
  }, [visible]);

  const handleAmountChange = useCallback((text: string) => {
    const { display, value } = formatCurrencyInput(text);
    setAmountDisplay(display);
    setAmountValue(value);
  }, []);

  const handleInterestChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    setInterestDisplay(cleaned);
    setInterestValue(parseFloat(cleaned) || 0);
  }, []);

  const isValid = counterparty.trim().length > 0 && amountValue > 0;

  const handleSave = useCallback(async () => {
    if (!isValid) return;
    try {
      setIsSaving(true);
      await onSave({
        type,
        counterparty: counterparty.trim(),
        amount: amountValue,
        interest_rate: interestValue,
        due_date: dueDate || '',
        note: note.trim(),
      });
      onClose();
    } catch {
      Alert.alert('Error', 'Gagal menyimpan pinjaman.');
    } finally {
      setIsSaving(false);
    }
  }, [isValid, type, counterparty, amountValue, interestValue, dueDate, note, onSave, onClose]);

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
          <Text style={styles.title}>Tambah Pinjaman / Piutang</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Tipe</Text>
            <View style={styles.radioRow}>
              <TouchableOpacity
                style={[styles.radioOption, type === 'loan_in' && styles.radioOptionActive]}
                onPress={() => setType('loan_in')}
                activeOpacity={0.7}
              >
                <Text style={[styles.radioText, type === 'loan_in' && styles.radioTextActive]}>
                  Pinjaman Masuk
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioOption, type === 'loan_out' && styles.radioOptionActive]}
                onPress={() => setType('loan_out')}
                activeOpacity={0.7}
              >
                <Text style={[styles.radioText, type === 'loan_out' && styles.radioTextActive]}>
                  Piutang Keluar
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nama / Pihak</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., KUR BRI, Pak Ahmad"
              placeholderTextColor={COLORS.textLight}
              value={counterparty}
              onChangeText={setCounterparty}
              maxLength={100}
              autoFocus
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Jumlah</Text>
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
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Bunga (% per tahun)</Text>
              <Text style={styles.optionalBadge}>opsional</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={COLORS.textLight}
                value={interestDisplay}
                onChangeText={handleInterestChange}
                keyboardType="decimal-pad"
                maxLength={6}
              />
              <View style={styles.pctSuffix}>
                <Text style={styles.pctSuffixText}>%</Text>
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Jatuh Tempo</Text>
              <Text style={styles.optionalBadge}>opsional</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textLight}
              value={dueDate}
              onChangeText={setDueDate}
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
              placeholder="Tambahkan catatan..."
              placeholderTextColor={COLORS.textLight}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
              maxLength={200}
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
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xxl : SPACING.lg,
    maxHeight: '85%',
    ...SHADOW.lg,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
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
  },
  textArea: {
    height: 60,
    paddingTop: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
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
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    minHeight: 46,
  },
  pctSuffix: {
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  pctSuffixText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
  },
  radioRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  radioOption: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  radioOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  radioText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
  radioTextActive: {
    color: COLORS.primaryDark,
    fontWeight: FONT_WEIGHT.bold,
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
