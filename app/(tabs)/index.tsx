/**
 * Dashboard Screen - SawahArtha
 * Shows season picker, summary cards, and charts
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useSeason } from '../../src/context/SeasonContext';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useIncome } from '../../src/hooks/useIncome';
import { getZakatSummary } from '../../src/utils/zakat';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../../src/constants/theme';
import { convertToCSV, exportToCSVFile } from '../../src/utils/csv';

import SeasonPicker from '../../src/components/SeasonPicker';
import NewSeasonModal from '../../src/components/NewSeasonModal';
import SummaryCards from '../../src/components/SummaryCards';
import DonutChart from '../../src/components/DonutChart';
import CategoryBarChart from '../../src/components/CategoryBarChart';
import KpiMetrics from '../../src/components/KpiMetrics';
import QuickFeed, { type FeedTransaction } from '../../src/components/QuickFeed';

export default function DashboardScreen() {
  const db = useSQLiteContext();
  const { selectedSeason, seasons, switchSeason, createNewSeason, updateLandSize } = useSeason();
  const { expenses, totalExpenses, categoryTotals, refreshExpenses, isLoading: expensesLoading } = useExpenses();
  const { incomeRecords, totalRevenue, totalGKG, totalGKP, avgPricePerKg, refreshIncome, isLoading: incomeLoading } = useIncome();
  const isDataLoading = expensesLoading || incomeLoading;

  const [showNewSeasonModal, setShowNewSeasonModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Find land size of the currently selected season
  const currentSeasonObj = seasons.find((s) => s.season_code === selectedSeason);
  const landSizeM2 = currentSeasonObj?.land_size_m2 ?? 1400; // default to 1400 if not set

  const handleExportCSV = async () => {
    try {
      // Query ALL expenses and income records across all seasons
      const allExpenses = await db.getAllAsync('SELECT * FROM expenses ORDER BY date DESC, id DESC');
      const allIncome = await db.getAllAsync('SELECT * FROM income ORDER BY date DESC, id DESC');
      
      const csvStr = convertToCSV(allExpenses, allIncome);
      await exportToCSVFile(csvStr);
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error ❌', 'Gagal memuat data dari database untuk ekspor.');
    }
  };

  // Refresh data when tab is focused
  useFocusEffect(
    useCallback(() => {
      refreshExpenses();
      refreshIncome();
    }, [refreshExpenses, refreshIncome])
  );

  // Calculate combined latest 3 transactions for Quick Feed
  const combinedTransactions: FeedTransaction[] = React.useMemo(() => {
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

    // Sort by date (descending), then ID (descending)
    return list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  }, [expenses, incomeRecords]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshExpenses(), refreshIncome()]);
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

  return (
    <View style={styles.container}>
      {/* Header */}
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
        {/* Season Picker */}
        <SeasonPicker
          selectedSeason={selectedSeason}
          seasons={seasons}
          onSelectSeason={switchSeason}
          onNewSeason={() => setShowNewSeasonModal(true)}
        />

        {/* Backup Export Button */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportCSV}
            activeOpacity={0.7}
          >
            <Text style={styles.exportButtonText}>📤 Ekspor Backup Data (CSV)</Text>
          </TouchableOpacity>
        </View>

        {isDataLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Memuat data musim...</Text>
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <SummaryCards
              totalExpenses={totalExpenses}
              totalRevenue={totalRevenue}
            />

            {/* KPI Metrics */}
            <KpiMetrics
              totalExpenses={totalExpenses}
              totalRevenue={totalRevenue}
              totalGKP={totalGKP}
              landSizeM2={landSizeM2}
              onUpdateLandSize={handleUpdateLandSize}
            />

            {/* Donut Chart - Expenses vs Revenue */}
            <DonutChart
              totalExpenses={totalExpenses}
              totalRevenue={totalRevenue}
            />

            {/* Category Bar Chart */}
            <CategoryBarChart categoryTotals={categoryTotals} />

            {/* Quick Feed */}
            <QuickFeed transactions={combinedTransactions} />
          </>
        )}

        {/* Bottom spacing */}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* New Season Modal */}
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
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  exportButton: {
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
  exportButtonText: {
    fontSize: FONT_SIZE.sm,
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
});
