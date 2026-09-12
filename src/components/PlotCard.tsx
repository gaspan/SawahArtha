/**
 * PlotCard - Manajemen petak lahan (multi-lahan) di dashboard dengan tampilan daftar & peta (PlotMapView)
 */
import React, { useState } from 'react';
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
import PlotMapView from './PlotMapView';

interface Props {
  plots: Plot[];
  onAddPlot: () => void;
  onEditPlot: (plot: Plot) => void;
}

export default function PlotCard({ plots, onAddPlot, onEditPlot }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const total = totalPlotArea(plots);

  const plotsWithLocationCount = plots.filter(
    (p) => p.location_type !== 'none' && ((p.latitude && p.longitude) || p.polygon_coords)
  ).length;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithCount}>
          <Text style={styles.title}>Petak Lahan 🌱</Text>
          {plotsWithLocationCount > 0 && (
            <View style={styles.geoBadge}>
              <Text style={styles.geoBadgeText}>📍 {plotsWithLocationCount} ditandai</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={onAddPlot} activeOpacity={0.7}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      {plots.length > 0 && (
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabBtn, viewMode === 'list' && styles.tabBtnActive]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, viewMode === 'list' && styles.tabBtnTextActive]}>
              📋 Daftar ({plots.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, viewMode === 'map' && styles.tabBtnActive]}
            onPress={() => setViewMode('map')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, viewMode === 'map' && styles.tabBtnTextActive]}>
              🗺️ Peta Lahan
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {plots.length === 0 ? (
        <Text style={styles.emptyText}>
          Belum ada petak lahan. Tambahkan untuk memilah catatan per petak (multi-lahan) dan menandai lokasi di peta.
        </Text>
      ) : viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <PlotMapView
            plots={plots.map((p) => ({
              id: p.id,
              name: p.name,
              location_type: p.location_type || 'none',
              latitude: p.latitude,
              longitude: p.longitude,
              polygon_coords: p.polygon_coords,
              land_size_m2: p.land_size_m2,
            }))}
            onPlotPress={(plotId) => {
              const target = plots.find((p) => p.id === plotId);
              if (target) onEditPlot(target);
            }}
          />
        </View>
      ) : (
        <>
          <Text style={styles.totalText}>
            Total {plots.length} petak · {formatArea(total)} m²
          </Text>
          {plots.map((p) => {
            const hasLocation =
              p.location_type &&
              p.location_type !== 'none' &&
              ((p.latitude && p.longitude) || p.polygon_coords);

            return (
              <TouchableOpacity
                key={p.id}
                style={styles.plotRow}
                onPress={() => onEditPlot(p)}
                activeOpacity={0.7}
              >
                <View style={styles.plotLeft}>
                  <View style={styles.plotNameRow}>
                    <Text style={styles.plotName}>{p.name}</Text>
                    {hasLocation ? (
                      <View style={styles.plotLocationPill}>
                        <Text style={styles.plotLocationPillText}>
                          {p.location_type === 'polygon' ? '📐 Batas' : '📍 GPS'}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {p.note ? (
                    <Text style={styles.plotNote} numberOfLines={1}>
                      {p.note}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.plotSize}>{formatArea(p.land_size_m2)} m²</Text>
              </TouchableOpacity>
            );
          })}
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
      borderRadius: BORDER_RADIUS.xl,
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
    titleWithCount: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    title: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
    },
    geoBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: SPACING.xs + 2,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.full,
    },
    geoBadgeText: {
      fontSize: fs.xs - 2,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.primaryDark,
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
    tabSwitcher: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: BORDER_RADIUS.md,
      padding: 3,
      marginBottom: SPACING.sm,
      gap: SPACING.xs,
    },
    tabBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: SPACING.xs + 2,
      borderRadius: BORDER_RADIUS.sm,
    },
    tabBtnActive: {
      backgroundColor: colors.surface,
      ...SHADOW.sm,
    },
    tabBtnText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.medium,
      color: colors.textSecondary,
    },
    tabBtnTextActive: {
      fontWeight: FONT_WEIGHT.bold,
      color: colors.primaryDark,
    },
    mapContainer: {
      marginTop: SPACING.xs,
      borderRadius: BORDER_RADIUS.md,
      overflow: 'hidden',
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
      backgroundColor: colors.surfaceElevated,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.sm + 2,
      marginBottom: SPACING.xs,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    plotLeft: {
      flex: 1,
      paddingRight: SPACING.sm,
    },
    plotNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    plotName: {
      fontSize: fs.sm,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.text,
    },
    plotLocationPill: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: BORDER_RADIUS.full,
    },
    plotLocationPillText: {
      fontSize: 10,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.primaryDark,
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
