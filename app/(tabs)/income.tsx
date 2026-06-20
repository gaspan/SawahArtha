/**
 * Income Screen - SawahArtha
 * Harvest income input, list with edit price, and zakat calculator
 */
import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useIncome } from '../../src/hooks/useIncome';
import { formatIDR } from '../../src/utils/currency';
import { calculateGKG } from '../../src/utils/zakat';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../../src/constants/theme';

import IncomeForm from '../../src/components/IncomeForm';
import IncomeList from '../../src/components/IncomeList';
import ZakatSection from '../../src/components/ZakatSection';

export default function IncomeScreen() {
  const {
    incomeRecords,
    totalRevenue,
    totalGKG,
    avgPricePerKg,
    addIncome,
    updatePrice,
    deleteIncome,
    refreshIncome,
    isLoading,
  } = useIncome();

  useFocusEffect(
    useCallback(() => {
      refreshIncome();
    }, [refreshIncome])
  );

  const handleAddIncome = async (data: {
    gkp_weight: number;
    gkg_weight: number;
    price_per_kg: number;
    total_revenue: number;
  }) => {
    try {
      await addIncome(data);
      Alert.alert('Berhasil ✅', 'Data panen berhasil disimpan!');
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data panen.');
    }
  };

  const handleUpdatePrice = async (id: number, price: number) => {
    try {
      await updatePrice(id, price);
      Alert.alert('Berhasil ✅', 'Harga jual berhasil diperbarui!');
    } catch (error) {
      Alert.alert('Error', 'Gagal memperbarui harga.');
    }
  };

  const handleDelete = (id: number) => {
    deleteIncome(id);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🌾</Text>
        <View>
          <Text style={styles.headerTitle}>Penghasilan</Text>
          <Text style={styles.headerSubtitle}>Data panen & harga jual gabah</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Total Revenue Banner */}
        <View style={styles.totalBanner}>
          <Text style={styles.totalLabel}>Total Pendapatan Musim Ini</Text>
          <Text style={styles.totalValue}>{formatIDR(totalRevenue)}</Text>
        </View>

        {/* Income Form */}
        <IncomeForm onSubmit={handleAddIncome} />

        {/* Zakat Calculator */}
        <ZakatSection totalGKG={totalGKG} avgPricePerKg={avgPricePerKg} />

        {/* Income List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>
            Riwayat Panen ({incomeRecords.length})
          </Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Memuat riwayat...</Text>
            </View>
          ) : (
            <IncomeList
              records={incomeRecords}
              onUpdatePrice={handleUpdatePrice}
              onDelete={handleDelete}
            />
          )}
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    ...SHADOW.lg,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textInverse,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primaryMuted,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  totalBanner: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  totalLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.xs,
  },
  totalValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  listSection: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
});
