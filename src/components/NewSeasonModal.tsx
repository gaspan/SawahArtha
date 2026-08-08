/**
 * NewSeasonModal - Create New Farming Season
 *
 * A premium modal dialog for entering a new season code.
 * Features a semi-transparent dark backdrop, centered white card,
 * TextInput with placeholder, and dual action buttons.
 * The 'Simpan' button is disabled when the input is empty.
 * Uses fade animation for smooth open/close transitions.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (seasonCode: string, landSizeM2: number) => void;
}

const NewSeasonModal: React.FC<Props> = ({ visible, onClose, onSave }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { defaultLandSize } = useSettings();

  const [seasonCode, setSeasonCode] = useState('');
  const [landSize, setLandSize] = useState('');

  // Reset inputs when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setSeasonCode('');
      setLandSize('');
    } else {
      setLandSize(defaultLandSize > 0 ? String(defaultLandSize) : '');
    }
  }, [visible, defaultLandSize]);

  const handleSave = () => {
    const trimmedCode = seasonCode.trim();
    const parsedSize = parseFloat(landSize);
    if (trimmedCode.length > 0 && !isNaN(parsedSize) && parsedSize > 0) {
      onSave(trimmedCode, parsedSize);
      setSeasonCode('');
      setLandSize('');
    }
  };

  const isSaveDisabled =
    seasonCode.trim().length === 0 ||
    isNaN(parseFloat(landSize)) ||
    parseFloat(landSize) <= 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Card */}
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🌾</Text>
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>Mulai Musim Tanam Baru</Text>
          <Text style={styles.subtitle}>Masukkan rincian musim baru</Text>

          {/* TextInput Kode Musim */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Kode Musim Tanam</Text>
            <TextInput
              style={styles.input}
              value={seasonCode}
              onChangeText={setSeasonCode}
              placeholder="e.g., MT-2026-2"
              placeholderTextColor={colors.textLight}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={20}
              returnKeyType="next"
            />
          </View>

          {/* TextInput Luas Lahan */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Luas Lahan (m²)</Text>
            <TextInput
              style={styles.input}
              value={landSize}
              onChangeText={(text) => setLandSize(text.replace(/[^0-9.]/g, ''))}
              placeholder="e.g., 1400"
              placeholderTextColor={colors.textLight}
              keyboardType="decimal-pad"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

          {/* Helper Text */}
          <Text style={styles.helperText}>
            Luas lahan digunakan untuk menghitung produktivitas pertanian Anda.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {/* Batal Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>

            {/* Simpan Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                isSaveDisabled && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={isSaveDisabled}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  isSaveDisabled && styles.saveButtonTextDisabled,
                ]}
              >
                Simpan
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    width: '85%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOW.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: fs.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.normal,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    width: '100%',
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    alignSelf: 'flex-start',
    paddingLeft: 4,
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: fs.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.text,
    backgroundColor: colors.background,
    textAlign: 'center',
    letterSpacing: 1,
  },
  helperText: {
    fontSize: fs.xs,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  saveButtonDisabled: {
    backgroundColor: colors.primaryMuted,
    ...SHADOW.sm,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: fs.md,
    fontWeight: FONT_WEIGHT.bold,
    color: colors.textInverse,
  },
  saveButtonTextDisabled: {
    color: colors.surface,
    opacity: 0.7,
  },
});

export default NewSeasonModal;
