import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useIncome } from '../../src/hooks/useIncome';
import { useSales } from '../../src/hooks/useSales';
import { formatIDR } from '../../src/utils/currency';
import { getZakatSummary } from '../../src/utils/zakat';
import { SPACING, BORDER_RADIUS, FONT_WEIGHT, SHADOW, type ThemeColors } from '../../src/constants/theme';
import { useTheme, useThemedStyles } from '../../src/context/ThemeContext';

import IncomeForm from '../../src/components/IncomeForm';
import IncomeList from '../../src/components/IncomeList';
import StockCard from '../../src/components/StockCard';
import SalesForm from '../../src/components/SalesForm';
import SalesList from '../../src/components/SalesList';
import ZakatSection from '../../src/components/ZakatSection';
import MarkPaidModal from '../../src/components/MarkPaidModal';

type SubTab = 'panen' | 'jual';

export default function IncomeScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const {
    incomeRecords,
    totalGKG,
    totalGKP,
    totalGacongWeight,
    isLoading: incomeLoading,
    addIncome,
    deleteIncome,
    updateIncomeGKG,
    refreshIncome,
  } = useIncome();

  const {
    sales,
    totalRevenue,
    totalGKGSold,
    avgPricePerKg,
    unpaidRevenue,
    isLoading: salesLoading,
    addSale,
    updateSale,
    deleteSale,
    markPaid,
    refreshSales,
  } = useSales();

  const [subTab, setSubTab] = useState<SubTab>('panen');
  const [markingPaidId, setMarkingPaidId] = useState<number | null>(null);
  const isLoading = incomeLoading || salesLoading;

  const zakatSummary = getZakatSummary(totalGKG, avgPricePerKg);
  const netRevenue = totalRevenue - zakatSummary.zakatRp;
  const stockRemaining = Math.max(0, totalGKG - totalGKGSold);
  const gacongValueRp = totalGacongWeight * avgPricePerKg;

  useFocusEffect(
    useCallback(() => {
      refreshIncome();
      refreshSales();
    }, [refreshIncome, refreshSales]),
  );

  const handleAddIncome = async (data: {
    gkp_weight: number;
    gkg_weight: number;
    gacong_type: string;
    gacong_input: number;
    gacong_weight: number;
    net_gkp: number;
  }) => {
    try {
      await addIncome(data);
      Alert.alert('Berhasil ✅', 'Data panen berhasil disimpan!');
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data panen.');
    }
  };

  const handleAddSale = async (data: {
    gkg_sold: number;
    price_per_kg: number;
    total_revenue: number;
    is_paid: number;
    buyer_name: string;
    note: string;
  }) => {
    try {
      await addSale(data);
      Alert.alert('Berhasil ✅', 'Data penjualan berhasil disimpan!');
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data penjualan.');
    }
  };

  const handleUpdateSale = async (id: number, gkgSold: number, pricePerKg: number) => {
    try {
      await updateSale(id, gkgSold, pricePerKg);
    } catch (error) {
      Alert.alert('Error', 'Gagal memperbarui penjualan.');
    }
  };

  const handleDeleteSale = (id: number) => {
    deleteSale(id);
  };

  const handleMarkPaid = async (id: number, paymentDate: string) => {
    try {
      await markPaid(id, paymentDate);
    } catch (error) {
      Alert.alert('Error', 'Gagal menandai lunas.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#065F46', '#047857', '#0284C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerEmoji}>🌾</Text>
        <View>
          <Text style={styles.headerTitle}>Penghasilan</Text>
          <Text style={styles.headerSubtitle}>Data panen & penjualan gabah</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.totalBanner}>
          <Text style={styles.totalLabel}>Estimasi Total Pendapatan</Text>
          <Text style={styles.totalValue}>{formatIDR(netRevenue)}</Text>
          <Text style={styles.totalSubtext}>
            {totalGKG.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg GKG panen ∕ {totalGKGSold.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg terjual
          </Text>
          {zakatSummary.zakatRp > 0 && (
            <Text style={styles.totalSubtext}>sudah dikurangi zakat {formatIDR(zakatSummary.zakatRp)}</Text>
          )}
        </View>

        {unpaidRevenue > 0 && (
          <View style={styles.unpaidSummary}>
            <Text style={styles.unpaidLabel}>Piutang Belum Dibayar</Text>
            <Text style={styles.unpaidValue}>{formatIDR(unpaidRevenue)}</Text>
            <Text style={styles.unpaidHint}>
              {sales.filter((s) => !s.is_paid).length} transaksi
            </Text>
          </View>
        )}

        <StockCard totalGKG={totalGKG} totalGKPSold={totalGKGSold} />

        <View style={styles.subTabRow}>
          <TouchableOpacity
            style={[styles.subTab, subTab === 'panen' && styles.subTabActive]}
            onPress={() => setSubTab('panen')}
            activeOpacity={0.7}
          >
            <Text style={[styles.subTabText, subTab === 'panen' && styles.subTabTextActive]}>
              🌾 Panen ({incomeRecords.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subTab, subTab === 'jual' && styles.subTabActive]}
            onPress={() => setSubTab('jual')}
            activeOpacity={0.7}
          >
            <Text style={[styles.subTabText, subTab === 'jual' && styles.subTabTextActive]}>
              💰 Jual ({sales.length})
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        ) : subTab === 'panen' ? (
          <>
            <IncomeForm onSubmit={handleAddIncome} />
            <ZakatSection totalGKG={totalGKG} avgPricePerKg={avgPricePerKg} />
            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>Riwayat Panen ({incomeRecords.length})</Text>
              <IncomeList
                records={incomeRecords}
                totalGKGSold={totalGKGSold}
                onDelete={deleteIncome}
                onUpdateGKG={updateIncomeGKG}
              />
            </View>
          </>
        ) : (
          <>
            <SalesForm stockRemaining={stockRemaining} onSubmit={handleAddSale} />
            <ZakatSection totalGKG={totalGKG} avgPricePerKg={avgPricePerKg} />
            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>Riwayat Penjualan ({sales.length})</Text>
              <SalesList
                sales={sales}
                onUpdate={handleUpdateSale}
                onDelete={handleDeleteSale}
                onMarkPaid={(id) => setMarkingPaidId(id)}
              />
            </View>
          </>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      <MarkPaidModal
        visible={markingPaidId !== null}
        recordId={markingPaidId}
        onConfirm={handleMarkPaid}
        onClose={() => setMarkingPaidId(null)}
      />
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../../src/constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
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
    fontSize: fs.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textInverse,
  },
  headerSubtitle: {
    fontSize: fs.sm,
    color: colors.primaryMuted,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingTop: SPACING.sm,
  },
  totalBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  totalLabel: {
    fontSize: fs.sm,
    color: colors.primary,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.xs,
  },
  totalValue: {
    fontSize: fs.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primaryDark,
  },
  totalSubtext: {
    fontSize: fs.xs,
    color: colors.secondary,
    fontWeight: FONT_WEIGHT.medium,
    marginTop: SPACING.xs,
  },
  unpaidSummary: {
    backgroundColor: colors.warningLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md + 4,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  unpaidLabel: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.warning,
    marginBottom: SPACING.xs,
  },
  unpaidValue: {
    fontSize: fs.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.warning,
  },
  unpaidHint: {
    fontSize: fs.xs,
    color: colors.textSecondary,
    marginTop: SPACING.xs,
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    borderRadius: BORDER_RADIUS.md,
    padding: 3,
    marginBottom: SPACING.md,
  },
  subTab: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.sm + 2,
    alignItems: 'center',
  },
  subTabActive: {
    backgroundColor: colors.surface,
    ...SHADOW.sm,
  },
  subTabText: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: colors.textSecondary,
  },
  subTabTextActive: {
    color: colors.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  listSection: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: fs.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
    marginBottom: SPACING.md,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: fs.sm,
    color: colors.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
});
