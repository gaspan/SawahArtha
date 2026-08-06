import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
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
  calculateGacongWeight,
  calculateNetGKP,
  isZakatWajib,
  calculateZakatKg,
  calculateZakatRupiah,
  GACONG_BERAT,
  GACONG_PEMBAGIAN,
  type GacongType,
  NISAB_KG,
} from '../utils/zakat';

interface IncomeFormProps {
  onSubmit: (data: {
    gkp_weight: number;
    gkg_weight: number;
    gacong_type: string;
    gacong_input: number;
    gacong_weight: number;
    net_gkp: number;
    price_per_kg: number;
    total_revenue: number;
  }) => void;
}

export default function IncomeForm({ onSubmit }: IncomeFormProps) {
  const [gkpInput, setGkpInput] = useState('');
  const [gacongType, setGacongType] = useState<GacongType>(GACONG_BERAT);
  const [gacongInput, setGacongInput] = useState('');
  const [priceDisplay, setPriceDisplay] = useState('');
  const [priceValue, setPriceValue] = useState(0);

  // Derived values
  const gkpWeight = useMemo(() => {
    const parsed = parseFloat(gkpInput);
    return isNaN(parsed) ? 0 : parsed;
  }, [gkpInput]);

  const gacongValue = useMemo(() => {
    const parsed = parseFloat(gacongInput);
    return isNaN(parsed) ? 0 : parsed;
  }, [gacongInput]);

  const gacongWeight = useMemo(
    () => calculateGacongWeight(gkpWeight, gacongType, gacongValue),
    [gkpWeight, gacongType, gacongValue],
  );

  const netGKP = useMemo(
    () => calculateNetGKP(gkpWeight, gacongWeight),
    [gkpWeight, gacongWeight],
  );

  // GKG is calculated from net GKP (after gacong deduction)
  const gkgWeight = useMemo(() => calculateGKG(netGKP), [netGKP]);

  // Revenue is based on GKG sold at price per kg
  const totalRevenue = useMemo(
    () => (priceValue > 0 ? gkgWeight * priceValue : 0),
    [gkgWeight, priceValue],
  );

  const zakatWajib = useMemo(() => isZakatWajib(gkgWeight), [gkgWeight]);

  const zakatKg = useMemo(() => calculateZakatKg(gkgWeight), [gkgWeight]);

  const zakatRp = useMemo(
    () => calculateZakatRupiah(zakatKg, priceValue),
    [zakatKg, priceValue],
  );

  // Display-only: estimated revenue after zakat deduction
  const estimasiRevenue = useMemo(
    () => (priceValue > 0 && netGKP > 0 ? (gkgWeight - zakatKg) * priceValue : 0),
    [gkgWeight, zakatKg, priceValue, netGKP],
  );

  const isValid = gkpWeight > 0 && netGKP > 0;

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

  const handleGacongInputChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    setGacongInput(cleaned);
  }, []);

  const handleGacongTypeChange = useCallback((type: GacongType) => {
    setGacongType(type);
    setGacongInput('');
  }, []);

  const handleSubmit = useCallback(() => {
    if (!isValid) return;

    onSubmit({
      gkp_weight: gkpWeight,
      gkg_weight: gkgWeight,
      gacong_type: gacongType,
      gacong_input: gacongValue,
      gacong_weight: gacongWeight,
      net_gkp: netGKP,
      price_per_kg: priceValue,
      total_revenue: totalRevenue,
    });

    // Clear fields
    setGkpInput('');
    setGacongInput('');
    setPriceDisplay('');
    setPriceValue(0);

    Alert.alert(
      '✅ Berhasil!',
      'Data panen berhasil disimpan.',
      [{ text: 'OK', style: 'default' }],
    );
  }, [isValid, gkpWeight, gkgWeight, gacongType, gacongValue, gacongWeight, netGKP, priceValue, totalRevenue, onSubmit]);

  return (
    <View style={styles.container}>
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

        {/* Gacong (Harvest Fee) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Biaya Gacong (Upah Panen)</Text>
          <View style={styles.radioRow}>
            <TouchableOpacity
              style={[
                styles.radioOption,
                gacongType === GACONG_BERAT && styles.radioOptionActive,
              ]}
              onPress={() => handleGacongTypeChange(GACONG_BERAT)}
              activeOpacity={0.7}
            >
              <View style={styles.radioCircle}>
                {gacongType === GACONG_BERAT && <View style={styles.radioDot} />}
              </View>
              <Text
                style={[
                  styles.radioLabel,
                  gacongType === GACONG_BERAT && styles.radioLabelActive,
                ]}
              >
                Berat (kg)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioOption,
                gacongType === GACONG_PEMBAGIAN && styles.radioOptionActive,
              ]}
              onPress={() => handleGacongTypeChange(GACONG_PEMBAGIAN)}
              activeOpacity={0.7}
            >
              <View style={styles.radioCircle}>
                {gacongType === GACONG_PEMBAGIAN && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <Text
                style={[
                  styles.radioLabel,
                  gacongType === GACONG_PEMBAGIAN && styles.radioLabelActive,
                ]}
              >
                Pembagian (1/n)
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.inputWrapper, styles.unitWrapper]}>
            {gacongType === GACONG_PEMBAGIAN && (
              <View style={styles.fractionPrefix}>
                <Text style={styles.fractionPrefixText}>1/</Text>
              </View>
            )}
            <TextInput
              style={[styles.input, styles.unitInput]}
              placeholder="0"
              placeholderTextColor={COLORS.textLight}
              value={gacongInput}
              onChangeText={handleGacongInputChange}
              keyboardType="decimal-pad"
              maxLength={10}
              returnKeyType="done"
            />
            {gacongType === GACONG_BERAT && (
              <View style={styles.unitSuffix}>
                <Text style={styles.unitSuffixText}>kg</Text>
              </View>
            )}
          </View>
          {gacongType === GACONG_PEMBAGIAN && (
            <Text style={styles.gacongHint}>
              Contoh: isi 6 untuk biaya 1/6 dari hasil panen
            </Text>
          )}
        </View>

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

        {/* Summary Card */}
        {gkpWeight > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryBody}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>📊 Ringkasan Panen</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GKP Kotor</Text>
                <Text style={styles.summaryValue}>
                  {gkpWeight.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
                </Text>
              </View>

              {gacongWeight > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Gacong
                    {gacongType === GACONG_PEMBAGIAN
                      ? ` (1/${gacongValue.toLocaleString('id-ID', { maximumFractionDigits: 1 })})`
                      : ''}
                  </Text>
                  <Text style={styles.summaryValueNegative}>
                    − {gacongWeight.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
                  </Text>
                </View>
              )}

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Hasil Bersih</Text>
                <Text style={styles.summaryValueBold}>
                  {netGKP.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estimasi GKG</Text>
                <Text style={styles.summaryValueBold}>
                  {gkgWeight.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
                  <Text style={styles.summaryFormula}> × 0.8</Text>
                </Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />
            <View style={styles.summaryBody}>
              {zakatWajib ? (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>☪️ Zakat (5%)</Text>
                    <Text style={styles.summaryValueBold}>
                      {zakatKg.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
                    </Text>
                  </View>
                  {priceValue > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Setara</Text>
                      <Text style={styles.summaryValueGold}>{formatIDR(zakatRp)}</Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.nisabSummaryText}>
                  ℹ️ Belum mencapai nisab ({NISAB_KG} kg). Sisa{' '}
                  {(NISAB_KG - gkgWeight).toLocaleString('id-ID', { maximumFractionDigits: 1 })}{' '}
                  kg lagi.
                </Text>
              )}
            </View>

            {totalRevenue > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryBody}>
                  <Text style={styles.summarySectionTitle}>💰 Estimasi Pendapatan</Text>
                  <Text style={styles.revenueBigValue}>{formatIDR(estimasiRevenue)}</Text>
                  <Text style={styles.revenueFormulaText}>
                    {zakatKg > 0
                      ? `(${gkgWeight.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg − ${zakatKg.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg zakat) × ${formatIDR(priceValue)}/kg`
                      : `${gkgWeight.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg GKG × ${formatIDR(priceValue)}/kg`}
                  </Text>
                </View>
              </>
            )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
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

  // Radio buttons
  radioRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  radioOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  radioOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
  radioLabelActive: {
    color: COLORS.primaryDark,
    fontWeight: FONT_WEIGHT.bold,
  },
  fractionPrefix: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: BORDER_RADIUS.md - 1,
    borderBottomLeftRadius: BORDER_RADIUS.md - 1,
    alignSelf: 'stretch',
    minWidth: 44,
  },
  fractionPrefixText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  gacongHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  summaryBody: {
    padding: SPACING.md,
  },
  summaryHeader: {
    marginBottom: SPACING.sm,
  },
  summaryTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 1,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  summaryValueNegative: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.danger,
  },
  summaryValueBold: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  summaryValueGold: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.amberDark,
  },
  summaryFormula: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHT.medium,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  summarySectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  nisabSummaryText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.info,
    lineHeight: 20,
  },
  revenueBigValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
    marginVertical: SPACING.xs,
  },
  revenueFormulaText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
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
