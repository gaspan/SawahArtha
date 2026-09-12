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
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import {
  calculateGKG,
  calculateGacongWeight,
  calculateNetGKP,
  isZakatWajib,
  calculateZakatKg,
  resolveGKG,
  GACONG_BERAT,
  GACONG_PEMBAGIAN,
  getNisabGKG,
  type GacongType,
} from '../utils/zakat';
import { usePlots } from '../hooks/usePlots';
import PlotPicker from './PlotPicker';

interface IncomeFormProps {
  onSubmit: (data: {
    gkp_weight: number;
    gkg_weight: number;
    gacong_type: string;
    gacong_input: number;
    gacong_weight: number;
    net_gkp: number;
    plot_id?: number | null;
  }) => void;
}

export default function IncomeForm({ onSubmit }: IncomeFormProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { plots } = usePlots();

  const [gkpInput, setGkpInput] = useState('');
  const [gacongType, setGacongType] = useState<GacongType>(GACONG_BERAT);
  const [gacongInput, setGacongInput] = useState('');
  const [gkgInput, setGkgInput] = useState('');
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);

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

  const estimatedGKG = useMemo(() => calculateGKG(netGKP), [netGKP]);

  const { value: effectiveGKG, isEstimated: gkgIsEstimated } = useMemo(
    () => resolveGKG(estimatedGKG, gkgInput),
    [estimatedGKG, gkgInput],
  );

  const zakatWajib = useMemo(() => isZakatWajib(effectiveGKG), [effectiveGKG]);
  const zakatKg = useMemo(() => calculateZakatKg(effectiveGKG), [effectiveGKG]);

  const isValid = gkpWeight > 0 && netGKP > 0;

  const handleGkpChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
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

  const handleGkgChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    setGkgInput(cleaned);
  }, []);

  const handleResetGKG = useCallback(() => {
    setGkgInput('');
  }, []);

  const handleSubmit = useCallback(() => {
    if (!isValid) return;

    onSubmit({
      gkp_weight: gkpWeight,
      gkg_weight: effectiveGKG,
      gacong_type: gacongType,
      gacong_input: gacongValue,
      gacong_weight: gacongWeight,
      net_gkp: netGKP,
      plot_id: selectedPlotId,
    });

    setGkpInput('');
    setGacongInput('');
    setGkgInput('');
    setSelectedPlotId(null);

    Alert.alert(
      '✅ Berhasil!',
      'Data panen berhasil disimpan.',
      [{ text: 'OK', style: 'default' }],
    );
  }, [isValid, gkpWeight, effectiveGKG, gacongType, gacongValue, gacongWeight, netGKP, selectedPlotId, onSubmit]);

  return (
    <View style={styles.container}>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Berat Gabah Kering Panen (GKP)</Text>
        <View style={[styles.inputWrapper, styles.unitWrapper]}>
          <TextInput
            style={[styles.input, styles.unitInput]}
            placeholder="0"
            placeholderTextColor={colors.textLight}
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

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Biaya Gacong (Upah Panen)</Text>
        <View style={styles.radioRow}>
          <TouchableOpacity
            style={[styles.radioOption, gacongType === GACONG_BERAT && styles.radioOptionActive]}
            onPress={() => handleGacongTypeChange(GACONG_BERAT)}
            activeOpacity={0.7}
          >
            <View style={styles.radioCircle}>
              {gacongType === GACONG_BERAT && <View style={styles.radioDot} />}
            </View>
            <Text style={[styles.radioLabel, gacongType === GACONG_BERAT && styles.radioLabelActive]}>
              Berat (kg)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioOption, gacongType === GACONG_PEMBAGIAN && styles.radioOptionActive]}
            onPress={() => handleGacongTypeChange(GACONG_PEMBAGIAN)}
            activeOpacity={0.7}
          >
            <View style={styles.radioCircle}>
              {gacongType === GACONG_PEMBAGIAN && <View style={styles.radioDot} />}
            </View>
            <Text style={[styles.radioLabel, gacongType === GACONG_PEMBAGIAN && styles.radioLabelActive]}>
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
            placeholderTextColor={colors.textLight}
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

      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Berat GKG (Gabah Kering Giling)</Text>
          {!gkgIsEstimated && (
            <View style={styles.actualBadge}>
              <Text style={styles.actualBadgeText}>berat riil</Text>
            </View>
          )}
        </View>
        <View style={[styles.inputWrapper, styles.unitWrapper]}>
          <TextInput
            style={[styles.input, styles.unitInput]}
            placeholder="0"
            placeholderTextColor={colors.textLight}
            value={gkgInput}
            onChangeText={handleGkgChange}
            keyboardType="decimal-pad"
            maxLength={10}
            returnKeyType="done"
          />
          <View style={styles.unitSuffix}>
            <Text style={styles.unitSuffixText}>kg</Text>
          </View>
          {!gkgIsEstimated && (
            <TouchableOpacity
              style={styles.resetGkgBtn}
              onPress={handleResetGKG}
              activeOpacity={0.7}
            >
              <Text style={styles.resetGkgBtnText}>↺</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.gkgHint}>
          Estimasi otomatis: {estimatedGKG.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
          {gkgIsEstimated
            ? ' — isi berat asli jika berbeda dari timbangan'
            : ' — berat asli tersimpan'}
        </Text>
      </View>

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
              <Text style={styles.summaryLabel}>
                {gkgIsEstimated ? 'Estimasi GKG' : 'GKG (Berat Riil)'}
              </Text>
              <Text style={styles.summaryValueBold}>
                {effectiveGKG.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
                {gkgIsEstimated && (
                  <Text style={styles.summaryFormula}> × 0.8</Text>
                )}
              </Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />
          <View style={styles.summaryBody}>
            {zakatWajib ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>☪️ Zakat (5%)</Text>
                <Text style={styles.summaryValueBold}>
                  {zakatKg.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
                </Text>
              </View>
            ) : (
              <Text style={styles.nisabSummaryText}>
                ℹ️ Belum mencapai nisab ({getNisabGKG().toLocaleString('id-ID', { maximumFractionDigits: 0 })} kg). Sisa{' '}
                {(getNisabGKG() - effectiveGKG).toLocaleString('id-ID', { maximumFractionDigits: 1 })}{' '}
                kg lagi.
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.fieldGroup}>
        <PlotPicker plots={plots} selectedPlotId={selectedPlotId} onChange={setSelectedPlotId} />
      </View>

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

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  container: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  fieldGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
    marginBottom: SPACING.sm,
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
  },
  unitWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitInput: {
    flex: 1,
    fontWeight: FONT_WEIGHT.semibold,
  },
  unitSuffix: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: BORDER_RADIUS.md - 1,
    borderBottomRightRadius: BORDER_RADIUS.md - 1,
    alignSelf: 'stretch',
    minWidth: 48,
  },
  unitSuffixText: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primaryDark,
  },
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
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  radioOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: colors.textSecondary,
  },
  radioLabelActive: {
    color: colors.primaryDark,
    fontWeight: FONT_WEIGHT.bold,
  },
  fractionPrefix: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: BORDER_RADIUS.md - 1,
    borderBottomLeftRadius: BORDER_RADIUS.md - 1,
    alignSelf: 'stretch',
    minWidth: 44,
  },
  fractionPrefixText: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primaryDark,
  },
  gacongHint: {
    fontSize: fs.xs,
    color: colors.textLight,
    marginTop: SPACING.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
  },
  actualBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actualBadgeText: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primaryDark,
  },
  resetGkgBtn: {
    backgroundColor: colors.secondaryLight,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
    width: 36,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  resetGkgBtnText: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.amberDark,
  },
  gkgHint: {
    fontSize: fs.xs,
    color: colors.textLight,
    marginTop: SPACING.xs,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
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
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 1,
  },
  summaryLabel: {
    fontSize: fs.sm,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
  },
  summaryValueNegative: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.danger,
  },
  summaryValueBold: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primaryDark,
  },
  summaryFormula: {
    fontSize: fs.xs,
    color: colors.textLight,
    fontWeight: FONT_WEIGHT.medium,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  nisabSummaryText: {
    fontSize: fs.sm,
    color: colors.info,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: SPACING.md + 4,
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
});
