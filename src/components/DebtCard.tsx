import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { formatIDR } from '../utils/currency';
import { computeTotalWithInterest, isOverdue } from '../database/debtService';
import type { Debt } from '../database/debtService';

interface Props {
  debt: Debt;
  onPayment: (debt: Debt) => void;
  onDelete: (id: number) => void;
}

export default function DebtCard({ debt, onPayment, onDelete }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const totalOwed = computeTotalWithInterest(debt.amount, debt.interest_rate, debt.date);
  const progressPct = debt.amount > 0 ? (debt.paid_amount / debt.amount) * 100 : 0;
  const safePct = Math.min(progressPct, 100);
  const remaining = debt.amount - debt.paid_amount;
  const isLoan = debt.type === 'loan_in';
  const isOver = isOverdue(debt.due_date);

  const handleDelete = () => {
    Alert.alert(
      'Hapus Pinjaman',
      `Hapus "${debt.counterparty}"? Data cicilan juga akan terhapus.`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => onDelete(debt.id) },
      ],
    );
  };

  return (
    <View style={[styles.card, isLoan ? styles.loanCard : styles.outCard]}>
      <View style={styles.headerRow}>
        <View style={styles.typeRow}>
          <View style={[styles.typeBadge, isLoan ? styles.typeLoan : styles.typeOut]}>
            <Text style={styles.typeText}>
              {isLoan ? '💳 Pinjaman' : '📤 Piutang'}
            </Text>
          </View>
          {debt.is_settled ? (
            <View style={styles.settledBadge}>
              <Text style={styles.settledText}>Lunas</Text>
            </View>
          ) : isOver ? (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueText}>Jatuh Tempo</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteBtnText}>Hapus</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.name}>{debt.counterparty}</Text>

      <View style={styles.amountRow}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Pokok</Text>
          <Text style={styles.amountValue}>{formatIDR(debt.amount)}</Text>
        </View>
        {debt.interest_rate > 0 && (
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Bunga {debt.interest_rate}%/th</Text>
            <Text style={styles.amountValueSecondary}>
              +{formatIDR(totalOwed - debt.amount)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>
            Dibayar: {formatIDR(debt.paid_amount)}
          </Text>
          <Text style={styles.progressPct}>
            {safePct.toLocaleString('id-ID', { maximumFractionDigits: 0 })}%
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${safePct}%`,
                backgroundColor: isLoan ? colors.primary : colors.info,
              },
            ]}
          />
        </View>
        <Text style={styles.remainingText}>
          {remaining > 0
            ? `Sisa: ${formatIDR(remaining)}`
            : 'Lunas'}
        </Text>
      </View>

      {debt.due_date && (
        <Text style={styles.dueDate}>
          Jatuh Tempo: {new Date(debt.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      )}

      {debt.note ? (
        <Text style={styles.note}>{debt.note}</Text>
      ) : null}

      {!debt.is_settled && (
        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => onPayment(debt)}
          activeOpacity={0.7}
        >
          <Text style={styles.payBtnText}>
            {isLoan ? 'Bayar Cicilan' : 'Catat Penerimaan'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md + 4,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.md,
    ...SHADOW.sm,
  },
  loanCard: {
    borderLeftColor: colors.danger,
  },
  outCard: {
    borderLeftColor: colors.info,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  typeLoan: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  typeOut: {
    backgroundColor: colors.infoLight,
    borderWidth: 1,
    borderColor: colors.info,
  },
  typeText: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
  },
  settledBadge: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
  },
  settledText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.success,
  },
  overdueBadge: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
  },
  overdueText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.danger,
  },
  deleteBtn: {
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
  },
  deleteBtnText: {
    fontSize: fs.xs,
    color: colors.textLight,
  },
  name: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
    marginBottom: SPACING.sm,
  },
  amountRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  amountBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  amountLabel: {
    fontSize: fs.xs - 1,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
  },
  amountValueSecondary: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.amberDark,
  },
  progressSection: {
    marginBottom: SPACING.xs,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  progressLabel: {
    fontSize: fs.xs,
    color: colors.textSecondary,
  },
  progressPct: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: 2,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  remainingText: {
    fontSize: fs.xs,
    color: colors.textLight,
  },
  dueDate: {
    fontSize: fs.xs,
    color: colors.textSecondary,
    marginTop: SPACING.xs,
  },
  note: {
    fontSize: fs.xs,
    color: colors.textLight,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  payBtn: {
    backgroundColor: colors.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  payBtnText: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textInverse,
  },
});
