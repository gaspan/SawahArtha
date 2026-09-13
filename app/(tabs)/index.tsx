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
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { LinearGradient } from 'expo-linear-gradient';
import { useSeason } from '../../src/context/SeasonContext';
import { useBudget } from '../../src/context/BudgetContext';
import { useNotificationSync } from '../../src/hooks/useNotifications';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useIncome } from '../../src/hooks/useIncome';
import { useSales } from '../../src/hooks/useSales';
import { useSeasonMetrics } from '../../src/hooks/useSeasonMetrics';
import { getZakatSummary } from '../../src/utils/zakat';
import { SPACING, BORDER_RADIUS, FONT_WEIGHT, SHADOW, type ThemeColors } from '../../src/constants/theme';
import { formatIDR } from '../../src/utils/currency';
import { useTheme, useThemedStyles } from '../../src/context/ThemeContext';

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
import BudgetCard from '../../src/components/BudgetCard';
import BudgetEditModal from '../../src/components/BudgetEditModal';
import BudgetLogModal from '../../src/components/BudgetLogModal';
import CashPositionCard from '../../src/components/CashPositionCard';
import { useDebts } from '../../src/hooks/useDebts';
import PlotCard from '../../src/components/PlotCard';
import PlotModal from '../../src/components/PlotModal';
import { usePlots } from '../../src/hooks/usePlots';
import type { Plot } from '../../src/database/plotService';
import WeatherWidget from '../../src/components/WeatherWidget';
import WeatherAlertCard, { type WeatherAlertItem } from '../../src/components/WeatherAlertCard';
import { evaluateWeatherAlerts } from '../../src/utils/weatherAlerts';
import { syncWeatherAlerts } from '../../src/database/weatherAlertService';
import type { WeatherData } from '../../src/services/weatherService';

export default function DashboardScreen() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  useNotificationSync();
  const { selectedSeason, seasons, switchSeason, createNewSeason, updateLandSize, updateRefPrice, refreshSeasons } = useSeason();
  const { expenses, totalExpenses, categoryTotals, unpaidAmount, refreshExpenses, isLoading: expensesLoading } = useExpenses();
  const {
    incomeRecords,
    totalGKG,
    totalGKP,
    totalGacongWeight,
    refreshIncome,
    isLoading: incomeLoading,
  } = useIncome();
  const {
    sales,
    totalRevenue,
    totalGKGSold,
    avgPricePerKg,
    unpaidRevenue,
    refreshSales,
    isLoading: salesLoading,
  } = useSales();
  const { metrics: seasonMetrics, refreshMetrics } = useSeasonMetrics();
  const {
    budgetVsActual,
    totalBudget,
    overBudgetCount,
    budgetLogs,
    setBudget,
    deleteBudget,
    refreshBudgets,
  } = useBudget();
  const { totalLoanIn, totalLoanOut, refreshDebts } = useDebts();
  const isDataLoading = expensesLoading || incomeLoading || salesLoading;

  const [showNewSeasonModal, setShowNewSeasonModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingBudgetCategory, setEditingBudgetCategory] = useState<string | null>(null);
  const [showBudgetLog, setShowBudgetLog] = useState(false);

  const currentSeasonObj = seasons.find((s) => s.season_code === selectedSeason);
  const landSizeM2 = currentSeasonObj?.land_size_m2 ?? 1400;
  const refPrice = currentSeasonObj?.ref_price_per_kg ?? avgPricePerKg;
  const unsoldGKG = Math.max(0, totalGKG - totalGKGSold);
  const totalRevenueEstimate = totalRevenue + (unsoldGKG * (refPrice || 0));
  const zakatSummary = getZakatSummary(totalGKG, avgPricePerKg);
  const gacongValueRp = totalGacongWeight * avgPricePerKg;

  const totalRevenuePaid = totalRevenue - unpaidRevenue;
  const totalExpensesPaid = totalExpenses - unpaidAmount;
  const hpp = totalGKG > 0 ? totalExpenses / totalGKG : 0;

  const { plots, addPlot, updatePlot, deletePlot, refreshPlots } = usePlots();
  const [plotModalVisible, setPlotModalVisible] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlertItem[]>([]);

  const weatherCoords = useMemo(() => {
    const plotWithLoc = plots.find((p) => p.latitude != null && p.longitude != null);
    if (plotWithLoc && plotWithLoc.latitude != null && plotWithLoc.longitude != null) {
      return { latitude: plotWithLoc.latitude, longitude: plotWithLoc.longitude };
    }
    return { latitude: -7.5, longitude: 110.0 };
  }, [plots]);

  const handleWeatherLoaded = useCallback(
    async (data: WeatherData) => {
      try {
        const calculated = evaluateWeatherAlerts(data.current, data.forecast);
        if (calculated.length > 0) {
          await syncWeatherAlerts(db, selectedSeason, calculated);
        }
        setWeatherAlerts(calculated);
      } catch (err) {
        console.error('Error handling weather alerts:', err);
      }
    },
    [db, selectedSeason]
  );

  const handleDismissAlert = useCallback((index: number) => {
    setWeatherAlerts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshExpenses();
      refreshIncome();
      refreshSales();
      refreshMetrics();
      refreshBudgets();
      refreshDebts();
      refreshPlots();
    }, [refreshExpenses, refreshIncome, refreshSales, refreshMetrics, refreshBudgets, refreshDebts, refreshPlots])
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
      ...sales.map((s) => ({
        id: `sale-${s.id}`,
        type: 'income' as const,
        title: 'Hasil Penjualan Gabah',
        amount: s.total_revenue,
        date: s.date,
        categoryOrMeta: `${s.gkg_sold.toLocaleString('id-ID')} kg`,
      })),
    ];
    return list.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  }, [expenses, sales]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshExpenses(), refreshIncome(), refreshSales(), refreshMetrics(), refreshBudgets(), refreshDebts()]);
    setRefreshing(false);
  }, [refreshExpenses, refreshIncome, refreshSales, refreshMetrics, refreshBudgets, refreshDebts]);

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
      <LinearGradient
        colors={['#065F46', '#047857', '#0284C7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>🌾</Text>
          <View>
            <Text style={styles.headerTitle}>SawahArtha</Text>
            <Text style={styles.headerSubtitle}>Manajemen Permodalan & Hasil Tani</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push('/settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsBtnText}>⚙️</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <SeasonPicker
          selectedSeason={selectedSeason}
          seasons={seasons}
          onSelectSeason={switchSeason}
          onNewSeason={() => setShowNewSeasonModal(true)}
        />

        {/* Cuaca & Rekomendasi Pintar */}
        <WeatherWidget
          latitude={weatherCoords.latitude}
          longitude={weatherCoords.longitude}
          onWeatherLoaded={handleWeatherLoaded}
        />
        <WeatherAlertCard
          alerts={weatherAlerts}
          onDismiss={handleDismissAlert}
        />

        {isDataLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
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

            {/* Zona Anggaran */}
            {totalBudget > 0 && (
              <BudgetCard
                budgetVsActual={budgetVsActual}
                totalBudget={totalBudget}
                totalActual={totalExpenses}
                overBudgetCount={overBudgetCount}
                onEditBudget={(cat) => setEditingBudgetCategory(cat)}
                onOpenLog={() => setShowBudgetLog(true)}
              />
            )}

            {/* Summary Cards (Net Zakat) */}
            <SummaryCards
              totalExpenses={totalExpenses}
              totalRevenue={totalRevenueEstimate}
              zakatRp={zakatSummary.zakatRp}
            />

            {/* Cash Position */}
            <CashPositionCard
              totalRevenuePaid={totalRevenuePaid}
              totalRevenueUnpaid={unpaidRevenue}
              totalExpensesPaid={totalExpensesPaid}
              totalExpensesUnpaid={unpaidAmount}
              loanIn={totalLoanIn}
              loanOut={totalLoanOut}
              zakatRp={zakatSummary.zakatRp}
            />

            {/* Petak Lahan (multi-lahan) */}
            <PlotCard
              plots={plots}
              onAddPlot={() => { setEditingPlot(null); setPlotModalVisible(true); }}
              onEditPlot={(p) => { setEditingPlot(p); setPlotModalVisible(true); }}
              onDeletePlot={(p) => deletePlot(p.id)}
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
                  totalRevenueSold={totalRevenue}
                  totalRevenueEstimate={totalRevenueEstimate}
                  zakatRp={zakatSummary.zakatRp}
                />

                <PriceSimulatorCard
                  unsoldKgGKG={unsoldGKG}
                  totalExpenses={totalExpenses}
                  totalRevenueSold={totalRevenue}
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

      <BudgetEditModal
        visible={editingBudgetCategory !== null}
        category={editingBudgetCategory}
        currentAmount={
          budgetVsActual.find((b) => b.category === editingBudgetCategory)?.budgetAmount ?? 0
        }
        actualSpent={
          budgetVsActual.find((b) => b.category === editingBudgetCategory)?.actualAmount ?? 0
        }
        onSave={async (amount) => {
          if (editingBudgetCategory) await setBudget(editingBudgetCategory, amount);
        }}
        onDelete={async () => {
          if (editingBudgetCategory) await deleteBudget(editingBudgetCategory);
        }}
        onClose={() => setEditingBudgetCategory(null)}
      />

      <BudgetLogModal
        visible={showBudgetLog}
        logs={budgetLogs}
        onClose={() => setShowBudgetLog(false)}
      />

      <PlotModal
        visible={plotModalVisible}
        plot={editingPlot}
        onSave={async (input) => {
          if (editingPlot) {
            await updatePlot(editingPlot.id, input);
          } else {
            await addPlot(input);
          }
        }}
        onDelete={editingPlot ? async () => deletePlot(editingPlot.id) : undefined}
        onClose={() => setPlotModalVisible(false)}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../../src/constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
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
    fontSize: fs.xxl,
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
    paddingTop: SPACING.lg,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnText: {
    fontSize: 20,
  },
  loadingContainer: {
    paddingVertical: SPACING.xxl,
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
