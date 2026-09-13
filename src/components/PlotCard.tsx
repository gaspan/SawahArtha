/**
 * PlotCard - Manajemen petak lahan (multi-lahan) di dashboard dengan tampilan daftar & peta (PlotMapView)
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, Alert } from 'react-native';
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
  onDeletePlot?: (plot: Plot) => void;
}

export default function PlotCard({ plots, onAddPlot, onEditPlot, onDeletePlot }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [viewingPlot, setViewingPlot] = useState<Plot | null>(null);
  const total = totalPlotArea(plots);

  const plotsWithLocationCount = plots.filter(
    (p) => p.location_type !== 'none' && ((p.latitude && p.longitude) || p.polygon_coords)
  ).length;

  const handleDeletePlot = (plot: Plot) => {
    Alert.alert(
      'Hapus Petak Lahan 🗑️',
      `Hapus "${plot.name}"?\nCatatan terkait tidak dihapus, hanya petaknya yang dilepas.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => onDeletePlot?.(plot),
        },
      ]
    );
  };

  const hasLocation = (p: Plot) =>
    p.location_type &&
    p.location_type !== 'none' &&
    ((p.latitude && p.longitude) || p.polygon_coords);

  return (
    <>
      <View style={styles.card}>
        {/* Premium Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerLeft}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>🌱</Text>
            </View>
            <View>
              <Text style={styles.title}>Petak Lahan</Text>
              <Text style={styles.headerMeta}>
                {plots.length > 0
                  ? `${plots.length} petak · ${formatArea(total)} m²`
                  : 'Belum ada petak'}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {plotsWithLocationCount > 0 && (
              <View style={styles.geoBadge}>
                <Text style={styles.geoBadgeText}>📍 {plotsWithLocationCount}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.addBtn} onPress={onAddPlot} activeOpacity={0.7}>
              <Text style={styles.addBtnText}>+ Tambah</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Switcher */}
        {plots.length > 0 && (
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tabBtn, viewMode === 'list' && styles.tabBtnActive]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabBtnText, viewMode === 'list' && styles.tabBtnTextActive]}>
                📋 Daftar
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

        {/* Content */}
        {plots.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏞️</Text>
            <Text style={styles.emptyTitle}>Belum Ada Petak Lahan</Text>
            <Text style={styles.emptyText}>
              Tambahkan untuk memilah catatan per petak dan menandai lokasi di peta.
            </Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={onAddPlot} activeOpacity={0.7}>
              <Text style={styles.emptyAddBtnText}>+ Tambah Petak Pertama</Text>
            </TouchableOpacity>
          </View>
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
          <View style={styles.plotList}>
            {plots.map((p) => (
              <View key={p.id} style={styles.plotRow}>
                {/* Plot Info */}
                <View style={styles.plotInfo}>
                  <View style={styles.plotNameRow}>
                    <Text style={styles.plotName} numberOfLines={1}>{p.name}</Text>
                    {hasLocation(p) ? (
                      <View style={styles.plotLocationPill}>
                        <Text style={styles.plotLocationPillText}>
                          {p.location_type === 'polygon' ? '📐' : '📍'}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.plotMetaRow}>
                    <Text style={styles.plotSize}>{formatArea(p.land_size_m2)} m²</Text>
                    {p.note ? (
                      <Text style={styles.plotNote} numberOfLines={1}>· {p.note}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.plotActions}>
                  {hasLocation(p) ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnView]}
                      onPress={() => setViewingPlot(p)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionBtnViewText}>🗺️ Lihat</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnEdit]}
                    onPress={() => onEditPlot(p)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionBtnEditText}>✏️ Ubah</Text>
                  </TouchableOpacity>
                  {onDeletePlot ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnDelete]}
                      onPress={() => handleDeletePlot(p)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionBtnDeleteText}>🗑️</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Fullscreen Map Modal for viewing a single plot */}
      <Modal
        visible={viewingPlot !== null}
        animationType="slide"
        onRequestClose={() => setViewingPlot(null)}
      >
        <SafeAreaView style={styles.viewMapContainer}>
          {/* Header */}
          <View style={styles.viewMapHeader}>
            <View style={styles.viewMapHeaderLeft}>
              <Text style={styles.viewMapIcon}>🗺️</Text>
              <View>
                <Text style={styles.viewMapTitle}>{viewingPlot?.name ?? 'Peta Petak'}</Text>
                <Text style={styles.viewMapSubtitle}>
                  {viewingPlot ? `${formatArea(viewingPlot.land_size_m2)} m²` : ''}
                  {viewingPlot?.location_type === 'polygon' ? ' · Batas Poligon' : ' · Titik GPS'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewMapCloseBtn}
              onPress={() => setViewingPlot(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.viewMapCloseBtnText}>✕ Tutup</Text>
            </TouchableOpacity>
          </View>

          {/* Map */}
          {viewingPlot && (
            <View style={styles.viewMapBody}>
              <PlotMapView
                plots={[{
                  id: viewingPlot.id,
                  name: viewingPlot.name,
                  location_type: viewingPlot.location_type || 'none',
                  latitude: viewingPlot.latitude,
                  longitude: viewingPlot.longitude,
                  polygon_coords: viewingPlot.polygon_coords,
                  land_size_m2: viewingPlot.land_size_m2,
                }]}
                showFullscreen
              />
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </>
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

    /* ── Header ────────────────── */
    headerSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm + 4,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconEmoji: {
      fontSize: 20,
    },
    title: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
    },
    headerMeta: {
      fontSize: fs.xs,
      color: colors.textLight,
      marginTop: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs + 2,
    },
    geoBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: SPACING.xs + 3,
      paddingVertical: 3,
      borderRadius: BORDER_RADIUS.full,
    },
    geoBadgeText: {
      fontSize: fs.xs - 1,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.primaryDark,
    },
    addBtn: {
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: SPACING.xs + 2,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.primary,
    },
    addBtnText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.textInverse,
    },

    /* ── Tab Switcher ──────────── */
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

    /* ── Map Container ─────────── */
    mapContainer: {
      marginTop: SPACING.xs,
      borderRadius: BORDER_RADIUS.md,
      overflow: 'hidden',
    },

    /* ── Empty State ───────────── */
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.md,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: SPACING.sm,
    },
    emptyTitle: {
      fontSize: fs.sm + 1,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
      marginBottom: SPACING.xs,
    },
    emptyText: {
      fontSize: fs.xs,
      color: colors.textLight,
      lineHeight: 18,
      textAlign: 'center',
      marginBottom: SPACING.md,
    },
    emptyAddBtn: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm + 2,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.primary,
    },
    emptyAddBtnText: {
      fontSize: fs.sm,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.textInverse,
    },

    /* ── Plot List ─────────────── */
    plotList: {
      gap: SPACING.sm,
    },
    plotRow: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.sm + 4,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    plotInfo: {
      marginBottom: SPACING.sm,
    },
    plotNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
      marginBottom: 3,
    },
    plotName: {
      fontSize: fs.sm + 1,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
      flex: 1,
    },
    plotLocationPill: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plotLocationPillText: {
      fontSize: 12,
    },
    plotMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    plotSize: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.primaryDark,
    },
    plotNote: {
      fontSize: fs.xs,
      color: colors.textLight,
      flex: 1,
    },

    /* ── Action Buttons ────────── */
    plotActions: {
      flexDirection: 'row',
      gap: SPACING.xs + 2,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.xs + 3,
      borderRadius: BORDER_RADIUS.md,
      gap: 2,
    },
    actionBtnView: {
      backgroundColor: colors.infoLight,
      borderWidth: 1,
      borderColor: colors.info + '40',
    },
    actionBtnViewText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.info,
    },
    actionBtnEdit: {
      backgroundColor: colors.secondaryLight,
      borderWidth: 1,
      borderColor: colors.secondary + '40',
    },
    actionBtnEditText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.secondary,
    },
    actionBtnDelete: {
      flex: 0,
      paddingHorizontal: SPACING.sm + 2,
      backgroundColor: colors.dangerLight,
      borderWidth: 1,
      borderColor: colors.danger + '30',
    },
    actionBtnDeleteText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.danger,
    },

    /* ── View Map Modal ────────── */
    viewMapContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    viewMapHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 4,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      ...SHADOW.sm,
    },
    viewMapHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      flex: 1,
    },
    viewMapIcon: {
      fontSize: 24,
    },
    viewMapTitle: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
    },
    viewMapSubtitle: {
      fontSize: fs.xs,
      color: colors.textLight,
      marginTop: 1,
    },
    viewMapCloseBtn: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: colors.primaryLight,
    },
    viewMapCloseBtnText: {
      fontSize: fs.sm,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.primaryDark,
    },
    viewMapBody: {
      flex: 1,
    },
  });
