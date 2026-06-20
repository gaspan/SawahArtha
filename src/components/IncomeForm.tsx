import React, { useState, useCallback, useMemo } from 'react';
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
} from '../constants/theme';
import { formatCurrencyInput, formatIDR } from '../utils/currency';
import {
  calculateGKG,
  isZakatWajib,
  calculateZakatKg,
  calculateZakatRupiah,
  NISAB_KG,
} from '../utils/zakat';

interface IncomeFormProps {
  onSubmit: (data: {
    gkp_weight: number;
    gkg_weight: number;
    price_per_kg: number;
    total_revenue: number;
  }) => void;
}

export default function IncomeForm({ onSubmit }: IncomeFormProps) {
  const [gkpInput, setGkpInput] = useState('');
  const [priceDisplay, setPriceDisplay] = useState('');
  const [priceValue, setPriceValue] = useState(0);

  // Derived values
  const gkpWeight = useMemo(() => {
    const parsed = parseFloat(gkpInput);
    return isNaN(parsed) ? 0 : parsed;
  }, [gkpInput]);

  const gkgWeight = useMemo(() => calculateGKG(gkpWeight), [gkpWeight]);

  const totalRevenue = useMemo(
    () => (priceValue > 0 ? gkpWeight * priceValue : 0),
    [gkpWeight, priceValue],
  );

  const zakatWajib = useMemo(() => isZakatWajib(gkgWeight), [gkgWeight]);

  const zakatKg = useMemo(() => calculateZakatKg(gkgWeight), [gkgWeight]);

  const zakatRp = useMemo(
    () => calculateZakatRupiah(zakatKg, priceValue),
    [zakatKg, priceValue],
  );

  const isValid = gkpWeight > 0;

  const handlePriceChange = useCallback((text: string) => {
    const { display, value } = formatCurrencyInput(text);
    setPriceDisplay(display);
    setPriceValue(value);
  }, []);

  const handleGkpChange = useCallback((text: string) => {
    // Allow only digits and one decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    setGkpInput(cleaned);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!isValid) return;

    onSubmit({
      gkp_weight: gkpWeight,
      gkg_weight: gkgWeight,
      price_per_kg: priceValue,
      total_revenue: totalRevenue,
    });

    // Clear fields
    setGkpInput('');
    setPriceDisplay('');
    setPriceValue(0);

    Alert.alert(
      '✅ Berhasil!',
      'Data panen berhasil disimpan.',
      [{ text: 'OK', style: 'default' }],
    );
  }, [isValid, gkpWeight, gkgWeight, priceValue, totalRevenue, onSubmit]);

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
          <Text style={styles.headerTitle}>Data Panen</Text>
          <Text style={styles.headerSubtitle}>
            Catat hasil panen dan hitung pendapatan Anda
          </Text>
        </View>

        {/* GKP Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Berat Gabah Kering Panen (GKP)</Text>
          <View style={[styles.inputWrapper, styles.unitWrapper]}>
            <TextInput
              style={[styles.input, styles.unitInput]}
              placeholder="0"
              placeholderTextColor={COLORS.textLight}
              value={gkpInput}
              onChangeText={handleGkpChange}
              keyboardType="decimal-pad"
              maxLength={10}
              returnKeyType="done"
            />
            <View style={styles.unitSuffix}>
              <Text style={styles.unitSuffixText}>kg</Text>
            </View>
          </View>
        </View>

        {/* GKG Display */}
        {gkpWeight > 0 && (
          <View style={styles.gkgCard}>
            <View style={styles.gkgHeader}>
              <Text style={styles.gkgLabel}>📊 Gabah Kering Giling (GKG)</Text>
              <Text style={styles.gkgFormula}>GKP × 0.85</Text>
            </View>
            <Text style={styles.gkgValue}>
              {gkgWeight.toLocaleString('id-ID', {
                maximumFractionDigits: 1,
              })}{' '}
              <Text style={styles.gkgUnit}>kg</Text>
            </Text>
          </View>
        )}

        {/* Zakat Preview */}
        {gkpWeight > 0 && zakatWajib && (
          <View style={styles.zakatCard}>
            <View style={styles.zakatHeader}>
              <Text style={styles.zakatIcon}>☪️</Text>
              <Text style={styles.zakatTitle}>Zakat Pertanian Wajib</Text>
            </View>
            <Text style={styles.zakatDescription}>
              GKG Anda ({gkgWeight.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg)
              telah mencapai nisab ({NISAB_KG} kg)
            </Text>
            <View style={styles.zakatDetails}>
              <View style={styles.zakatRow}>
                <Text style={styles.zakatDetailLabel}>Zakat (5%)</Text>
                <Text style={styles.zakatDetailValue}>
                  {zakatKg.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
                </Text>
              </View>
              {priceValue > 0 && (
                <View style={styles.zakatRow}>
                  <Text style={styles.zakatDetailLabel}>Setara</Text>
                  <Text style={styles.zakatDetailValueRp}>
                    {formatIDR(zakatRp)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Nisab progress when below threshold */}
        {gkpWeight > 0 && !zakatWajib && (
          <View style={styles.nisabInfoCard}>
            <Text style={styles.nisabInfoText}>
              ℹ️ GKG belum mencapai nisab ({NISAB_KG} kg). Sisa{' '}
              {(NISAB_KG - gkgWeight).toLocaleString('id-ID', {
                maximumFractionDigits: 1,
              })}{' '}
              kg lagi.
            </Text>
          </View>
        )}

        {/* Price Per Kg Input */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Harga Jual per kg</Text>
            <Text style={styles.optionalBadge}>opsional - bisa diisi nanti</Text>
          </View>
          <View style={[styles.inputWrapper, styles.amountWrapper]}>
            <View style={styles.currencyPrefix}>
              <Text style={styles.currencyPrefixText}>Rp</Text>
            </View>
            <TextInput
              style={[styles.input, styles.amountInput]}
              placeholder="0"
              placeholderTextColor={COLORS.textLight}
              value={priceDisplay}
              onChangeText={handlePriceChange}
              keyboardType="numeric"
              maxLength={12}
              returnKeyType="done"
            />
            <View style={styles.perKgSuffix}>
              <Text style={styles.perKgText}>/kg</Text>
            </View>
          </View>
        </View>

        {/* Total Revenue Display */}
        {totalRevenue > 0 && (
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>💰 Total Pendapatan</Text>
            <Text style={styles.revenueValue}>{formatIDR(totalRevenue)}</Text>
            <Text style={styles.revenueFormula}>
              {gkpWeight.toLocaleString('id-ID')} kg × {formatIDR(priceValue)}/kg
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>🌾 Simpan Data Panen</Text>
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
    fontSize: 40,
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
    textAlign: 'center',
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
    flexWrap: 'wrap',
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
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 56,
  },

  // Unit suffix (kg)
  unitWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitInput: {
    flex: 1,
    fontWeight: FONT_WEIGHT.semibold,
  },
  unitSuffix: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: BORDER_RADIUS.md - 1,
    borderBottomRightRadius: BORDER_RADIUS.md - 1,
    alignSelf: 'stretch',
    minWidth: 48,
  },
  unitSuffixText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },

  // Amount with currency prefix
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
    fontWeight: FONT_WEIGHT.semibold,
  },
  perKgSuffix: {
    paddingHorizontal: SPACING.sm,
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  perKgText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHT.medium,
  },

  // GKG Display Card
  gkgCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primaryMuted,
  },
  gkgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  gkgLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryDark,
  },
  gkgFormula: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  gkgValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  gkgUnit: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary,
  },

  // Zakat Preview Card
  zakatCard: {
    backgroundColor: COLORS.secondaryLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  zakatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  zakatIcon: {
    fontSize: 20,
  },
  zakatTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: '#92400E',
  },
  zakatDescription: {
    fontSize: FONT_SIZE.sm,
    color: '#92400E',
    opacity: 0.8,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  zakatDetails: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  zakatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zakatDetailLabel: {
    fontSize: FONT_SIZE.sm,
    color: '#92400E',
    fontWeight: FONT_WEIGHT.medium,
  },
  zakatDetailValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: '#92400E',
  },
  zakatDetailValueRp: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.secondary,
  },

  // Nisab info
  nisabInfoCard: {
    backgroundColor: COLORS.infoLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  nisabInfoText: {
    fontSize: FONT_SIZE.sm,
    color: '#1E40AF',
    lineHeight: 20,
  },

  // Revenue Card
  revenueCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    ...SHADOW.md,
  },
  revenueLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  revenueValue: {
    fontSize: FONT_SIZE.hero,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  revenueFormula: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },

  // Submit
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 4,
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
