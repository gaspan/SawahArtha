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
import { getZakatSummary, NISAB_KG, ZAKAT_RATE } from '../utils/zakat';

interface Props {
  totalGKG: number;
  avgPricePerKg: number;
}

export default function ZakatSection({ totalGKG, avgPricePerKg }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const summary = getZakatSummary(totalGKG, avgPricePerKg);

  return (
    <View style={styles.container}>
      {/* Decorative Top Accent */}
      <View style={styles.accentBar} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🕌</Text>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Kalkulator Zakat Pertanian</Text>
          <Text style={styles.headerSubtitle}>
            Hitung kewajiban zakat hasil panen
          </Text>
        </View>
      </View>

      {/* Wajib Badge */}
      <View
        style={[
          styles.wajibBadge,
          summary.wajib ? styles.wajibBadgeActive : styles.wajibBadgeInactive,
        ]}
      >
        <Text
          style={[
            styles.wajibBadgeText,
            summary.wajib
              ? styles.wajibBadgeTextActive
              : styles.wajibBadgeTextInactive,
          ]}
        >
          {summary.wajib ? 'Wajib Zakat: Ya ✅' : 'Wajib Zakat: Tidak'}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Progress menuju Nisab</Text>
          <Text style={styles.progressPercent}>
            {summary.progressToNisab.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${summary.progressToNisab}%`,
                backgroundColor: summary.wajib
                  ? colors.primary
                  : colors.secondary,
              },
            ]}
          />
        </View>
        <View style={styles.progressMarkers}>
          <Text style={styles.progressMarkerText}>0 kg</Text>
          <Text style={styles.progressMarkerText}>{NISAB_KG} kg</Text>
        </View>
      </View>

      {/* Info Rows */}
      <View style={styles.infoSection}>
        <InfoRow
          label="Nisab"
          value={`${NISAB_KG.toLocaleString('id-ID')} kg GKG`}
        />
        <InfoRow
          label="Total GKG Anda"
          value={`${totalGKG.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg`}
          highlight
        />
        {!summary.wajib && (
          <InfoRow
            label="Kurang dari nisab"
            value={`${summary.remainingToNisab.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg lagi`}
            accent
          />
        )}
      </View>

      {/* Zakat Calculation (shown when wajib) */}
      {summary.wajib && (
        <View style={styles.zakatCalcSection}>
          <View style={styles.zakatCalcHeader}>
            <Text style={styles.zakatCalcIcon}>📐</Text>
            <Text style={styles.zakatCalcTitle}>Perhitungan Zakat</Text>
          </View>

          <View style={styles.calcCard}>
            <InfoRow
              label="Tarif Zakat"
              value={`${(ZAKAT_RATE * 100).toFixed(0)}% (irigasi)`}
            />
            <View style={styles.calcDivider} />

            <View style={styles.calcRow}>
              <Text style={styles.calcFormula}>
                {totalGKG.toLocaleString('id-ID', { maximumFractionDigits: 1 })}{' '}
                kg × {(ZAKAT_RATE * 100).toFixed(0)}%
              </Text>
            </View>
            <View style={styles.calcResultRow}>
              <Text style={styles.calcResultLabel}>Zakat (kg)</Text>
              <Text style={styles.calcResultValue}>
                {summary.zakatKg.toLocaleString('id-ID', {
                  maximumFractionDigits: 1,
                })}{' '}
                kg
              </Text>
            </View>

            {avgPricePerKg > 0 && (
              <>
                <View style={styles.calcDivider} />
                <View style={styles.calcRow}>
                  <Text style={styles.calcFormula}>
                    {summary.zakatKg.toLocaleString('id-ID', {
                      maximumFractionDigits: 1,
                    })}{' '}
                    kg × {formatIDR(avgPricePerKg)}/kg
                  </Text>
                </View>
                <View style={styles.calcResultRow}>
                  <Text style={styles.calcResultLabel}>Zakat (Rp)</Text>
                  <Text style={styles.calcResultValueGold}>
                    {formatIDR(summary.zakatRp)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Decorative footer note */}
      <View style={styles.footerNote}>
        <Text style={styles.footerNoteText}>
          💡 Nisab dihitung berdasarkan berat GKG (Gabah Kering Giling). Tarif
          5% berlaku untuk lahan irigasi.
        </Text>
      </View>
    </View>
  );
}

/** Reusable info row sub-component */
function InfoRow({
  label,
  value,
  highlight,
  accent,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[
          styles.value,
          highlight && styles.valueHighlight,
          accent && styles.valueAccent,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
  },
  label: {
    fontSize: fs.sm,
    color: colors.textSecondary,
  },
  value: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
  },
  valueHighlight: {
    color: colors.primary,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: fs.md,
  },
  valueAccent: {
    color: colors.secondary,
    fontWeight: FONT_WEIGHT.bold,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  accentBar: {
    height: 4,
    backgroundColor: colors.secondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  headerIcon: {
    fontSize: 28,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fs.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fs.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Wajib Badge
  wajibBadge: {
    marginHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  wajibBadgeActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  wajibBadgeInactive: {
    backgroundColor: colors.borderLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  wajibBadgeText: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  wajibBadgeTextActive: {
    color: colors.primaryDark,
  },
  wajibBadgeTextInactive: {
    color: colors.textSecondary,
  },

  // Progress Bar
  progressSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    fontSize: fs.xs,
    color: colors.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  progressPercent: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primary,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: colors.borderLight,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
    minWidth: 4,
  },
  progressMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  progressMarkerText: {
    fontSize: 9,
    color: colors.textLight,
  },

  // Info Section
  infoSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },

  // Zakat Calculation
  zakatCalcSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  zakatCalcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  zakatCalcIcon: {
    fontSize: fs.md,
  },
  zakatCalcTitle: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
  },
  calcCard: {
    backgroundColor: colors.amberBg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: colors.amberLight,
  },
  calcDivider: {
    height: 1,
    backgroundColor: colors.amberLight,
    marginVertical: SPACING.xs,
  },
  calcRow: {
    paddingVertical: 2,
  },
  calcFormula: {
    fontSize: fs.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  calcResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  calcResultLabel: {
    fontSize: fs.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
  },
  calcResultValue: {
    fontSize: fs.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.primaryDark,
  },
  calcResultValueGold: {
    fontSize: fs.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.amberDark,
  },

  // Footer Note
  footerNote: {
    backgroundColor: colors.background,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xs,
  },
  footerNoteText: {
    fontSize: fs.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
