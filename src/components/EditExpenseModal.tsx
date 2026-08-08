/**
 * EditExpenseModal - Modal for editing an existing expense record
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  CATEGORIES,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { formatCurrencyInput, formatIDR } from '../utils/currency';

interface Expense {
  id: number;
  title: string;
  description: string | null;
  amount: number;
  category: string;
}

interface EditExpenseModalProps {
  visible: boolean;
  expense: Expense | null;
  onClose: () => void;
  onSave: (
    id: number,
    data: {
      title: string;
      description: string;
      amount: number;
      category: string;
    }
  ) => Promise<void>;
}

export default function EditExpenseModal({
  visible,
  expense,
  onClose,
  onSave,
}: EditExpenseModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [amountValue, setAmountValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize fields when expense changes or modal opens
  useEffect(() => {
    if (visible && expense) {
      setTitle(expense.title);
      setDescription(expense.description || '');
      setSelectedCategory(expense.category);
      
      const { display } = formatCurrencyInput(expense.amount.toString());
      setAmountDisplay(display);
      setAmountValue(expense.amount);
    } else {
      setTitle('');
      setDescription('');
      setAmountDisplay('');
      setAmountValue(0);
      setSelectedCategory(null);
    }
  }, [visible, expense]);

  const isValid =
    title.trim().length > 0 && amountValue > 0 && selectedCategory !== null;

  const handleAmountChange = useCallback((text: string) => {
    const { display, value } = formatCurrencyInput(text);
    setAmountDisplay(display);
    setAmountValue(value);
  }, []);

  const handleSave = useCallback(async () => {
    if (!isValid || !selectedCategory || !expense) return;

    try {
      setIsSaving(true);
      await onSave(expense.id, {
        title: title.trim(),
        description: description.trim(),
        amount: amountValue,
        category: selectedCategory,
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Gagal memperbarui pengeluaran.');
    } finally {
      setIsSaving(false);
    }
  }, [isValid, title, description, amountValue, selectedCategory, expense, onSave, onClose]);

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
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Card */}
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>✏️ Edit Pengeluaran</Text>
            <Text style={styles.subtitle}>Ubah rincian biaya operasional</Text>
          </View>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Judul Pengeluaran</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Beli Pupuk Urea"
                  placeholderTextColor={colors.textLight}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>
            </View>

            {/* Description Input */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Deskripsi / Catatan</Text>
                <Text style={styles.optionalBadge}>opsional</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tambahkan catatan jika perlu..."
                  placeholderTextColor={colors.textLight}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nilai Harga</Text>
              <View style={[styles.inputWrapper, styles.amountWrapper]}>
                <View style={styles.currencyPrefix}>
                  <Text style={styles.currencyPrefixText}>Rp</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  placeholder="0"
                  placeholderTextColor={colors.textLight}
                  value={amountDisplay}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                  maxLength={15}
                />
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Kategori</Text>
              <View style={styles.categoryContainer}>
                {CATEGORIES.map((category) => {
                  const isSelected = selectedCategory === category;
                  const bgColor = colors.categoryBg[category] || colors.primaryLight;
                  const textColor = colors.categoryText[category] || colors.primaryDark;

                  return (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryPill,
                        isSelected
                          ? { backgroundColor: bgColor, borderColor: textColor, borderWidth: 2 }
                          : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1.5 },
                      ]}
                      onPress={() => setSelectedCategory(category)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryPillText,
                          isSelected
                            ? { color: textColor, fontWeight: FONT_WEIGHT.semibold }
                            : { color: colors.textSecondary },
                        ]}
                      >
                        {category}
                      </Text>
                      {isSelected && (
                        <View style={[styles.checkDot, { backgroundColor: textColor }]}>
                          <Text style={styles.checkMark}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
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
              style={[
                styles.saveButton,
                (!isValid || isSaving) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={!isValid || isSaving}
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
    maxHeight: '85%',
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xxl : SPACING.lg,
    ...SHADOW.lg,
  },
  header: {
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  title: {
    fontSize: fs.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: fs.sm,
    color: colors.textSecondary,
  },
  formScroll: {
    marginBottom: SPACING.md,
  },
  formContent: {
    paddingVertical: SPACING.sm,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
    marginBottom: SPACING.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  optionalBadge: {
    fontSize: fs.xs,
    color: colors.textLight,
    backgroundColor: colors.borderLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  inputWrapper: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...SHADOW.sm,
  },
  input: {
    fontSize: fs.md,
    color: colors.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    minHeight: 48,
  },
  textArea: {
    minHeight: 80,
    paddingTop: SPACING.sm,
  },
  amountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
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
  amountInput: {
    flex: 1,
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  categoryPillText: {
    fontSize: fs.xs + 1,
    fontWeight: FONT_WEIGHT.medium,
  },
  checkDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: FONT_WEIGHT.bold,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
