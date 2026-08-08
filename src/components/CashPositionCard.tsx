import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { formatIDR } from '../utils/currency';

interface Props {
  totalRevenuePaid: number;
  totalRevenueUnpaid: number;
  totalExpensesPaid: number;
  totalExpensesUnpaid: number;
  loanIn: number;
  loanOut: number;
  zakatRp: number;
}

export default function CashPositionCard({
  totalRevenuePaid,
  totalRevenueUnpaid,
  totalExpensesPaid,
  totalExpensesUnpaid,
  loanIn,
  loanOut,
  zakatRp,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const kasMasuk = totalRevenuePaid + loanIn;
  const kasKeluar = totalExpensesPaid + zakatRp;
  const kasBersih = kasMasuk - kasKeluar;
  const totalAsetAkrual = kasBersih + totalRevenueUnpaid - totalExpensesUnpaid + loanOut;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Posisi Kas Riil</Text>

      <View style={styles.section}>
        <Row label="Penjualan Lunas" value={totalRevenuePaid} positive />
        <Row label="Modal Dibayar" value={-totalExpensesPaid} positive={false} />
        <Row label="Zakat" value={-zakatRp} positive={false} />
        <Row label="Pinjaman Masuk" value={loanIn} positive />
        {loanIn > 0 && (
          <Text style={styles.hint}>
            Pinjaman menambah kas saat ini, tapi bukan pendapatan
          </Text>
        )}
      </View>

      <View style={styles.divider} />
      <View style={styles.resultRow}>
        <Text style={styles.resultLabel}>Kas Bersih</Text>
        <Text style={[styles.resultValue, { color: kasBersih >= 0 ? colors.success : colors.danger }]}>
          {kasBersih >= 0 ? '+' : ''}{formatIDR(kasBersih)}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Posisi Akrual (Belum Kas)</Text>
        <Row label="Piutang Gabah" value={totalRevenueUnpaid} positive />
        <Row label="Hutang Saprotan" value={-totalExpensesUnpaid} positive={false} />
        <Row label="Piutang Keluar" value={loanOut} positive />
      </View>

      <View style={styles.divider} />
      <View style={styles.resultRow}>
        <Text style={styles.resultLabel}>Total Aset Akrual</Text>
        <Text style={[styles.resultValue, { color: totalAsetAkrual >= 0 ? colors.primary : colors.danger }]}>
          {totalAsetAkrual >= 0 ? '+' : ''}{formatIDR(totalAsetAkrual)}
        </Text>
      </View>

      <Text style={styles.footerHint}>
        Kas Bersih = uang yang benar-benar ada sekarang. Total Aset Akrual = kas + piutang − hutang.
      </Text>
    </View>
  );
}

function Row({ label, value, positive }: { label: string; value: number; positive: boolean }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, { color: value >= 0 ? colors.success : colors.danger }]}>
        {formatIDR(value)}
      </Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md + 4,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  title: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
    marginBottom: SPACING.md,
  },
  section: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  rowLabel: {
    fontSize: fs.sm,
    color: colors.textSecondary,
  },
  rowValue: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: SPACING.sm,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  resultLabel: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
  },
  resultValue: {
    fontSize: fs.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  hint: {
    fontSize: 9,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 2,
  },
  footerHint: {
    fontSize: 9,
    color: colors.textLight,
    marginTop: SPACING.sm,
    lineHeight: 14,
  },
});
