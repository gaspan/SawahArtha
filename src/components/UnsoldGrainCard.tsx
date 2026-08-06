import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
} from '../constants/theme';
import { formatIDR } from '../utils/currency';

interface Props {
  unsoldKgGKG: number;
  refPricePerKg: number;
  onUpdateRefPrice: (price: number) => Promise<void>;
  totalExpenses: number;
  totalRevenueSold: number;
  totalRevenueEstimate: number;
  zakatRp: number;
}

export default function UnsoldGrainCard({
  unsoldKgGKG,
  refPricePerKg,
  onUpdateRefPrice,
  totalExpenses,
  totalRevenueSold,
  totalRevenueEstimate,
  zakatRp,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [priceInput, setPriceInput] = useState(
    refPricePerKg > 0 ? refPricePerKg.toString() : ''
  );

  useEffect(() => {
    if (!isEditing) {
      setPriceInput(refPricePerKg > 0 ? refPricePerKg.toString() : '');
    }
  }, [refPricePerKg, isEditing]);

  const handleSave = async () => {
    const parsed = Number(priceInput.replace(/[^0-9]/g, ''));
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Input Tidak Valid', 'Harap masukkan harga yang valid per kg.');
      return;
    }
    try {
      await onUpdateRefPrice(parsed);
      setIsEditing(false);
    } catch {
      Alert.alert('Gagal', 'Gagal menyimpan harga acuan.');
    }
  };

  const handleCancel = () => {
    setPriceInput(refPricePerKg > 0 ? refPricePerKg.toString() : '');
    setIsEditing(false);
  };

  const estimatedValue = unsoldKgGKG * refPricePerKg;
  const projectedNet = totalRevenueEstimate - zakatRp - totalExpenses;
  const isProjectedProfit = projectedNet >= 0;

  if (unsoldKgGKG === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Gabah Belum Terjual</Text>

      <View style={styles.stockRow}>
        <View style={styles.stockBox}>
          <Text style={styles.stockValue}>
            {unsoldKgGKG.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
          </Text>
          <Text style={styles.stockLabel}>kg GKG tersedia</Text>
        </View>
      </View>

      <View style={styles.priceSection}>
        <Text style={styles.sectionLabel}>Harga Acuan</Text>
        {isEditing ? (
          <View style={styles.editRow}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>Rp</Text>
              <TextInput
                style={styles.editInput}
                value={priceInput}
                onChangeText={(t) => setPriceInput(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="6000"
                autoFocus
                selectTextOnFocus
              />
              <Text style={styles.inputSuffix}>/kg</Text>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
              <Text style={styles.saveBtnText}>Simpan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>✗</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.priceBadge}
            onPress={() => setIsEditing(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.priceBadgeText}>
              {refPricePerKg > 0 ? formatIDR(refPricePerKg) : 'Atur harga acuan ✏️'}
            </Text>
            <Text style={styles.priceBadgeUnit}>/kg</Text>
          </TouchableOpacity>
        )}
      </View>

      {refPricePerKg > 0 && (
        <>
          <View style={styles.divider} />

          <View style={styles.estRow}>
            <Text style={styles.estLabel}>Estimasi Nilai Stok</Text>
            <Text style={styles.estValue}>{formatIDR(estimatedValue)}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Proyeksi Laba Bersih</Text>
          <View style={styles.projFormula}>
            <Text style={styles.formulaText}>
              (Realisasi {formatIDR(totalRevenueSold)} + Estimasi {formatIDR(estimatedValue)})
              {'\n'}− Zakat {formatIDR(zakatRp)} − Modal {formatIDR(totalExpenses)}
            </Text>
          </View>
          <Text
            style={[
              styles.projValue,
              { color: isProjectedProfit ? COLORS.success : COLORS.danger },
            ]}
          >
            {isProjectedProfit ? '+' : ''}
            {formatIDR(projectedNet)}
          </Text>
          <Text style={styles.projHint}>
            Proyeksi jika semua terjual di {formatIDR(refPricePerKg)}/kg
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md + 4,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.warningLight,
    ...SHADOW.md,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  stockRow: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stockBox: {
    backgroundColor: COLORS.warningLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm + 2,
    alignItems: 'center',
    width: '100%',
  },
  stockValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.warning,
  },
  stockLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  priceSection: {
    marginBottom: SPACING.sm,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
  },
  inputPrefix: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  editInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    paddingVertical: SPACING.xs + 2,
    textAlign: 'center',
  },
  inputSuffix: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  saveBtn: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 4,
  },
  saveBtnText: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
  },
  cancelBtn: {
    backgroundColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 4,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryMuted,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
  },
  priceBadgeText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  priceBadgeUnit: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  estRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  estValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  projFormula: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  formulaText: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textSecondary,
    fontFamily: 'Courier',
    textAlign: 'center',
  },
  projValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
    marginBottom: 2,
  },
  projHint: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
