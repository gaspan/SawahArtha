import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
} from '../constants/theme';
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
        <Text style={[styles.resultValue, { color: kasBersih >= 0 ? COLORS.success : COLORS.danger }]}>
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
        <Text style={[styles.resultValue, { color: totalAsetAkrual >= 0 ? COLORS.primary : COLORS.danger }]}>
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
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, { color: value >= 0 ? COLORS.success : COLORS.danger }]}>
        {formatIDR(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md + 4,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  section: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
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
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  rowValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.sm,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  resultLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  resultValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  hint: {
    fontSize: 9,
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginTop: 2,
  },
  footerHint: {
    fontSize: 9,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    lineHeight: 14,
  },
});
