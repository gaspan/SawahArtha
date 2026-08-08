import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
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
import { formatCurrencyInput } from '../utils/currency';
import { usePlots } from '../hooks/usePlots';
import PlotPicker from './PlotPicker';

interface ExpenseFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    amount: number;
    category: string;
    is_paid: number;
    vendor_name: string;
    plot_id?: number | null;
  }) => void;
}

export default function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { plots } = usePlots();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [amountValue, setAmountValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [isPaid, setIsPaid] = useState(true);
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);

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
      is_paid: isPaid ? 1 : 0,
      vendor_name: vendorName.trim(),
      plot_id: selectedPlotId,
    });

    setTitle('');
    setDescription('');
    setAmountDisplay('');
    setAmountValue(0);
    setSelectedCategory(null);
    setVendorName('');
    setIsPaid(true);
    setSelectedPlotId(null);

    Alert.alert(
      '✅ Berhasil!',
      'Pengeluaran berhasil disimpan.',
      [{ text: 'OK', style: 'default' }],
    );
  }, [isValid, title, description, amountValue, selectedCategory, isPaid, vendorName, selectedPlotId, onSubmit]);

  return (
    <View style={styles.container}>
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

        {/* Vendor Name */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Nama Toko / Supplier</Text>
            <Text style={styles.optionalBadge}>opsional</Text>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="e.g., Toko Tani Makmur"
              placeholderTextColor={colors.textLight}
              value={vendorName}
              onChangeText={setVendorName}
              maxLength={100}
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

        {/* Payment Status */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Status Pembayaran</Text>
          <View style={styles.radioRow}>
            <TouchableOpacity
              style={[styles.radioOption, isPaid && styles.radioOptionActive]}
              onPress={() => setIsPaid(true)}
              activeOpacity={0.7}
            >
              <View style={styles.radioCircle}>
                {isPaid && <View style={styles.radioDot} />}
              </View>              <Text style={[styles.radioLabel, isPaid && styles.radioLabelActive]}>
                Sudah Dibayar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.radioOption, !isPaid && styles.radioOptionActive]}
              onPress={() => setIsPaid(false)}
              activeOpacity={0.7}
            >
              <View style={styles.radioCircle}>
                {!isPaid && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.radioLabel, !isPaid && styles.radioLabelActive]}>
                Belum Dibayar (Hutang)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plot (multi-lahan) */}
        <View style={styles.fieldGroup}>
          <PlotPicker plots={plots} selectedPlotId={selectedPlotId} onChange={setSelectedPlotId} />
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
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  container: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // Fields
  fieldGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
    marginBottom: SPACING.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
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
    fontSize: fs.lg,
    color: colors.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 56,
    fontWeight: FONT_WEIGHT.semibold,
  },
  textArea: {
    minHeight: 90,
    paddingTop: SPACING.md,
    fontWeight: FONT_WEIGHT.normal,
  },

  // Amount
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
    minWidth: 50,
  },
  currencyPrefixText: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primaryDark,
  },
  amountInput: {
    flex: 1,
    fontSize: fs.lg,
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
    fontSize: fs.sm,
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
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: FONT_WEIGHT.bold,
  },

  // Submit
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: SPACING.md + 2,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    ...SHADOW.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.primaryMuted,
    opacity: 0.6,
    ...SHADOW.sm,
  },
  submitButtonText: {
    fontSize: fs.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textInverse,
    letterSpacing: 0.3,
  },

  radioRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  radioOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  radioOptionActive: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
  },
  radioLabel: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: colors.textSecondary,
  },
  radioLabelActive: {
    color: colors.danger,
    fontWeight: FONT_WEIGHT.bold,
  },
});
