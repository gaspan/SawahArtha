import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import * as Location from 'expo-location';
import LeafletMap, { Coordinate } from './LeafletMap';
import { SPACING, BORDER_RADIUS, FONT_WEIGHT, SHADOW, type ThemeColors } from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';

interface LocationPickerProps {
  mode: 'point' | 'polygon';
  initialLocation?: Coordinate | null;
  initialPolygon?: Coordinate[] | null;
  onLocationSelect: (location: Coordinate, accuracy: number) => void;
  onPolygonComplete: (polygon: Coordinate[], area: number) => void;
}

const INITIAL_REGION: Coordinate = {
  latitude: -7.5,
  longitude: 110.0,
};

export default function LocationPicker({
  mode,
  initialLocation,
  initialPolygon,
  onLocationSelect,
  onPolygonComplete,
}: LocationPickerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [loading, setLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Coordinate | null>(initialLocation || null);
  const [polygonPoints, setPolygonPoints] = useState<Coordinate[]>(initialPolygon || []);

  // Manual coordinate input modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Izin Lokasi Diperlukan',
          'Aplikasi memerlukan akses lokasi GPS untuk mendeteksi posisi sawah Anda.',
          [
            { text: 'Batal', style: 'cancel' },
            { text: 'Buka Pengaturan', onPress: () => Location.requestForegroundPermissionsAsync() },
          ]
        );
        setLoading(false);
        setIsLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);

      if (mode === 'point') {
        setSelectedLocation(coords);
      }

      setLoading(false);
    } catch (error) {
      console.warn('GPS location fetch error:', error);
      Alert.alert(
        'GPS Belum Aktif',
        'Gagal mendeteksi lokasi GPS otomatis. Anda dapat mengetuk peta langsung atau menggunakan tombol Input Koordinat Manual.'
      );
      setLoading(false);
    } finally {
      setIsLocating(false);
    }
  };

  const handleMapClick = useCallback(
    (coord: Coordinate) => {
      if (mode === 'point') {
        setSelectedLocation(coord);
      } else if (mode === 'polygon') {
        setPolygonPoints((prev) => [...prev, coord]);
      }
    },
    [mode]
  );

  const handleConfirmPoint = useCallback(() => {
    if (!selectedLocation) {
      Alert.alert('Pilih Lokasi', 'Ketuk pada peta atau tekan tombol GPS untuk menandai lokasi sawah.');
      return;
    }
    const accuracy = 10;
    onLocationSelect(selectedLocation, accuracy);
  }, [selectedLocation, onLocationSelect]);

  const handleConfirmPolygon = useCallback(() => {
    if (polygonPoints.length < 3) {
      Alert.alert('Polygon Belum Cukup', 'Minimal 3 titik koordinat diperlukan untuk membentuk poligon batas lahan.');
      return;
    }
    const area = calculatePolygonArea(polygonPoints);
    onPolygonComplete(polygonPoints, area);
  }, [polygonPoints, onPolygonComplete]);

  const handleUndoLastPoint = useCallback(() => {
    setPolygonPoints((prev) => prev.slice(0, -1));
  }, []);

  const handleClearPolygon = useCallback(() => {
    Alert.alert('Hapus Poligon', 'Hapus semua titik batas poligon?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus Semua',
        style: 'destructive',
        onPress: () => setPolygonPoints([]),
      },
    ]);
  }, []);

  const handleApplyManualCoords = () => {
    const lat = parseFloat(manualLat.replace(',', '.'));
    const lon = parseFloat(manualLon.replace(',', '.'));

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      Alert.alert('Format Tidak Valid', 'Pastikan latitude (-90 s/d 90) dan longitude (-180 s/d 180) berupa angka yang valid.');
      return;
    }

    const newCoord = { latitude: lat, longitude: lon };
    setCurrentLocation(newCoord);
    if (mode === 'point') {
      setSelectedLocation(newCoord);
    } else {
      setPolygonPoints((prev) => [...prev, newCoord]);
    }

    setShowManualModal(false);
    setManualLat('');
    setManualLon('');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Menyiapkan peta & GPS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Leaflet OpenStreetMap + Satellite Map View */}
      <LeafletMap
        mode={mode === 'point' ? 'picker-point' : 'picker-polygon'}
        center={currentLocation || undefined}
        initialCenter={INITIAL_REGION}
        selectedPoint={selectedLocation}
        polygonPoints={polygonPoints}
        onMapClick={handleMapClick}
        showLayerToggle={true}
        style={styles.map}
      />

      {/* Top Quick Actions Toolbar */}
      <View style={styles.topToolbar}>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={getCurrentLocation}
          disabled={isLocating}
          activeOpacity={0.8}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color={colors.primaryDark} />
          ) : (
            <>
              <Text style={styles.toolBtnIcon}>📡</Text>
              <Text style={styles.toolBtnText}>Deteksi GPS Saya</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => setShowManualModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.toolBtnIcon}>✏️</Text>
          <Text style={styles.toolBtnText}>Input Manual</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Controls Panel */}
      <View style={styles.controls}>
        {mode === 'point' && (
          <>
            <View style={styles.statusBox}>
              <Text style={styles.statusTitle}>
                {selectedLocation ? '📍 Titik Terpilih' : '👆 Ketuk Peta'}
              </Text>
              <Text style={styles.statusCoords}>
                {selectedLocation
                  ? `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`
                  : 'Ketuk area pada peta atau gunakan tombol "Deteksi GPS Saya"'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, !selectedLocation && styles.buttonDisabled]}
              onPress={handleConfirmPoint}
              disabled={!selectedLocation}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {selectedLocation ? '✓ Gunakan Titik Ini' : 'Pilih Titik Dahulu'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {mode === 'polygon' && (
          <>
            <View style={styles.statusBox}>
              <Text style={styles.statusTitle}>
                📐 {polygonPoints.length} Titik Poligon Terpasang
              </Text>
              <Text style={styles.statusCoords}>
                {polygonPoints.length >= 3
                  ? `Luas terhitung: ~${calculatePolygonArea(polygonPoints).toLocaleString('id-ID')} m²`
                  : 'Ketuk peta minimal 3 titik untuk membuat batas lahan sawah'}
              </Text>
            </View>

            {polygonPoints.length > 0 && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton, { flex: 1 }]}
                  onPress={handleUndoLastPoint}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryButtonText}>↩ Undo</Text>
                </TouchableOpacity>
                <View style={{ width: SPACING.sm }} />
                <TouchableOpacity
                  style={[styles.button, styles.dangerButton, { flex: 1 }]}
                  onPress={handleClearPolygon}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonText}>🗑️ Reset</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                polygonPoints.length < 3 && styles.buttonDisabled,
              ]}
              onPress={handleConfirmPolygon}
              disabled={polygonPoints.length < 3}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {polygonPoints.length >= 3
                  ? `✓ Selesai (~${calculatePolygonArea(polygonPoints).toLocaleString('id-ID')} m²)`
                  : `Kurang ${3 - polygonPoints.length} titik lagi`}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Manual Coordinates Input Modal */}
      <Modal
        visible={showManualModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowManualModal(false)}
      >
        <View style={styles.manualModalOverlay}>
          <View style={styles.manualModalCard}>
            <Text style={styles.manualModalTitle}>Input Koordinat Manual</Text>
            <Text style={styles.manualModalSubtitle}>
              Ketik atau salin angka Latitude dan Longitude:
            </Text>

            <Text style={styles.manualInputLabel}>Latitude (Garis Lintang)</Text>
            <TextInput
              style={styles.manualInput}
              value={manualLat}
              onChangeText={setManualLat}
              placeholder="e.g., -7.502345"
              placeholderTextColor={colors.textLight}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.manualInputLabel}>Longitude (Garis Bujur)</Text>
            <TextInput
              style={styles.manualInput}
              value={manualLon}
              onChangeText={setManualLon}
              placeholder="e.g., 110.234567"
              placeholderTextColor={colors.textLight}
              keyboardType="numbers-and-punctuation"
            />

            <View style={styles.manualModalActions}>
              <TouchableOpacity
                style={[styles.manualModalBtn, styles.manualModalBtnCancel]}
                onPress={() => setShowManualModal(false)}
              >
                <Text style={styles.manualModalBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.manualModalBtn, styles.manualModalBtnConfirm]}
                onPress={handleApplyManualCoords}
              >
                <Text style={styles.manualModalBtnConfirmText}>Pasang Titik</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Haversine formula untuk menghitung luas polygon dalam meter persegi
function calculatePolygonArea(coordinates: Coordinate[]): number {
  if (coordinates.length < 3) return 0;

  const earthRadius = 6371000;
  let area = 0;

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const xi = (coordinates[i].longitude * Math.PI) / 180;
    const yi = (coordinates[i].latitude * Math.PI) / 180;
    const xj = (coordinates[j].longitude * Math.PI) / 180;
    const yj = (coordinates[j].latitude * Math.PI) / 180;

    area += xi * Math.sin(yj) - xj * Math.sin(yi);
  }

  area = Math.abs((area * earthRadius * earthRadius) / 2);
  return Math.round(area);
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: SPACING.md,
      fontSize: fs.sm,
      color: colors.textSecondary,
    },
    map: {
      flex: 1,
    },
    topToolbar: {
      position: 'absolute',
      top: SPACING.sm,
      left: SPACING.sm,
      right: SPACING.sm,
      flexDirection: 'row',
      gap: SPACING.xs + 2,
    },
    toolBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
      paddingVertical: SPACING.xs + 3,
      paddingHorizontal: SPACING.sm,
      borderRadius: BORDER_RADIUS.lg,
      gap: 4,
      ...SHADOW.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    toolBtnIcon: {
      fontSize: 14,
    },
    toolBtnText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
    },
    controls: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      padding: SPACING.md,
      borderTopLeftRadius: BORDER_RADIUS.xl,
      borderTopRightRadius: BORDER_RADIUS.xl,
      ...SHADOW.lg,
    },
    statusBox: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.sm,
      marginBottom: SPACING.sm,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    statusTitle: {
      fontSize: fs.xs + 1,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.primaryDark,
      marginBottom: 2,
    },
    statusCoords: {
      fontSize: fs.xs,
      color: colors.textSecondary,
    },
    button: {
      paddingVertical: SPACING.md - 2,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    secondaryButton: {
      backgroundColor: colors.borderLight,
    },
    dangerButton: {
      backgroundColor: colors.dangerLight,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: colors.textInverse,
      fontSize: fs.sm,
      fontWeight: FONT_WEIGHT.bold,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: fs.sm,
      fontWeight: FONT_WEIGHT.bold,
    },
    buttonRow: {
      flexDirection: 'row',
      marginBottom: SPACING.xs,
    },
    polygonMarker: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      ...SHADOW.sm,
    },
    polygonMarkerText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: FONT_WEIGHT.bold,
    },
    // Manual Modal Styles
    manualModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      padding: SPACING.lg,
    },
    manualModalCard: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.lg,
      ...SHADOW.lg,
    },
    manualModalTitle: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
      marginBottom: 4,
    },
    manualModalSubtitle: {
      fontSize: fs.xs,
      color: colors.textSecondary,
      marginBottom: SPACING.md,
    },
    manualInputLabel: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.text,
      marginBottom: 4,
    },
    manualInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      fontSize: fs.sm,
      color: colors.text,
      marginBottom: SPACING.sm,
    },
    manualModalActions: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },
    manualModalBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.sm + 2,
      borderRadius: BORDER_RADIUS.md,
    },
    manualModalBtnCancel: {
      backgroundColor: colors.borderLight,
    },
    manualModalBtnCancelText: {
      fontSize: fs.sm,
      color: colors.textSecondary,
      fontWeight: FONT_WEIGHT.semibold,
    },
    manualModalBtnConfirm: {
      backgroundColor: colors.primary,
    },
    manualModalBtnConfirmText: {
      fontSize: fs.sm,
      color: colors.textInverse,
      fontWeight: FONT_WEIGHT.bold,
    },
  });
