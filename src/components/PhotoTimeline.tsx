import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_WEIGHT, SHADOW, type ThemeColors } from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';

interface DiaryPhoto {
  id: number;
  image_uri: string;
  caption?: string | null;
  farming_stage?: string | null;
  days_since_planting?: number | null;
  taken_at: string;
  plot_name?: string | null;
}

interface PhotoTimelineProps {
  photos: DiaryPhoto[];
  onPhotoPress?: (photo: DiaryPhoto) => void;
  onDeletePhoto?: (photoId: number) => void;
}

const STAGE_CONFIG = {
  planting: { icon: '🌱', color: '#10b981', label: 'Tanam' },
  vegetative: { icon: '🌿', color: '#059669', label: 'Vegetatif' },
  generative: { icon: '🌾', color: '#f59e0b', label: 'Generatif' },
  ripening: { icon: '🟡', color: '#d97706', label: 'Pematangan' },
  harvest: { icon: '✅', color: '#dc2626', label: 'Panen' },
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH - SPACING.lg * 2;

export default function PhotoTimeline({ photos, onPhotoPress, onDeletePhoto }: PhotoTimelineProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📸</Text>
        <Text style={styles.emptyTitle}>Belum Ada Foto</Text>
        <Text style={styles.emptySubtitle}>
          Dokumentasikan progress tanaman Anda dengan foto
        </Text>
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('id-ID', options);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {photos.map((photo, index) => {
        const stage = photo.farming_stage 
          ? STAGE_CONFIG[photo.farming_stage as keyof typeof STAGE_CONFIG] 
          : null;

        return (
          <View key={photo.id} style={styles.photoCard}>
            {/* Timeline connector */}
            {index > 0 && <View style={styles.timelineConnector} />}

            {/* Timeline dot */}
            <View style={[styles.timelineDot, { backgroundColor: stage?.color || colors.primary }]}>
              <Text style={styles.timelineDotIcon}>{stage?.icon || '📷'}</Text>
            </View>

            {/* Photo content */}
            <TouchableOpacity
              style={styles.photoContent}
              onPress={() => onPhotoPress?.(photo)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: photo.image_uri }}
                style={styles.photoImage}
                resizeMode="cover"
              />

              <View style={styles.photoInfo}>
                {/* Stage badge */}
                {stage && (
                  <View style={[styles.stageBadge, { backgroundColor: stage.color + '20', borderColor: stage.color }]}>
                    <Text style={[styles.stageBadgeText, { color: stage.color }]}>
                      {stage.icon} {stage.label}
                      {photo.days_since_planting !== null && photo.days_since_planting !== undefined && (
                        <Text> • Hari {photo.days_since_planting}</Text>
                      )}
                    </Text>
                  </View>
                )}

                {/* Caption */}
                {photo.caption && (
                  <Text style={styles.caption}>{photo.caption}</Text>
                )}

                {/* Metadata */}
                <View style={styles.metadata}>
                  <Text style={styles.metadataText}>
                    📅 {formatDate(photo.taken_at)}
                  </Text>
                  {photo.plot_name && (
                    <Text style={styles.metadataText}>
                      📍 {photo.plot_name}
                    </Text>
                  )}
                </View>

                {/* Delete button */}
                {onDeletePhoto && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      onDeletePhoto(photo.id);
                    }}
                  >
                    <Text style={styles.deleteButtonText}>🗑️ Hapus</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xl,
      minHeight: 300,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: SPACING.md,
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
    photoCard: {
      position: 'relative',
      marginBottom: SPACING.xl,
      paddingLeft: SPACING.xl,
    },
    timelineConnector: {
      position: 'absolute',
      left: 19,
      top: -SPACING.xl,
      width: 2,
      height: SPACING.xl,
      backgroundColor: colors.border,
    },
    timelineDot: {
      position: 'absolute',
      left: 0,
      top: SPACING.sm,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.background,
      ...SHADOW.sm,
    },
    timelineDotIcon: {
      fontSize: 20,
    },
    photoContent: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      overflow: 'hidden',
      ...SHADOW.md,
    },
    photoImage: {
      width: '100%',
      height: IMAGE_SIZE,
      backgroundColor: colors.border,
    },
    photoInfo: {
      padding: SPACING.md,
    },
    stageBadge: {
      alignSelf: 'flex-start',
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
      borderWidth: 1,
      marginBottom: SPACING.sm,
    },
    stageBadgeText: {
      fontSize: 13,
      fontWeight: FONT_WEIGHT.semibold,
    },
    caption: {
      fontSize: 15,
      color: colors.text,
      marginBottom: SPACING.sm,
      lineHeight: 22,
    },
    metadata: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
    },
    metadataText: {
      fontSize: 12,
      color: colors.textLight,
    },
    deleteButton: {
      marginTop: SPACING.sm,
      alignSelf: 'flex-start',
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      backgroundColor: colors.dangerLight,
      borderRadius: BORDER_RADIUS.sm,
    },
    deleteButtonText: {
      fontSize: 13,
      color: colors.danger,
      fontWeight: FONT_WEIGHT.medium,
    },
  });
