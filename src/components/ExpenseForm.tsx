import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
  CATEGORIES,
} from '../constants/theme';
import { formatCurrencyInput } from '../utils/currency';

interface ExpenseFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    amount: number;
    category: string;
  }) => void;
}

export default function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [amountValue, setAmountValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const isValid = title.trim().length > 0 && amountValue > 0 && selectedCategory !== null;

  const handleAmountChange = useCallback((text: string) => {
    const { display, value } = formatCurrencyInput(text);
    setAmountDisplay(display);
    setAmountValue(value);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!isValid || !selectedCategory) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      amount: amountValue,
      category: selectedCategory,
    });

    // Clear all fields
    setTitle('');
    setDescription('');
    setAmountDisplay('');
    setAmountValue(0);
    setSelectedCategory(null);

    Alert.alert(
      '✅ Berhasil!',
      'Pengeluaran berhasil disimpan.',
      [{ text: 'OK', style: 'default' }],
    );
  }, [isValid, title, description, amountValue, selectedCategory, onSubmit]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🌾</Text>
          <Text style={styles.headerTitle}>Catat Pengeluaran</Text>
          <Text style={styles.headerSubtitle}>
            Tambahkan biaya operasional sawah Anda
          </Text>
        </View>

        {/* Title Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Judul Pengeluaran</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="e.g., Beli Pupuk Urea"
              placeholderTextColor={COLORS.textLight}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              returnKeyType="next"
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
              placeholderTextColor={COLORS.textLight}
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
              placeholderTextColor={COLORS.textLight}
              value={amountDisplay}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              maxLength={15}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Kategori</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category;
              const bgColor = COLORS.categoryBg[category] || COLORS.primaryLight;
              const textColor = COLORS.categoryText[category] || COLORS.primaryDark;

              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryPill,
                    isSelected
                      ? { backgroundColor: bgColor, borderColor: textColor, borderWidth: 2 }
                      : { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1.5 },
                  ]}
                  onPress={() => setSelectedCategory(category)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isSelected
                        ? { color: textColor, fontWeight: FONT_WEIGHT.semibold }
                        : { color: COLORS.textSecondary },
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

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>💾 Simpan Pengeluaran</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerIcon: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },

  // Fields
  fieldGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  optionalBadge: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  inputWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  input: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 50,
  },
  textArea: {
    minHeight: 90,
    paddingTop: SPACING.md,
  },

  // Amount
  amountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: BORDER_RADIUS.md - 1,
    borderBottomLeftRadius: BORDER_RADIUS.md - 1,
    alignSelf: 'stretch',
    minWidth: 50,
  },
  currencyPrefixText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  amountInput: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: 0.5,
  },

  // Category
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  categoryPillText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  checkDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: COLORS.textInverse,
    fontSize: 11,
    fontWeight: FONT_WEIGHT.bold,
  },

  // Submit
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 2,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    ...SHADOW.md,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.primaryMuted,
    opacity: 0.6,
    ...SHADOW.sm,
  },
  submitButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textInverse,
    letterSpacing: 0.3,
  },
});
