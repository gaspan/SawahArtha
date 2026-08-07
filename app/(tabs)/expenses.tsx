/**
 * Expenses Screen - SawahArtha
 * Expense input form and expense list with category tracking
 */
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
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useBudget } from '../../src/context/BudgetContext';
import { formatIDR } from '../../src/utils/currency';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOW, CATEGORIES } from '../../src/constants/theme';
import { type Expense } from '../../src/database/expenseService';

import ExpenseForm from '../../src/components/ExpenseForm';
import ExpenseList from '../../src/components/ExpenseList';
import EditExpenseModal from '../../src/components/EditExpenseModal';
import MarkPaidModal from '../../src/components/MarkPaidModal';

const LOAD_MORE_THRESHOLD = 120;

export default function ExpensesScreen() {
  const {
    expenses,
    totalExpenses,
    totalCount,
    hasMore,
    isLoading,
    isLoadingMore,
    unpaidAmount,
    addExpense,
    updateExpense,
    deleteExpense,
    markPaid,
    refreshExpenses,
    loadMoreExpenses,
  } = useExpenses();
  const { budgetVsActual, overBudgetCount, refreshBudgets } = useBudget();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshExpenses();
      refreshBudgets();
    }, [refreshExpenses, refreshBudgets])
  );

  const handleSelectCategory = useCallback(
    (category: string | null) => {
      setFilterCategory(category);
      refreshExpenses(category);
    },
    [refreshExpenses]
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      if (
        !isLoading &&
        !isLoadingMore &&
        hasMore &&
        layoutMeasurement.height + contentOffset.y >= contentSize.height - LOAD_MORE_THRESHOLD
      ) {
        loadMoreExpenses();
      }
    },
    [isLoading, isLoadingMore, hasMore, loadMoreExpenses]
  );

  const handleAddExpense = async (data: {
    title: string;
    description: string;
    amount: number;
    category: string;
    is_paid: number;
    vendor_name: string;
  }) => {
    try {
      await addExpense(data);
      Alert.alert('Berhasil ✅', 'Pengeluaran berhasil disimpan!');
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan pengeluaran.');
    }
  };

  const handleMarkPaid = async (id: number, paymentDate: string) => {
    try {
      await markPaid(id, paymentDate);
    } catch (error) {
      Alert.alert('Error', 'Gagal menandai lunas.');
    }
  };

  const handleSaveEdit = async (
    id: number,
    data: {
      title: string;
      description: string;
      amount: number;
      category: string;
    }
  ) => {
    try {
      await updateExpense(id, data);
      Alert.alert('Berhasil ✅', 'Pengeluaran berhasil diperbarui!');
    } catch (error) {
      Alert.alert('Error', 'Gagal memperbarui pengeluaran.');
    }
  };

  const handleDelete = (id: number) => {
    deleteExpense(id);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>💰</Text>
        <View>
          <Text style={styles.headerTitle}>Pengeluaran</Text>
          <Text style={styles.headerSubtitle}>Catat modal & biaya operasional</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        {/* Total Banner */}
        <View style={styles.totalBanner}>
          <Text style={styles.totalLabel}>Total Pengeluaran Musim Ini</Text>
          <Text style={styles.totalValue}>{formatIDR(totalExpenses)}</Text>
        </View>

        {overBudgetCount > 0 && (
          <View style={styles.budgetWarning}>
            <Text style={styles.budgetWarningText}>
              {overBudgetCount} kategori lewat anggaran
            </Text>
          </View>
        )}

        {unpaidAmount > 0 && (
          <View style={styles.unpaidSummary}>
            <Text style={styles.unpaidLabel}>Hutang Belum Dibayar</Text>
            <Text style={styles.unpaidValue}>{formatIDR(unpaidAmount)}</Text>
            <Text style={styles.unpaidHint}>
              {expenses.filter((e) => !e.is_paid).length} transaksi
            </Text>
          </View>
        )}

        {/* Expense Form */}
        <ExpenseForm onSubmit={handleAddExpense} />

        {/* Expense List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>
            Riwayat Pengeluaran ({totalCount})
          </Text>

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterCategory === null && styles.filterChipActive,
              ]}
              onPress={() => handleSelectCategory(null)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterCategory === null && styles.filterChipTextActive,
                ]}
              >
                Semua
              </Text>
            </TouchableOpacity>
            {CATEGORIES.map((category) => {
              const isActive = filterCategory === category;
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => handleSelectCategory(category)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Memuat riwayat...</Text>
            </View>
          ) : (
            <ExpenseList
              expenses={expenses}
              onEdit={setEditingExpense}
              onDelete={handleDelete}
              onMarkPaid={(id) => setMarkingPaidId(id)}
            />
          )}

          {!isLoading && (isLoadingMore || hasMore) && (
            <View style={styles.listFooter}>
              {isLoadingMore ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.footerText}>Geser ke bawah untuk memuat lebih banyak</Text>
              )}
            </View>
          )}
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Edit Expense Modal */}
      <EditExpenseModal
        visible={editingExpense !== null}
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSave={handleSaveEdit}
      />

      <MarkPaidModal
        visible={markingPaidId !== null}
        recordId={markingPaidId}
        onConfirm={async (id, paymentDate) => {
          await handleMarkPaid(id, paymentDate);
        }}
        onClose={() => setMarkingPaidId(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.danger,
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
    color: 'rgba(255,255,255,0.8)',
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
    backgroundColor: COLORS.dangerLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  totalLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.danger,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.xs,
  },
  totalValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.danger,
  },
  budgetWarning: {
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  budgetWarningText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.danger,
  },
  unpaidSummary: {
    backgroundColor: COLORS.warningLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md + 4,
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  unpaidLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.warning,
    marginBottom: SPACING.xs,
  },
  unpaidValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.warning,
  },
  unpaidHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
  filterRow: {
    gap: SPACING.sm,
    paddingRight: SPACING.md,
    marginBottom: SPACING.md,
  },
  filterChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  filterChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.textInverse,
    fontWeight: FONT_WEIGHT.semibold,
  },
  listFooter: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  footerText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
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
