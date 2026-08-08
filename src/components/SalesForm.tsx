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
import { formatCurrencyInput, formatIDR } from '../utils/currency';
import { usePlots } from '../hooks/usePlots';
import PlotPicker from './PlotPicker';

interface Props {
  stockRemaining: number;
  onSubmit: (data: {
    gkg_sold: number;
    price_per_kg: number;
    total_revenue: number;
    is_paid: number;
    buyer_name: string;
    note: string;
    plot_id?: number | null;
  }) => void;
}

export default function SalesForm({ stockRemaining, onSubmit }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { plots } = usePlots();

  const [gkgInput, setGkgInput] = useState('');
  const [priceDisplay, setPriceDisplay] = useState('');
  const [priceValue, setPriceValue] = useState(0);
  const [buyerName, setBuyerName] = useState('');
  const [note, setNote] = useState('');
  const [isPaid, setIsPaid] = useState(true);
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);

  const gkgSold = parseFloat(gkgInput) || 0;
  const totalRevenue = gkgSold > 0 && priceValue > 0 ? gkgSold * priceValue : 0;
  const isValid = gkgSold > 0 && gkgSold <= stockRemaining && priceValue > 0;

  const handlePriceChange = useCallback((text: string) => {
    const { display, value } = formatCurrencyInput(text);
    setPriceDisplay(display);
    setPriceValue(value);
  }, []);

  const handleGkgChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    setGkgInput(cleaned);
  }, []);

  const handleFillAll = () => {
    setGkgInput(stockRemaining.toString());
  };

  const handleSubmit = () => {
    if (!isValid) return;

    if (gkgSold > stockRemaining) {
      Alert.alert('Stok Tidak Cukup', `Stok tersisa hanya ${stockRemaining.toLocaleString('id-ID')} kg GKG.`);
      return;
    }

    onSubmit({
      gkg_sold: gkgSold,
      price_per_kg: priceValue,
      total_revenue: totalRevenue,
      is_paid: isPaid ? 1 : 0,
      buyer_name: buyerName.trim(),
      note: note.trim(),
      plot_id: selectedPlotId,
    });

    setGkgInput('');
    setPriceDisplay('');
    setPriceValue(0);
    setBuyerName('');
    setNote('');
    setIsPaid(true);
    setSelectedPlotId(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stockHint}>
        Stok tersedia: {stockRemaining.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg GKG
      </Text>

      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Jumlah Gabah Terjual (GKG)</Text>
          <TouchableOpacity
            style={styles.fillAllBtn}
            onPress={handleFillAll}
            activeOpacity={0.7}
          >
            <Text style={styles.fillAllBtnText}>Semua</Text>
          </TouchableOpacity>
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
          />
          <View style={styles.unitSuffix}>
            <Text style={styles.unitSuffixText}>kg</Text>
          </View>
        </View>
        {gkgSold > stockRemaining && (
          <Text style={styles.errorText}>Melebihi stok tersedia</Text>
        )}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Harga Jual per kg</Text>
        <View style={[styles.inputWrapper, styles.amountWrapper]}>
          <View style={styles.currencyPrefix}>
            <Text style={styles.currencyPrefixText}>Rp</Text>
          </View>
          <TextInput
            style={[styles.input, styles.amountInput]}
            placeholder="0"
            placeholderTextColor={colors.textLight}
            value={priceDisplay}
            onChangeText={handlePriceChange}
            keyboardType="numeric"
            maxLength={12}
          />
          <View style={styles.perKgSuffix}>
            <Text style={styles.perKgText}>/kg</Text>
          </View>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Nama Pembeli</Text>
          <Text style={styles.optionalBadge}>opsional</Text>
        </View>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="e.g., Tengkulak Pak Budi"
            placeholderTextColor={colors.textLight}
            value={buyerName}
            onChangeText={setBuyerName}
            maxLength={100}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Catatan</Text>
          <Text style={styles.optionalBadge}>opsional</Text>
        </View>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Jual bertahap, kirim minggu depan"
            placeholderTextColor={colors.textLight}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={2}
            maxLength={200}
            textAlignVertical="top"
          />
        </View>
      </View>

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
            </View>
            <Text style={[styles.radioLabel, isPaid && styles.radioLabelActive]}>
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
              Belum Dibayar (Piutang)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {totalRevenue > 0 && (
        <View style={styles.revenuePreview}>
          <Text style={styles.revenuePreviewLabel}>Total: {formatIDR(totalRevenue)}</Text>
        </View>
      )}

      <PlotPicker plots={plots} selectedPlotId={selectedPlotId} onChange={setSelectedPlotId} />

      <TouchableOpacity
        style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!isValid}
        activeOpacity={0.8}
      >
        <Text style={styles.submitButtonText}>💾 Simpan Penjualan</Text>
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
  stockHint: {
    fontSize: fs.xs,
    color: colors.warning,
    fontWeight: FONT_WEIGHT.semibold,
    backgroundColor: colors.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  optionalBadge: {
    fontSize: fs.xs,
    color: colors.textLight,
    backgroundColor: colors.borderLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  fillAllBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  fillAllBtnText: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primaryDark,
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
  textArea: {
    minHeight: 70,
    paddingTop: SPACING.sm,
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
    fontWeight: FONT_WEIGHT.semibold,
  },
  perKgSuffix: {
    paddingHorizontal: SPACING.sm,
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  perKgText: {
    fontSize: fs.sm,
    color: colors.textLight,
    fontWeight: FONT_WEIGHT.medium,
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
  revenuePreview: {
    backgroundColor: colors.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  revenuePreviewLabel: {
    fontSize: fs.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primaryDark,
  },
  errorText: {
    fontSize: fs.xs,
    color: colors.danger,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: SPACING.md + 4,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.primaryMuted,
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: fs.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textInverse,
  },
});
