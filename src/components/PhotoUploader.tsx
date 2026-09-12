import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { SPACING, BORDER_RADIUS, FONT_WEIGHT, SHADOW, type ThemeColors } from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';

interface PhotoUploaderProps {
  onPhotoSelected: (uri: string, fileSize: number) => void;
  maxSizeMB?: number;
  quality?: number;
}

export default function PhotoUploader({ 
  onPhotoSelected, 
  maxSizeMB = 5,
  quality = 0.7 
}: PhotoUploaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [loading, setLoading] = useState(false);

  const handleSelectPhoto = useCallback(() => {
    Alert.alert(
      'Tambah Foto',
      'Pilih sumber foto',
      [
        {
          text: 'Kamera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                'Izin Kamera Diperlukan',
                'Aplikasi memerlukan akses kamera untuk mengambil foto.',
              );
              return;
            }

            setLoading(true);
            try {
              const result = await ImagePicker.launchCameraAsync({
                quality,
                allowsEditing: false,
                exif: false,
              });

              if (!result.canceled && result.assets[0]) {
                await processPhoto(result.assets[0].uri);
              }
            } catch (error) {
              Alert.alert('Error', 'Gagal mengambil foto dari kamera.');
            } finally {
              setLoading(false);
            }
          },
        },
        {
          text: 'Galeri',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(
                'Izin Galeri Diperlukan',
                'Aplikasi memerlukan akses galeri untuk memilih foto.',
              );
              return;
            }

            setLoading(true);
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality,
                allowsEditing: false,
              });

              if (!result.canceled && result.assets[0]) {
                await processPhoto(result.assets[0].uri);
              }
            } catch (error) {
              Alert.alert('Error', 'Gagal memilih foto dari galeri.');
            } finally {
              setLoading(false);
            }
          },
        },
        { text: 'Batal', style: 'cancel' },
      ],
    );
  }, [quality]);

  const processPhoto = async (uri: string) => {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists) {
        Alert.alert('Error', 'File foto tidak ditemukan.');
        return;
      }

      const fileSizeBytes = fileInfo.size || 0;
      const fileSizeMB = fileSizeBytes / (1024 * 1024);

      if (fileSizeMB > maxSizeMB) {
        Alert.alert(
          'File Terlalu Besar',
          `Ukuran foto ${fileSizeMB.toFixed(1)} MB melebihi batas ${maxSizeMB} MB. Gunakan foto dengan ukuran lebih kecil.`,
        );
        return;
      }

      // Save to app directory
      const fileName = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
      const destDir = FileSystem.documentDirectory + 'diary_photos/';
      
      // Create directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(destDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
      }

      const destPath = destDir + fileName;
      await FileSystem.copyAsync({ from: uri, to: destPath });

      onPhotoSelected(destPath, fileSizeBytes);
    } catch (error) {
      Alert.alert('Error', 'Gagal memproses foto.');
      console.error('Photo processing error:', error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.uploadButton}
      onPress={handleSelectPhoto}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.background} />
      ) : (
        <>
          <Text style={styles.uploadIcon}>📷</Text>
          <Text style={styles.uploadText}>Tambah Foto</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      ...SHADOW.sm,
    },
    uploadIcon: {
      fontSize: 20,
      marginRight: SPACING.xs,
    },
    uploadText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: FONT_WEIGHT.semibold,
    },
  });
