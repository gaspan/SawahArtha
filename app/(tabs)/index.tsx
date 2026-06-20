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
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSeason } from '../../src/context/SeasonContext';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useIncome } from '../../src/hooks/useIncome';
import { getZakatSummary } from '../../src/utils/zakat';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../../src/constants/theme';

import SeasonPicker from '../../src/components/SeasonPicker';
import NewSeasonModal from '../../src/components/NewSeasonModal';
import SummaryCards from '../../src/components/SummaryCards';
import DonutChart from '../../src/components/DonutChart';
import CategoryBarChart from '../../src/components/CategoryBarChart';

export default function DashboardScreen() {
  const { selectedSeason, seasons, switchSeason, createNewSeason } = useSeason();
  const { totalExpenses, categoryTotals, refreshExpenses } = useExpenses();
  const { totalRevenue, totalGKG, avgPricePerKg, refreshIncome } = useIncome();

  const [showNewSeasonModal, setShowNewSeasonModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const zakatSummary = getZakatSummary(totalGKG, avgPricePerKg);

  // Refresh data when tab is focused
  useFocusEffect(
    useCallback(() => {
      refreshExpenses();
      refreshIncome();
    }, [refreshExpenses, refreshIncome])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshExpenses(), refreshIncome()]);
    setRefreshing(false);
  }, [refreshExpenses, refreshIncome]);

  const handleNewSeason = async (seasonCode: string) => {
    try {
      await createNewSeason(seasonCode);
      setShowNewSeasonModal(false);
    } catch (error) {
      // Error handled in context
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

        {/* Summary Cards */}
        <SummaryCards
          totalExpenses={totalExpenses}
          totalRevenue={totalRevenue}
          zakatKg={zakatSummary.zakatKg}
          zakatRp={zakatSummary.zakatRp}
        />

        {/* Donut Chart - Expenses vs Revenue */}
        <DonutChart
          totalExpenses={totalExpenses}
          totalRevenue={totalRevenue}
        />

        {/* Category Bar Chart */}
        <CategoryBarChart categoryTotals={categoryTotals} />

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
});
