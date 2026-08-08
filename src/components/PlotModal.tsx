/**
 * PlotModal - Tambah / edit petak lahan (multi-lahan)
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
} from 'react-native';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import type { Plot } from '../database/plotService';

interface Props {
  visible: boolean;
  plot: Plot | null;
  onSave: (input: { name: string; landSizeM2: number; note?: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

export default function PlotModal({ visible, plot, onSave, onDelete, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [name, setName] = useState('');
  const [landSize, setLandSize] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      setName('');
      setLandSize('');
      setNote('');
      setIsSaving(false);
    } else if (plot) {
      setName(plot.name);
      setLandSize(plot.land_size_m2 > 0 ? String(plot.land_size_m2) : '');
      setNote(plot.note ?? '');
    } else {
      setName('');
      setLandSize('');
      setNote('');
    }
  }, [visible, plot]);

  const isSaveDisabled = name.trim().length === 0 || isNaN(parseFloat(landSize)) || parseFloat(landSize) <= 0;

  const handleSave = async () => {
    if (isSaveDisabled || isSaving) return;
    setIsSaving(true);
    try {
      await onSave({ name: name.trim(), landSizeM2: parseFloat(landSize), note: note.trim() || undefined });
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

  return (
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
      maxHeight: '85%',
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
  });
