/**
 * Dashboard Screen - SawahArtha
 * Shows season picker, financial summary, KPI metrics, and charts
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useSeason } from '../../src/context/SeasonContext';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useIncome } from '../../src/hooks/useIncome';
import { useSeasonMetrics } from '../../src/hooks/useSeasonMetrics';
import { getZakatSummary } from '../../src/utils/zakat';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../../src/constants/theme';
import { formatIDR } from '../../src/utils/currency';
import * as DocumentPicker from 'expo-document-picker';
import { convertToCSV, exportToCSVFile, importFromCSV } from '../../src/utils/csv';

import SeasonPicker from '../../src/components/SeasonPicker';
import NewSeasonModal from '../../src/components/NewSeasonModal';
import SummaryCards from '../../src/components/SummaryCards';
import ProfitWaterfallCard from '../../src/components/ProfitWaterfallCard';
import BreakEvenCard from '../../src/components/BreakEvenCard';
import KpiMetrics from '../../src/components/KpiMetrics';
import UnsoldGrainCard from '../../src/components/UnsoldGrainCard';
import PriceSimulatorCard from '../../src/components/PriceSimulatorCard';
import SeasonComparisonChart from '../../src/components/SeasonComparisonChart';
import DonutChart from '../../src/components/DonutChart';
import CategoryBarChart from '../../src/components/CategoryBarChart';
import QuickFeed, { type FeedTransaction } from '../../src/components/QuickFeed';

function formatDisplayPath(path: string): string {
  if (!path) return '';
  if (path.startsWith('content://')) {
    try {
      const decoded = decodeURIComponent(path);
      const parts = decoded.split('/');
      const fileName = parts[parts.length - 1] || 'SawahArtha_Backup.csv';
      if (decoded.includes('Download')) {
        return `Penyimpanan Internal > Download > ${fileName}`;
      }
      if (decoded.includes('Documents')) {
        return `Penyimpanan Internal > Documents > ${fileName}`;
      }
      const primaryMatch = decoded.match(/primary:([^/]+)/);
      if (primaryMatch) {
        return `Penyimpanan Internal > ${primaryMatch[1]} > ${fileName}`;
      }
      return `Penyimpanan Internal > ${fileName}`;
    } catch (e) {
      return path;
    }
  }
  if (path.startsWith('file://')) {
    const parts = path.split('/');
    const fileName = parts[parts.length - 1] || 'SawahArtha_Backup.csv';
    return `Documents (Files App) > SawahArtha > ${fileName}`;
  }
  return path;
}

export default function DashboardScreen() {
  const db = useSQLiteContext();
  const { selectedSeason, seasons, switchSeason, createNewSeason, updateLandSize, updateRefPrice, refreshSeasons } = useSeason();
  const { expenses, totalExpenses, categoryTotals, refreshExpenses, isLoading: expensesLoading } = useExpenses();
  const {
    incomeRecords,
    totalRevenue,
    totalGKG,
    totalGKP,
    avgPricePerKg,
    unsoldGKG,
    totalRevenueSold,
    gacongValueRp,
    refreshIncome,
    isLoading: incomeLoading,
  } = useIncome();
  const { metrics: seasonMetrics, refreshMetrics } = useSeasonMetrics();
  const isDataLoading = expensesLoading || incomeLoading;

  const [showNewSeasonModal, setShowNewSeasonModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastExportPath, setLastExportPath] = useState<string>('');

  useEffect(() => {
    const loadLastExportPath = async () => {
      try {
        const pathFile = `${FileSystem.documentDirectory}last_export_path.txt`;
        const info = await FileSystem.getInfoAsync(pathFile);
        if (info.exists) {
          const savedPath = await FileSystem.readAsStringAsync(pathFile);
          setLastExportPath(savedPath);
        }
      } catch (err) {
        // ignore
      }
    };
    loadLastExportPath();
  }, []);

  const currentSeasonObj = seasons.find((s) => s.season_code === selectedSeason);
  const landSizeM2 = currentSeasonObj?.land_size_m2 ?? 1400;
  const refPrice = currentSeasonObj?.ref_price_per_kg ?? avgPricePerKg;
  const totalRevenueEstimate = totalRevenueSold + (unsoldGKG * (refPrice || 0));
  const zakatSummary = getZakatSummary(totalGKG, avgPricePerKg);

  const hpp = totalGKG > 0 ? totalExpenses / totalGKG : 0;

  const handleExportCSV = async () => {
    try {
      const allExpenses = await db.getAllAsync('SELECT * FROM expenses ORDER BY date DESC, id DESC');
      const allIncome = await db.getAllAsync('SELECT * FROM income ORDER BY date DESC, id DESC');
      const csvStr = convertToCSV(allExpenses, allIncome);
      const filePath = await exportToCSVFile(csvStr);

      const pathFile = `${FileSystem.documentDirectory}last_export_path.txt`;
      await FileSystem.writeAsStringAsync(pathFile, filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      setLastExportPath(filePath);

      Alert.alert(
        'Ekspor Berhasil ✅',
        `File backup CSV berhasil disimpan ke:\n\n${formatDisplayPath(filePath)}`
      );
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error ❌', 'Gagal memuat data dari database untuk ekspor.');
    }
  };

  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/comma-separated-values', 'text/csv', 'application/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileAsset = result.assets[0];

      Alert.alert(
        'Konfirmasi Impor 📥',
        `Apakah Anda yakin ingin mengimpor data dari "${fileAsset.name}"?\n\nData lama tidak akan terhapus, dan data duplikat akan diabaikan secara otomatis.`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Impor',
            onPress: async () => {
              try {
                const { expensesAdded, incomesAdded } = await importFromCSV(db, fileAsset.uri);
                await Promise.all([
                  refreshExpenses(),
                  refreshIncome(),
                  refreshSeasons(),
                ]);

                Alert.alert(
                  'Impor Berhasil ✅',
                  `Berhasil mengimpor data:\n• ${expensesAdded} catatan Pengeluaran baru\n• ${incomesAdded} catatan Hasil Panen baru.`
                );
              } catch (err: any) {
                console.error('Import processing error:', err);
                Alert.alert('Gagal Impor ❌', err.message || 'Terjadi kesalahan saat memproses data CSV.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Pick document error:', error);
      Alert.alert('Gagal Membuka File ❌', 'Tidak dapat membuka file manager.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshExpenses();
      refreshIncome();
      refreshMetrics();
    }, [refreshExpenses, refreshIncome, refreshMetrics])
  );

  const combinedTransactions: FeedTransaction[] = useMemo(() => {
    const list: FeedTransaction[] = [
      ...expenses.map((e) => ({
        id: `expense-${e.id}`,
        type: 'expense' as const,
        title: e.title,
        amount: e.amount,
        date: e.date,
        categoryOrMeta: e.category,
      })),
      ...incomeRecords.map((i) => ({
        id: `income-${i.id}`,
        type: 'income' as const,
        title: `Hasil Panen Gabah (GKP)`,
        amount: i.total_revenue,
        date: i.date,
        categoryOrMeta: `${i.gkp_weight.toLocaleString('id-ID')} kg`,
      })),
    ];
    return list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  }, [expenses, incomeRecords]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshExpenses(), refreshIncome(), refreshMetrics()]);
    setRefreshing(false);
  }, [refreshExpenses, refreshIncome]);

  const handleNewSeason = async (seasonCode: string, landSizeM2: number) => {
    try {
      await createNewSeason(seasonCode, landSizeM2);
      setShowNewSeasonModal(false);
    } catch (error) {
      // Error handled in context
    }
  };

  const handleUpdateLandSize = async (size: number) => {
    try {
      await updateLandSize(selectedSeason, size);
    } catch (error) {
      console.error('Error updating land size:', error);
      throw error;
    }
  };

  const handleUpdateRefPrice = async (price: number) => {
    try {
      await updateRefPrice(selectedSeason, price);
    } catch (error) {
      console.error('Error updating ref price:', error);
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>🌾</Text>
          <View>
            <Text style={styles.headerTitle}>SawahArtha</Text>
            <Text style={styles.headerSubtitle}>Manajemen Permodalan & Hasil Tani</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <SeasonPicker
          selectedSeason={selectedSeason}
          seasons={seasons}
          onSelectSeason={switchSeason}
          onNewSeason={() => setShowNewSeasonModal(true)}
        />

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExportCSV}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>📤 Ekspor Data (CSV)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleImportCSV}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>📥 Impor Data (CSV)</Text>
          </TouchableOpacity>
        </View>

        {lastExportPath ? (
          <View style={styles.pathCard}>
            <Text style={styles.pathLabel}>💾 File Ekspor Terakhir:</Text>
            <Text style={styles.pathText} selectable>
              {formatDisplayPath(lastExportPath)}
            </Text>
          </View>
        ) : null}

        {isDataLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Memuat data musim...</Text>
          </View>
        ) : (
          <>
            {/* Zona Keuangan Utama */}
            <ProfitWaterfallCard
              totalRevenue={totalRevenueEstimate}
              zakatRp={zakatSummary.zakatRp}
              gacongValueRp={gacongValueRp}
              totalExpenses={totalExpenses}
            />

            <BreakEvenCard
              totalExpenses={totalExpenses}
              totalRevenue={totalRevenueEstimate}
              totalGKG={totalGKG}
              avgOrRefPrice={refPrice || avgPricePerKg}
            />

            {/* Summary Cards (Net Zakat) */}
            <SummaryCards
              totalExpenses={totalExpenses}
              totalRevenue={totalRevenueEstimate}
              zakatRp={zakatSummary.zakatRp}
            />

            {/* KPI Metrics */}
            <KpiMetrics
              totalExpenses={totalExpenses}
              totalRevenue={totalRevenueEstimate}
              totalGKG={totalGKG}
              totalGKP={totalGKP}
              zakatRp={zakatSummary.zakatRp}
              landSizeM2={landSizeM2}
              onUpdateLandSize={handleUpdateLandSize}
            />

            {/* Zona Stok & Proyeksi */}
            {unsoldGKG > 0 && (
              <>
                <UnsoldGrainCard
                  unsoldKgGKG={unsoldGKG}
                  refPricePerKg={refPrice || 0}
                  onUpdateRefPrice={handleUpdateRefPrice}
                  totalExpenses={totalExpenses}
                  totalRevenueSold={totalRevenueSold}
                  totalRevenueEstimate={totalRevenueEstimate}
                  zakatRp={zakatSummary.zakatRp}
                />

                <PriceSimulatorCard
                  unsoldKgGKG={unsoldGKG}
                  totalExpenses={totalExpenses}
                  totalRevenueSold={totalRevenueSold}
                  zakatRp={zakatSummary.zakatRp}
                  minPrice={hpp}
                  maxPrice={hpp * 2}
                />
              </>
            )}

            {/* Zona Visualisasi */}
            <SeasonComparisonChart
              metrics={seasonMetrics}
              currentSeasonCode={selectedSeason}
            />

            <DonutChart
              totalExpenses={totalExpenses}
              totalRevenue={totalRevenueEstimate}
              zakatRp={zakatSummary.zakatRp}
            />

            <CategoryBarChart categoryTotals={categoryTotals} totalGKG={totalGKG} />

            <QuickFeed transactions={combinedTransactions} />
          </>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      <NewSeasonModal
        visible={showNewSeasonModal}
        onClose={() => setShowNewSeasonModal(false)}
        onSave={handleNewSeason}
      />
    </View>
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
    ...SHADOW.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerEmoji: {
    fontSize: 36,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
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
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.infoLight,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    ...SHADOW.sm,
  },
  actionButtonText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.info,
  },
  loadingContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  pathCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.borderLight,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm + 2,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  pathLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  pathText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: COLORS.textLight,
  },
});
