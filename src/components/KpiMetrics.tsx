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
  totalExpenses: number;
  totalRevenue: number;
  totalGKG: number;
  totalGKP: number;
  zakatRp: number;
  landSizeM2: number | null | undefined;
  onUpdateLandSize?: (size: number) => Promise<void>;
}

export default function KpiMetrics({
  totalExpenses,
  totalRevenue,
  totalGKG,
  totalGKP,
  zakatRp,
  landSizeM2,
  onUpdateLandSize,
}: Props) {
  const safeLandSize = landSizeM2 ?? 1400;
  const [isEditing, setIsEditing] = useState(false);
  const [landSizeInput, setLandSizeInput] = useState(safeLandSize.toString());

  useEffect(() => {
    setLandSizeInput(safeLandSize.toString());
    setIsEditing(false);
  }, [safeLandSize]);

  const handleSave = async () => {
    const parsed = parseFloat(landSizeInput);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert(
        'Input Tidak Valid ⚠️',
        'Harap masukkan luas lahan yang valid (lebih besar dari 0).'
      );
      return;
    }

    try {
      if (onUpdateLandSize) {
        await onUpdateLandSize(parsed);
      }
      setIsEditing(false);
    } catch (err) {
      Alert.alert(
        'Gagal ❌',
        'Gagal memperbarui luas lahan. Silakan coba lagi.'
      );
    }
  };

  const handleCancel = () => {
    setLandSizeInput(safeLandSize.toString());
    setIsEditing(false);
  };
  const netProfit = totalRevenue - zakatRp - totalExpenses;
  
  const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;
  
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  
  const hpp = totalGKG > 0 ? totalExpenses / totalGKG : 0;
  
  // 3. Land Productivity (Kuintal/Ha)
  // Formula: (Total GKP in kg / 100) / (Land Size in m² / 10000)
  const totalKuintal = totalGKP / 100;
  const totalHectares = safeLandSize / 10000;
  const productivity = totalHectares > 0 ? totalKuintal / totalHectares : 0;
  const productivityTon = productivity / 10;

  const expensePerHa = totalHectares > 0 ? totalExpenses / totalHectares : 0;
  const revenuePerHa = totalHectares > 0 ? totalRevenue / totalHectares : 0;
  const profitPerHa = totalHectares > 0 ? netProfit / totalHectares : 0;
  const isProfitPerHa = profitPerHa >= 0;

  const isPositive = roi >= 0;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📊 Analisis Bisnis & Produktivitas</Text>
      
      {/* Top row: ROI, Margin & HPP */}
      <View style={styles.topRow}>
        <View style={styles.metricBox}>
          <Text style={styles.label}>ROI (Return on Investment)</Text>
          <Text
            style={[
              styles.value,
              { color: isPositive ? COLORS.success : COLORS.danger },
            ]}
          >
            {isPositive ? '+' : ''}
            {roi.toLocaleString('id-ID', {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
            %
          </Text>
          <Text
            style={[
              styles.badge,
              {
                backgroundColor: isPositive
                  ? COLORS.successLight
                  : COLORS.dangerLight,
                color: isPositive ? COLORS.success : COLORS.danger,
              },
            ]}
          >
            {isPositive ? ' Untung' : ' Rugi'}
          </Text>
          <View style={styles.miniDivider} />
          <Text style={styles.subLabel}>Margin Laba</Text>
          <Text
            style={[
              styles.subValue,
              { color: isPositive ? COLORS.success : COLORS.danger },
            ]}
          >
            {isPositive ? '+' : ''}
            {margin.toLocaleString('id-ID', {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
            %
          </Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.metricBox}>
          <Text style={styles.label}>HPP (Modal / kg GKG)</Text>
          <Text style={[styles.value, styles.hppValue]}>
            {formatIDR(hpp)}
          </Text>
          <Text style={styles.subtext}>per kg GKG</Text>
          <Text style={styles.helperText}>Harga jual minimum balik modal</Text>
        </View>
      </View>

      {/* Horizontal Divider */}
      <View style={styles.horizontalDivider} />

      {/* Bottom section: Land Productivity */}
      <View style={styles.productivitySection}>
        <View style={styles.prodHeader}>
          <View style={styles.prodTitleRow}>
            <Text style={styles.prodIcon}>🚜</Text>
            <Text style={styles.prodTitle}>Produktivitas Lahan</Text>
          </View>
          
          {isEditing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={landSizeInput}
                onChangeText={(text) => setLandSizeInput(text.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                placeholder="Luas"
                autoFocus
                selectTextOnFocus
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>✓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>✗</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.landSizeBadgeButton}
              onPress={() => {
                setLandSizeInput(safeLandSize.toString());
                setIsEditing(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.landSizeBadgeText}>
                Luas: {safeLandSize.toLocaleString('id-ID')} m² ✏️
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.prodBody}>
          <Text style={styles.prodValue}>
            {productivity.toLocaleString('id-ID', {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}{' '}
            <Text style={styles.prodUnit}>Kuintal/Ha</Text>
            <Text style={styles.prodSecondaryValue}>
              {'  '}({productivityTon.toLocaleString('id-ID', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              Ton/Ha)
            </Text>
          </Text>
          <Text style={styles.prodSubtext}>
            Hasil: {totalKuintal.toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ku ({totalGKP.toLocaleString('id-ID')} kg) GKP
          </Text>
        </View>

        <View style={styles.perHaDivider} />

        <View style={styles.perHaSection}>
          <Text style={styles.perHaTitle}>Per Hektar</Text>
          <View style={styles.perHaRow}>
            <View style={styles.perHaBox}>
              <Text style={styles.perHaLabel}>Modal</Text>
              <Text style={styles.perHaValue} numberOfLines={1} adjustsFontSizeToFit>{formatIDR(expensePerHa)}</Text>
            </View>
            <View style={styles.perHaBox}>
              <Text style={styles.perHaLabel}>Pendapatan</Text>
              <Text style={styles.perHaValue} numberOfLines={1} adjustsFontSizeToFit>{formatIDR(revenuePerHa)}</Text>
            </View>
            <View style={styles.perHaBox}>
              <Text style={styles.perHaLabel}>Laba</Text>
              <Text style={[styles.perHaValue, { color: isProfitPerHa ? COLORS.success : COLORS.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                {isProfitPerHa ? '+' : ''}{formatIDR(profitPerHa)}
              </Text>
            </View>
          </View>
        </View>
      </View>
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
    ...SHADOW.md,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1.5,
    height: '75%',
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACING.xs,
  },
  horizontalDivider: {
    height: 1.5,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  value: {
    fontSize: FONT_SIZE.lg + 2,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: 4,
  },
  hppValue: {
    color: COLORS.text,
  },
  badge: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.bold,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  subtext: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  helperText: {
    fontSize: 9,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  miniDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    width: '60%',
    marginVertical: 6,
    alignSelf: 'center',
  },
  subLabel: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  subValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },

  // Productivity
  productivitySection: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  prodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  prodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  prodIcon: {
    fontSize: FONT_SIZE.md,
  },
  prodTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  landSizeBadge: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  landSizeBadgeButton: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryMuted,
  },
  landSizeBadgeText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    color: COLORS.text,
    minWidth: 75,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.textInverse,
    fontSize: 12,
    fontWeight: FONT_WEIGHT.bold,
  },
  cancelButton: {
    backgroundColor: COLORS.danger,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textInverse,
    fontSize: 12,
    fontWeight: FONT_WEIGHT.bold,
  },
  prodBody: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  prodValue: {
    fontSize: FONT_SIZE.xl + 2,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
    marginBottom: 2,
  },
  prodUnit: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  prodSecondaryValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryDark,
  },
  prodSubtext: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  perHaDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  perHaSection: {
    paddingTop: SPACING.xs,
  },
  perHaTitle: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  perHaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  perHaBox: {
    flex: 1,
    alignItems: 'center',
  },
  perHaLabel: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  perHaValue: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
});
