import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useDebts } from '../../src/hooks/useDebts';
import { formatIDR } from '../../src/utils/currency';
import { SPACING, BORDER_RADIUS, FONT_WEIGHT, SHADOW, type ThemeColors } from '../../src/constants/theme';
import { useTheme, useThemedStyles } from '../../src/context/ThemeContext';
import type { Debt } from '../../src/database/debtService';

import DebtCard from '../../src/components/DebtCard';
import AddDebtModal from '../../src/components/AddDebtModal';
import DebtPaymentModal from '../../src/components/DebtPaymentModal';

type FilterType = 'all' | 'loan_in' | 'loan_out';

export default function DebtsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const {
    debts,
    totalLoanIn,
    totalLoanOut,
    overdueCount,
    isLoading,
    addDebt,
    addPayment,
    deleteDebt,
    refreshDebts,
  } = useDebts();

  const [showAdd, setShowAdd] = useState(false);
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  useFocusEffect(
    useCallback(() => {
      refreshDebts();
    }, [refreshDebts]),
  );

  const filtered = filter === 'all'
    ? debts
    : debts.filter((d) => d.type === filter);

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
        <Text style={styles.headerEmoji}>💳</Text>
        <View>
          <Text style={styles.headerTitle}>Hutang & Piutang</Text>
          <Text style={styles.headerSubtitle}>Pinjaman, cicilan & piutang usaha</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryRow}>
          <View style={[styles.summaryBox, { backgroundColor: colors.dangerLight }]}>
            <Text style={styles.summaryLabel}>Pinjaman Masuk</Text>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>
              {formatIDR(totalLoanIn)}
            </Text>
          </View>
          <View style={[styles.summaryBox, { backgroundColor: colors.infoLight }]}>
            <Text style={styles.summaryLabel}>Piutang Keluar</Text>
            <Text style={[styles.summaryValue, { color: colors.info }]}>
              {formatIDR(totalLoanOut)}
            </Text>
          </View>
        </View>

        {overdueCount > 0 && (
          <View style={styles.overdueBanner}>
            <Text style={styles.overdueBannerText}>
              ⚠️ {overdueCount} pinjaman jatuh tempo
            </Text>
          </View>
        )}

        <View style={styles.filterRow}>
          {(['all', 'loan_in', 'loan_out'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f === 'all' ? 'Semua' : f === 'loan_in' ? 'Pinjaman' : 'Piutang'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Belum ada data</Text>
            <Text style={styles.emptySubtitle}>
              Tambahkan pinjaman atau piutang untuk melacak arus kas
            </Text>
          </View>
        ) : (
          filtered.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onPayment={setPaymentDebt}
              onDelete={deleteDebt}
            />
          ))
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAdd(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddDebtModal
        visible={showAdd}
        onSave={async (data) => {
          await addDebt({
            type: data.type,
            counterparty: data.counterparty,
            amount: data.amount,
            interest_rate: data.interest_rate,
            due_date: data.due_date || undefined,
            note: data.note || undefined,
          });
        }}
        onClose={() => setShowAdd(false)}
      />

      <DebtPaymentModal
        visible={paymentDebt !== null}
        debt={paymentDebt}
        onSave={addPayment}
        onClose={() => setPaymentDebt(null)}
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
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  summaryBox: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: colors.textSecondary,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: fs.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  overdueBanner: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  overdueBannerText: {
    fontSize: fs.xs + 1,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.danger,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  filterChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: fs.xs + 1,
    fontWeight: FONT_WEIGHT.medium,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textInverse,
    fontWeight: FONT_WEIGHT.semibold,
  },
  loadingContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: fs.sm,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: fs.sm,
    color: colors.textLight,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.lg + 8,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.lg,
  },
  fabText: {
    fontSize: 28,
    color: colors.textInverse,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: 30,
  },
});
