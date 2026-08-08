/**
 * Jurnal Kegiatan Tani - catat tanam/pupuk/semprot/panen dengan tanggal
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  type ThemeColors,
} from '../../src/constants/theme';
import { useTheme, useThemedStyles } from '../../src/context/ThemeContext';
import { useActivities, type ActivityType } from '../../src/hooks/useActivities';
import { usePlots } from '../../src/hooks/usePlots';
import { ACTIVITY_TYPES } from '../../src/database/activityService';
import PlotPicker from '../../src/components/PlotPicker';
import { formatDate } from '../../src/utils/dateUtil';

export default function JournalScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { activities, isLoading, addActivity, deleteActivity, refreshActivities } = useActivities();
  const { plots } = usePlots();

  const [filter, setFilter] = useState<ActivityType | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ActivityType>('Tanam');
  const [note, setNote] = useState('');
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);
  const [expandedForm, setExpandedForm] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshActivities();
    }, [refreshActivities])
  );

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Kegiatan wajib diisi ✍️', 'Tuliskan nama kegiatan (mis. Tanam bibit di sawah utara).');
      return;
    }
    await addActivity({
      activityType: type,
      title: title.trim(),
      date: new Date().toISOString().split('T')[0],
      plotId: selectedPlotId,
      note: note.trim() || undefined,
    });
    setTitle('');
    setNote('');
    setSelectedPlotId(null);
    setExpandedForm(false);
    Alert.alert('✅ Tercatat', 'Kegiatan berhasil dicatat di jurnal.');
  };

  const handleDelete = (id: number, titleName: string) => {
    Alert.alert(
      'Hapus Kegiatan 🗑️',
      `Hapus "${titleName}" dari jurnal?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await deleteActivity(id);
          },
        },
      ]
    );
  };

  const filtered = filter
    ? activities.filter((a) => a.activity_type === filter)
    : activities;

  const today = new Date().toISOString().split('T')[0];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>📔</Text>
        <View>
          <Text style={styles.headerTitle}>Jurnal Kegiatan Tani</Text>
          <Text style={styles.headerSubtitle}>Tanam · Pupuk · Semprot · Panen</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[styles.filterChip, filter === null && styles.filterChipActive]}
            onPress={() => setFilter(null)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filter === null && { color: colors.primaryDark }]}>
              Semua
            </Text>
          </TouchableOpacity>
          {ACTIVITY_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.filterChip, filter === t && styles.filterChipActive]}
              onPress={() => setFilter(filter === t ? null : t)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filter === t && { color: colors.primaryDark }]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Add form toggle */}
        <TouchableOpacity
          style={styles.addCard}
          onPress={() => setExpandedForm(!expandedForm)}
          activeOpacity={0.7}
        >
          <Text style={styles.addCardText}>
            {expandedForm ? '✕ Tutup Form' : '+ Catat Kegiatan Baru'}
          </Text>
        </TouchableOpacity>

        {expandedForm && (
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Jenis Kegiatan</Text>
            <View style={styles.typeRow}>
              {ACTIVITY_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeChip,
                    type === t && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                  ]}
                  onPress={() => setType(t)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      type === t && { color: colors.primaryDark },
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Kegiatan *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Tanam bibit, Pemupukan urea, Penyemprotan hama"
              placeholderTextColor={colors.textLight}
              maxLength={80}
            />

            <PlotPicker plots={plots} selectedPlotId={selectedPlotId} onChange={setSelectedPlotId} />

            <Text style={styles.formLabel}>Catatan</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder="Opsional — dosis, luas, kondisi lahan, dll."
              placeholderTextColor={colors.textLight}
              multiline
              maxLength={300}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>💾 Simpan Kegiatan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Memuat jurnal...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Belum ada kegiatan tercatat.</Text>
            <Text style={styles.emptySubText}>
              {filter ? `Tidak ada kegiatan "${filter}".` : 'Tekan "+ Catat Kegiatan Baru" untuk memulai.'}
            </Text>
          </View>
        ) : (
          filtered.map((a) => {
            const plot = plots.find((p) => p.id === a.plot_id);
            const isToday = a.date === today;
            return (
              <View key={a.id} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Text style={[styles.typeBadgeText, { color: colors.primaryDark }]}>
                      {a.activity_type}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(a.id, a.title)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.activityTitle}>{a.title}</Text>
                <View style={styles.activityMeta}>
                  <Text style={styles.activityDate}>
                    {isToday ? 'Hari ini' : formatDate(a.date)}
                  </Text>
                  {plot ? <Text style={styles.activityPlot}>🌱 {plot.name}</Text> : null}
                </View>
                {a.note ? <Text style={styles.activityNote}>{a.note}</Text> : null}
              </View>
            );
          })
        )}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../../src/constants/theme').FONT_SIZE) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      backgroundColor: colors.primary,
      paddingTop: 56,
      paddingBottom: SPACING.lg,
      paddingHorizontal: SPACING.lg,
      borderBottomLeftRadius: BORDER_RADIUS.xl,
      borderBottomRightRadius: BORDER_RADIUS.xl,
      ...SHADOW.lg,
    },
    headerEmoji: {
      fontSize: 36,
    },
    headerTitle: {
      fontSize: fs.xxl,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.textInverse,
    },
    headerSubtitle: {
      fontSize: fs.sm,
      color: colors.primaryMuted,
      marginTop: 2,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: SPACING.md,
    },
    filterScroll: {
      marginBottom: SPACING.sm,
    },
    filterRow: {
      gap: SPACING.xs,
      paddingVertical: SPACING.xs,
    },
    filterChip: {
      paddingVertical: SPACING.xs + 2,
      paddingHorizontal: SPACING.sm + 4,
      borderRadius: BORDER_RADIUS.full,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.surface,
    },
    filterChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    filterChipText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.textSecondary,
    },
    addCard: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.sm + 2,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      marginBottom: SPACING.md,
    },
    addCardText: {
      fontSize: fs.sm,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.primaryDark,
    },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      ...SHADOW.md,
    },
    formLabel: {
      fontSize: fs.xs + 1,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.textSecondary,
      marginBottom: SPACING.xs,
      marginTop: SPACING.sm,
    },
    typeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.xs,
    },
    typeChip: {
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm + 2,
      borderRadius: BORDER_RADIUS.full,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.surface,
    },
    typeChipText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.textSecondary,
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
      minHeight: 60,
      textAlignVertical: 'top',
    },
    submitButton: {
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.md - 2,
      borderRadius: BORDER_RADIUS.md,
      marginTop: SPACING.md,
    },
    submitButtonText: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.textInverse,
    },
    loadingContainer: {
      paddingVertical: SPACING.xxl,
      alignItems: 'center',
      gap: SPACING.sm,
    },
    loadingText: {
      fontSize: fs.sm,
      color: colors.textSecondary,
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      alignItems: 'center',
      ...SHADOW.sm,
    },
    emptyText: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.text,
    },
    emptySubText: {
      fontSize: fs.xs,
      color: colors.textLight,
      marginTop: SPACING.xs,
      textAlign: 'center',
    },
    activityCard: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      ...SHADOW.md,
    },
    activityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.xs,
    },
    typeBadge: {
      paddingVertical: 2,
      paddingHorizontal: SPACING.sm,
      borderRadius: BORDER_RADIUS.full,
    },
    typeBadgeText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.bold,
    },
    deleteText: {
      fontSize: fs.sm,
    },
    activityTitle: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.text,
    },
    activityMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginTop: SPACING.xs,
    },
    activityDate: {
      fontSize: fs.xs,
      color: colors.textLight,
    },
    activityPlot: {
      fontSize: fs.xs,
      color: colors.primaryDark,
      fontWeight: FONT_WEIGHT.medium,
    },
    activityNote: {
      fontSize: fs.xs,
      color: colors.textSecondary,
      marginTop: SPACING.xs,
      lineHeight: 16,
    },
  });
