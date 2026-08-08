import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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

interface Props {
  visible: boolean;
  recordId: number | null;
  onConfirm: (id: number, paymentDate: string) => Promise<void>;
  onClose: () => void;
}

export default function MarkPaidModal({
  visible,
  recordId,
  onConfirm,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [paymentDate, setPaymentDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  }, [visible]);

  const handleSave = useCallback(async () => {
    if (!recordId || !paymentDate) return;
    try {
      setIsSaving(true);
      await onConfirm(recordId, paymentDate);
      onClose();
    } catch {
      // handled by parent
    } finally {
      setIsSaving(false);
    }
  }, [recordId, paymentDate, onConfirm, onClose]);

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
          <Text style={styles.title}>Tandai Lunas</Text>
          <Text style={styles.subtitle}>Catat tanggal pelunasan piutang</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Tanggal Pembayaran</Text>
            <TextInput
              style={styles.input}
              value={paymentDate}
              onChangeText={setPaymentDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textLight}
              autoFocus
              maxLength={10}
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
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={isSaving || !paymentDate}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? '...' : 'Tandai Lunas'}
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
    width: '85%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.lg,
  },
  title: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: fs.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
    backgroundColor: colors.background,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textInverse,
  },
});
