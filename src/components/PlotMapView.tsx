import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LeafletMap, { PlotMapData } from './LeafletMap';
import { SPACING, BORDER_RADIUS, FONT_WEIGHT, SHADOW, type ThemeColors } from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';

export interface PlotLocation {
  id: number;
  name: string;
  location_type: 'none' | 'point' | 'polygon';
  latitude?: number | null;
  longitude?: number | null;
  polygon_coords?: string | null;
  land_size_m2: number;
}

interface PlotMapViewProps {
  plots: PlotLocation[];
  onPlotPress?: (plotId: number) => void;
  showFullscreen?: boolean;
}

export default function PlotMapView({ plots, onPlotPress, showFullscreen = false }: PlotMapViewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  // Filter plots that have location data
  const plotsWithLocation = plots.filter(
    p => p.location_type !== 'none' && ((p.latitude && p.longitude) || p.polygon_coords)
  );

  if (plotsWithLocation.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyText}>📍</Text>
        <Text style={styles.emptyTitle}>Belum Ada Lokasi</Text>
        <Text style={styles.emptySubtitle}>
          Tambahkan lokasi GPS ke petak lahan untuk melihat di peta
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, showFullscreen && styles.fullscreen]}>
      <LeafletMap
        mode="view"
        plots={plotsWithLocation as PlotMapData[]}
        onPlotPress={onPlotPress}
        showLayerToggle={true}
        style={styles.map}
      />

      {!showFullscreen && (
        <View style={styles.legend}>
          <Text style={styles.legendText}>
            📍 {plotsWithLocation.length} Petak Ditandai
          </Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      height: 300,
      borderRadius: BORDER_RADIUS.xl,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      ...SHADOW.md,
    },
    fullscreen: {
      height: '100%',
      borderRadius: 0,
    },
    map: {
      flex: 1,
    },
    emptyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xl,
    },
    emptyText: {
      fontSize: 48,
      marginBottom: SPACING.sm,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.text,
      marginBottom: SPACING.xs,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textLight,
      textAlign: 'center',
    },
    markerContainer: {
      alignItems: 'center',
    },
    marker: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.background,
      ...SHADOW.sm,
    },
    markerText: {
      fontSize: 16,
    },
    markerLabel: {
      marginTop: 2,
      fontSize: 11,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.text,
      backgroundColor: colors.background,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 4,
      ...SHADOW.sm,
    },
    polygonLabel: {
      backgroundColor: colors.background,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.sm,
      borderWidth: 1,
      borderColor: colors.primary,
      ...SHADOW.sm,
    },
    polygonLabelText: {
      fontSize: 12,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.primary,
    },
    legend: {
      position: 'absolute',
      bottom: SPACING.sm,
      left: SPACING.sm,
      backgroundColor: colors.glassBg,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      ...SHADOW.sm,
    },
    legendText: {
      fontSize: 12,
      fontWeight: FONT_WEIGHT.medium,
      color: colors.text,
    },
  });
