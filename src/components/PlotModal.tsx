/**
 * PlotModal - Tambah / edit petak lahan (multi-lahan) dengan integrasi LocationPicker
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import type { Plot, PlotInput } from '../database/plotService';
import LocationPicker from './LocationPicker';

interface Props {
  visible: boolean;
  plot: Plot | null;
  onSave: (input: PlotInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

export default function PlotModal({ visible, plot, onSave, onDelete, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [name, setName] = useState('');
  const [landSize, setLandSize] = useState('');
  const [note, setNote] = useState('');
  const [locationType, setLocationType] = useState<'none' | 'point' | 'polygon'>('none');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [polygonCoords, setPolygonCoords] = useState<string | null>(null);
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [locationTaggedAt, setLocationTaggedAt] = useState<string | null>(null);

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'point' | 'polygon'>('point');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      setName('');
      setLandSize('');
      setNote('');
      setLocationType('none');
      setLatitude(null);
      setLongitude(null);
      setLocationAccuracy(null);
      setPolygonCoords(null);
      setCalculatedArea(null);
      setAddress(null);
      setLocationTaggedAt(null);
      setShowLocationPicker(false);
      setIsSaving(false);
    } else if (plot) {
      setName(plot.name);
      setLandSize(plot.land_size_m2 > 0 ? String(plot.land_size_m2) : '');
      setNote(plot.note ?? '');
      setLocationType(plot.location_type || 'none');
      setLatitude(plot.latitude ?? null);
      setLongitude(plot.longitude ?? null);
      setLocationAccuracy(plot.location_accuracy ?? null);
      setPolygonCoords(plot.polygon_coords ?? null);
      setCalculatedArea(plot.calculated_area ?? null);
      setAddress(plot.address ?? null);
      setLocationTaggedAt(plot.location_tagged_at ?? null);
      setPickerMode(plot.location_type === 'polygon' ? 'polygon' : 'point');
    } else {
      setName('');
      setLandSize('');
      setNote('');
      setLocationType('none');
      setLatitude(null);
      setLongitude(null);
      setLocationAccuracy(null);
      setPolygonCoords(null);
      setCalculatedArea(null);
      setAddress(null);
      setLocationTaggedAt(null);
      setPickerMode('point');
    }
  }, [visible, plot]);

  const isSaveDisabled = name.trim().length === 0 || isNaN(parseFloat(landSize)) || parseFloat(landSize) <= 0;

  const handleSave = async () => {
    if (isSaveDisabled || isSaving) return;
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        landSizeM2: parseFloat(landSize),
        note: note.trim() || undefined,
        location_type: locationType,
        latitude,
        longitude,
        location_accuracy: locationAccuracy,
        polygon_coords: polygonCoords,
        calculated_area: calculatedArea,
        address,
        location_tagged_at: locationTaggedAt,
      });
      onClose();
    } catch (error) {
      Alert.alert('Gagal ❌', 'Terjadi kesalahan saat menyimpan petak lahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!plot || !onDelete) return;
    Alert.alert(
      'Hapus Petak Lahan 🗑️',
      `Hapus "${plot.name}"?\nCatatan terkait tidak dihapus, hanya petaknya yang dilepas.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete();
              onClose();
            } catch (error) {
              Alert.alert('Gagal ❌', 'Terjadi kesalahan saat menghapus petak lahan.');
            }
          },
        },
      ]
    );
  };

  const handleRemoveLocation = () => {
    Alert.alert(
      'Hapus Lokasi',
      'Hapus tag lokasi dari petak ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            setLocationType('none');
            setLatitude(null);
            setLongitude(null);
            setLocationAccuracy(null);
            setPolygonCoords(null);
            setCalculatedArea(null);
            setLocationTaggedAt(null);
          },
        },
      ]
    );
  };

  const parsedPolygon = React.useMemo(() => {
    if (!polygonCoords) return null;
    try {
      return JSON.parse(polygonCoords);
    } catch {
      return null;
    }
  }, [polygonCoords]);

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
          <ScrollView style={styles.card} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>{plot ? 'Edit Petak Lahan' : 'Tambah Petak Lahan'}</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nama Petak *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Sawah Utara"
              placeholderTextColor={colors.textLight}
              maxLength={40}
            />

            <Text style={styles.label}>Luas Lahan (m²) *</Text>
            <TextInput
              style={styles.input}
              value={landSize}
              onChangeText={(t) => setLandSize(t.replace(/[^0-9.]/g, ''))}
              placeholder="e.g., 700"
              placeholderTextColor={colors.textLight}
              keyboardType="decimal-pad"
              maxLength={10}
            />

            <Text style={styles.label}>Catatan</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder="Opsional — lokasi, jenis tanah, dll."
              placeholderTextColor={colors.textLight}
              multiline
              maxLength={200}
            />

            {/* Geolocation Section */}
            <Text style={styles.label}>Lokasi Geografis (GPS / Peta)</Text>
            {locationType === 'point' && latitude != null && longitude != null ? (
              <View style={styles.locationCard}>
                <View style={styles.locationHeader}>
                  <Text style={styles.locationTitle}>📍 Titik Koordinat GPS</Text>
                  <View style={styles.locationActions}>
                    <TouchableOpacity
                      onPress={() => setShowLocationPicker(true)}
                      style={styles.locationEditBtn}
                    >
                      <Text style={styles.locationEditText}>Ubah</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleRemoveLocation}
                      style={styles.locationRemoveBtn}
                    >
                      <Text style={styles.locationRemoveText}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.locationCoords}>
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </Text>
                {locationAccuracy != null && (
                  <Text style={styles.locationMeta}>
                    Estimasi akurasi: ~{Math.round(locationAccuracy)} m
                  </Text>
                )}
              </View>
            ) : locationType === 'polygon' && parsedPolygon ? (
              <View style={styles.locationCard}>
                <View style={styles.locationHeader}>
                  <Text style={styles.locationTitle}>📐 Batas Poligon Lahan</Text>
                  <View style={styles.locationActions}>
                    <TouchableOpacity
                      onPress={() => setShowLocationPicker(true)}
                      style={styles.locationEditBtn}
                    >
                      <Text style={styles.locationEditText}>Ubah</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleRemoveLocation}
                      style={styles.locationRemoveBtn}
                    >
                      <Text style={styles.locationRemoveText}>Hapus</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.locationCoords}>
                  {parsedPolygon.length} titik batas lahan tersimpan
                </Text>
                {calculatedArea != null && (
                  <Text style={styles.locationMeta}>
                    Luas terhitung peta: ~{Math.round(calculatedArea)} m²
                  </Text>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.tagLocationBtn}
                onPress={() => setShowLocationPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.tagLocationBtnIcon}>📍</Text>
                <Text style={styles.tagLocationBtnText}>Tag Lokasi GPS / Batas Peta</Text>
              </TouchableOpacity>
            )}

            <View style={styles.buttonRow}>
              {plot && onDelete ? (
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteButtonText}>Hapus</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  isSaveDisabled && styles.buttonDisabled,
                ]}
                onPress={handleSave}
                disabled={isSaveDisabled || isSaving}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>{isSaving ? 'Menyimpan...' : 'Simpan'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Fullscreen LocationPicker Modal */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <SafeAreaView style={styles.pickerModalContainer}>
          <View style={styles.pickerModalHeader}>
            <View>
              <Text style={styles.pickerModalTitle}>Pilih Lokasi Petak</Text>
              <Text style={styles.pickerModalSubtitle}>Tentukan titik pusat atau batas sawah</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowLocationPicker(false)}
              style={styles.pickerModalCloseBtn}
            >
              <Text style={styles.pickerModalCloseText}>✕ Tutup</Text>
            </TouchableOpacity>
          </View>

          {/* Mode Switcher */}
          <View style={styles.pickerModeRow}>
            <TouchableOpacity
              style={[
                styles.pickerModeChip,
                pickerMode === 'point' && styles.pickerModeChipActive,
              ]}
              onPress={() => setPickerMode('point')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pickerModeChipText,
                  pickerMode === 'point' && styles.pickerModeChipTextActive,
                ]}
              >
                📍 Titik Tunggal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.pickerModeChip,
                pickerMode === 'polygon' && styles.pickerModeChipActive,
              ]}
              onPress={() => setPickerMode('polygon')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pickerModeChipText,
                  pickerMode === 'polygon' && styles.pickerModeChipTextActive,
                ]}
              >
                📐 Batas Poligon
              </Text>
            </TouchableOpacity>
          </View>

          {/* LocationPicker Map View */}
          <View style={styles.pickerBody}>
            <LocationPicker
              mode={pickerMode}
              initialLocation={
                latitude != null && longitude != null ? { latitude, longitude } : undefined
              }
              initialPolygon={parsedPolygon ?? undefined}
              onLocationSelect={(loc, accuracy) => {
                setLocationType('point');
                setLatitude(loc.latitude);
                setLongitude(loc.longitude);
                setLocationAccuracy(accuracy);
                setPolygonCoords(null);
                setCalculatedArea(null);
                setLocationTaggedAt(new Date().toISOString());
                setShowLocationPicker(false);
                Alert.alert(
                  'Lokasi Ditandai ✅',
                  `Koordinat tersimpan: ${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`
                );
              }}
              onPolygonComplete={(poly, area) => {
                setLocationType('polygon');
                setPolygonCoords(JSON.stringify(poly));
                setCalculatedArea(area);
                const avgLat = poly.reduce((s, c) => s + c.latitude, 0) / poly.length;
                const avgLon = poly.reduce((s, c) => s + c.longitude, 0) / poly.length;
                setLatitude(avgLat);
                setLongitude(avgLon);
                setLocationAccuracy(10);
                setLocationTaggedAt(new Date().toISOString());
                setShowLocationPicker(false);

                const roundArea = Math.round(area);
                if (!landSize || parseFloat(landSize) === 0) {
                  setLandSize(roundArea.toString());
                  Alert.alert(
                    'Batas Lahan Tersimpan ✅',
                    `Poligon dengan ${poly.length} titik tersimpan. Luas diisi otomatis: ${roundArea} m²`
                  );
                } else {
                  Alert.alert(
                    'Batas Lahan Tersimpan ✅',
                    `Poligon dengan ${poly.length} titik tersimpan (luas: ${roundArea} m²). Gunakan luas ini untuk ukuran lahan?`,
                    [
                      { text: 'Biarkan Ukuran Lama', style: 'cancel' },
                      { text: 'Gunakan Luas Peta', onPress: () => setLandSize(roundArea.toString()) },
                    ]
                  );
                }
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      padding: SPACING.lg,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      ...SHADOW.lg,
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    title: {
      fontSize: fs.lg,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
    },
    closeText: {
      fontSize: fs.lg,
      color: colors.textLight,
    },
    label: {
      fontSize: fs.xs + 1,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.textSecondary,
      marginBottom: SPACING.xs,
      marginTop: SPACING.sm,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      fontSize: fs.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    noteInput: {
      minHeight: 70,
      textAlignVertical: 'top',
    },
    tagLocationBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.md - 2,
      paddingHorizontal: SPACING.md,
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      gap: SPACING.xs,
    },
    tagLocationBtnIcon: {
      fontSize: 16,
    },
    tagLocationBtnText: {
      fontSize: fs.sm,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.primaryDark,
    },
    locationCard: {
      backgroundColor: colors.background,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    locationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.xs,
    },
    locationTitle: {
      fontSize: fs.sm,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.primaryDark,
    },
    locationActions: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    locationEditBtn: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: colors.secondaryLight,
    },
    locationEditText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.secondary,
    },
    locationRemoveBtn: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: colors.dangerLight,
    },
    locationRemoveText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.danger,
    },
    locationCoords: {
      fontSize: fs.sm,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: colors.text,
      marginTop: 2,
    },
    locationMeta: {
      fontSize: fs.xs,
      color: colors.textLight,
      marginTop: 2,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginTop: SPACING.lg,
    },
    button: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.md - 2,
      borderRadius: BORDER_RADIUS.md,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    saveButtonText: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.textInverse,
    },
    deleteButton: {
      backgroundColor: colors.dangerLight,
    },
    deleteButtonText: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.danger,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    // Picker Fullscreen Modal
    pickerModalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    pickerModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      backgroundColor: colors.surface,
    },
    pickerModalTitle: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
    },
    pickerModalSubtitle: {
      fontSize: fs.xs,
      color: colors.textLight,
    },
    pickerModalCloseBtn: {
      paddingHorizontal: SPACING.sm + 2,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: colors.borderLight,
    },
    pickerModalCloseText: {
      fontSize: fs.sm,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.textSecondary,
    },
    pickerModeRow: {
      flexDirection: 'row',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs + 2,
      gap: SPACING.sm,
      backgroundColor: colors.surface,
    },
    pickerModeChip: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.xs + 2,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pickerModeChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    pickerModeChipText: {
      fontSize: fs.xs + 1,
      fontWeight: FONT_WEIGHT.medium,
      color: colors.textSecondary,
    },
    pickerModeChipTextActive: {
      color: colors.textInverse,
      fontWeight: FONT_WEIGHT.bold,
    },
    pickerBody: {
      flex: 1,
    },
  });
