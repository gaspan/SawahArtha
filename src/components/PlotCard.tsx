/**
 * PlotCard - Manajemen petak lahan (multi-lahan) di dashboard
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import type { Plot } from '../database/plotService';
import { totalPlotArea } from '../database/plotService';

interface Props {
  plots: Plot[];
  onAddPlot: () => void;
  onEditPlot: (plot: Plot) => void;
}

export default function PlotCard({ plots, onAddPlot, onEditPlot }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const total = totalPlotArea(plots);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Petak Lahan 🌱</Text>
        <TouchableOpacity style={styles.addBtn} onPress={onAddPlot} activeOpacity={0.7}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      {plots.length === 0 ? (
        <Text style={styles.emptyText}>
          Belum ada petak lahan. Tambahkan untuk memilah catatan per petak (multi-lahan).
        </Text>
      ) : (
        <>
          <Text style={styles.totalText}>
            Total {plots.length} petak · {formatArea(total)} m²
          </Text>
          {plots.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.plotRow}
              onPress={() => onEditPlot(p)}
              activeOpacity={0.7}
            >
              <View style={styles.plotLeft}>
                <Text style={styles.plotName}>{p.name}</Text>
                {p.note ? <Text style={styles.plotNote} numberOfLines={1}>{p.note}</Text> : null}
              </View>
              <Text style={styles.plotSize}>{formatArea(p.land_size_m2)} m²</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </View>
  );
}

function formatArea(m2: number): string {
  if (!m2 || m2 <= 0) return '0';
  return m2.toLocaleString('id-ID');
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
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    title: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
    },
    addBtn: {
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: colors.primaryLight,
    },
    addBtnText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.primaryDark,
    },
    emptyText: {
      fontSize: fs.xs,
      color: colors.textLight,
      lineHeight: 18,
    },
    totalText: {
      fontSize: fs.xs,
      color: colors.textSecondary,
      marginBottom: SPACING.sm,
    },
    plotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.sm + 2,
      marginBottom: SPACING.xs,
    },
    plotLeft: {
      flex: 1,
      paddingRight: SPACING.sm,
    },
    plotName: {
      fontSize: fs.sm,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.text,
    },
    plotNote: {
      fontSize: fs.xs,
      color: colors.textLight,
      marginTop: 1,
    },
    plotSize: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.primaryDark,
    },
  });
