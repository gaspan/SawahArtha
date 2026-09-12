/**
 * Settings Screen (Tier 4A/4C/4D)
 * - Tampilan: tema, ukuran font
 * - Preferensi: format angka, default musim baru, reset anggaran
 * - Data & Backup: ekspor/impor CSV, backup/restore JSON penuh, Google Drive
 * - Tentang
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  FONT_SCALE_MAP,
  type ThemeColors,
  type ThemeMode,
  type FontScaleLevel,
} from '../src/constants/theme';
import { useTheme, useThemedStyles } from '../src/context/ThemeContext';
import { useSettings } from '../src/context/SettingsContext';
import { useSeason } from '../src/context/SeasonContext';
import { useBudget } from '../src/context/BudgetContext';
import { convertToCSV, exportToCSVFile, importFromCSV } from '../src/utils/csv';
import {
  writeBackupFile,
  restoreFromBackup,
} from '../src/utils/jsonBackup';
import { parseBackupPayload, backupFileName } from '../src/utils/backupCore';
import { resetBudgetsToDefault } from '../src/database/budgetService';
import { sharePdfReport } from '../src/services/pdfService';
import {
  requestNotificationPermission,
  sendTestNotification,
  isNotificationsAvailable,
} from '../src/services/notificationService';
import {
  uploadBackupToAppsScript,
  downloadBackupFromAppsScript,
} from '../src/services/appsScriptService';
import Constants from 'expo-constants';

function SectionHeader({ title }: { title: string }) {
  const styles = useThemedStyles(makeStyles);
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function OptionChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { borderColor: active ? colors.primary : colors.borderLight },
        active && { backgroundColor: colors.primaryLight },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.primaryDark : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Row({
  title,
  subtitle,
  onPress,
  children,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { colors, fs } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { theme, setTheme, fontScale, setFontScale } = useTheme();
  const {
    numberFormat,
    setNumberFormat,
    defaultLandSize,
    setDefaultLandSize,
    defaultRefPrice,
    setDefaultRefPrice,
    lastBackupAt,
    setLastBackupAt,
    notificationsEnabled,
    setNotificationsEnabled,
    farmReminderEnabled,
    setFarmReminderEnabled,
    rendemenRatio,
    setRendemenRatioSetting,
    appsScriptUrl,
    setAppsScriptUrl,
  } = useSettings();
  const { selectedSeason, seasons } = useSeason();
  const { refreshBudgets } = useBudget();

  const [busy, setBusy] = useState('');

  const [promptConfig, setPromptConfig] = useState({
    visible: false,
    title: '',
    message: '',
    defaultValue: '',
    keyboardType: 'default' as 'default' | 'numeric' | 'url',
    onSubmit: (text: string) => {},
  });
  const [promptValue, setPromptValue] = useState('');

  const showPrompt = (
    title: string,
    message: string,
    defaultValue: string,
    keyboardType: 'default' | 'numeric' | 'url',
    onSubmit: (text: string) => void
  ) => {
    setPromptValue(defaultValue);
    setPromptConfig({ visible: true, title, message, defaultValue, keyboardType, onSubmit });
  };



  const seasonObj = seasons.find((s) => s.season_code === selectedSeason);

  const run = async (key: string, fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
    } catch (error: any) {
      Alert.alert('Error ❌', error?.message || 'Terjadi kesalahan.');
    } finally {
      setBusy('');
    }
  };

  const handleExportCSV = () =>
    run('csv', async () => {
      const allExpenses = await db.getAllAsync('SELECT * FROM expenses ORDER BY date DESC, id DESC');
      const allIncome = await db.getAllAsync('SELECT * FROM income ORDER BY date DESC, id DESC');
      const allSales = await db.getAllAsync('SELECT * FROM sales ORDER BY date DESC, id DESC');
      const filePath = await exportToCSVFile(convertToCSV(allExpenses, allIncome, allSales));
      Alert.alert('Ekspor Berhasil ✅', `File CSV disimpan di:\n${filePath}`);
    });

  const handleImportCSV = () =>
    run('csv', async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/comma-separated-values', 'text/csv', 'application/csv'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const fileAsset = result.assets[0];
      Alert.alert(
        'Konfirmasi Impor 📥',
        `Impor data dari "${fileAsset.name}"?\nData duplikat diabaikan otomatis.`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Impor',
            onPress: () =>
              run('csv', async () => {
                const { expensesAdded, incomesAdded } = await importFromCSV(db, fileAsset.uri);
                Alert.alert(
                  'Impor Berhasil ✅',
                  `${expensesAdded} Pengeluaran, ${incomesAdded} Panen/Penjualan baru.`
                );
              }),
          },
        ]
      );
    });

  const handleBackupJSON = () =>
    run('backup', async () => {
      const filePath = await writeBackupFile(db);
      await setLastBackupAt(new Date().toISOString());
      Alert.alert('Backup Berhasil ✅', `Backup JSON penuh disimpan di:\n${filePath}`);
    });

  const handleRestoreJSON = () =>
    run('restore', async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const fileAsset = result.assets[0];
      const content = await FileSystem.readAsStringAsync(fileAsset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      let payload;
      try {
        payload = parseBackupPayload(content);
      } catch (error: any) {
        Alert.alert('Gagal ❌', error?.message || 'Format file tidak valid.');
        return;
      }
      Alert.alert(
        'Konfirmasi Restore 🔄',
        'Kembalikan data dari backup ini?\nData baru akan digabung (duplikat diabaikan).',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Restore',
            onPress: () =>
              run('restore', async () => {
                const counts = await restoreFromBackup(db, payload);
                await refreshBudgets();
                const total = Object.values(counts).reduce((a, b) => a + b, 0);
                Alert.alert('Restore Berhasil ✅', `Berhasil memulihkan ${total} catatan.`);
              }),
          },
        ]
      );
    });

  const handleAppsScriptUpload = () =>
    run('cloud', async () => {
      if (!appsScriptUrl) {
        Alert.alert('Gagal ❌', 'Masukkan URL Web App Google Apps Script terlebih dahulu.');
        return;
      }
      const { buildBackupData } = await import('../src/utils/jsonBackup');
      const payload = await buildBackupData(db);
      await uploadBackupToAppsScript(appsScriptUrl, JSON.stringify(payload));
      await setLastBackupAt(new Date().toISOString());
      Alert.alert('Backup Cloud ✅', 'Backup berhasil diunggah ke Google Apps Script.');
    });

  const handleAppsScriptRestore = () =>
    run('cloud', async () => {
      if (!appsScriptUrl) {
        Alert.alert('Gagal ❌', 'Masukkan URL Web App Google Apps Script terlebih dahulu.');
        return;
      }
      const content = await downloadBackupFromAppsScript(appsScriptUrl);
      let payload;
      try {
        payload = parseBackupPayload(content);
      } catch (error: any) {
        Alert.alert('Gagal ❌', error?.message || 'Format file backup tidak valid.');
        return;
      }
      Alert.alert(
        'Konfirmasi Restore 🔄',
        'Kembalikan data dari backup Cloud ini?',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Restore',
            onPress: () =>
              run('cloud', async () => {
                const counts = await restoreFromBackup(db, payload);
                await refreshBudgets();
                const total = Object.values(counts).reduce((a, b) => a + b, 0);
                Alert.alert('Restore Berhasil ✅', `Berhasil memulihkan ${total} catatan dari Cloud.`);
              }),
          },
        ]
      );
    });

  const handleResetBudget = () =>
    run('reset', async () => {
      if (!seasonObj) return;
      Alert.alert(
        'Reset Anggaran 🔁',
        'Kembalikan anggaran semua kategori ke rasio default?\nPerubahan akan tercatat di log audit.',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Reset',
            onPress: () =>
              run('reset', async () => {
                await resetBudgetsToDefault(db, selectedSeason, seasonObj.land_size_m2 || 0);
                await refreshBudgets();
                Alert.alert('Berhasil ✅', 'Anggaran dikembalikan ke rasio default.');
              }),
          },
        ]
      );
    });

  const handleEditDefaultLandSize = () =>
    showPrompt(
      'Default Luas Lahan',
      'Luas lahan otomatis untuk musim baru (m²)',
      String(defaultLandSize),
      'numeric',
      async (text) => {
        const v = parseFloat(text);
        if (!isNaN(v) && v > 0) await setDefaultLandSize(v);
      }
    );

  const handleEditDefaultRefPrice = () =>
    showPrompt(
      'Default Harga Referensi',
      'Harga jual gabah (Rp/kg) otomatis untuk musim baru',
      String(defaultRefPrice),
      'numeric',
      async (text) => {
        const v = parseFloat(text);
        if (!isNaN(v) && v >= 0) await setDefaultRefPrice(v);
      }
    );

  const handleEditRendemen = () =>
    Alert.prompt?.(
      'Rendemen GKG → Beras',
      'Persen beras hasil giling dari GKG (contoh: 60 untuk 60%).\nNisab zakat = 520 kg beras ÷ rendemen.',
      async (text) => {
        const v = parseFloat(text);
        if (!isNaN(v) && v > 0 && v <= 100) await setRendemenRatioSetting(v / 100);
      },
      'plain-text',
      String(Math.round(rendemenRatio * 100)),
      'numeric'
    ) ??
    Alert.alert('Rendemen GKG → Beras', `Saat ini ${Math.round(rendemenRatio * 100)}%.`);

  const notificationsAvailable = isNotificationsAvailable();

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!notificationsAvailable) {
      Alert.alert(
        'Perlu Development Build 📲',
        'Notifikasi tidak tersedia di Expo Go. Build dengan `eas build -p android --profile development`, lalu coba lagi.'
      );
      return;
    }
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Izin Ditolak ❌',
          'Aktifkan izin notifikasi untuk perangkat ini di Pengaturan Sistem, lalu coba lagi.'
        );
        return;
      }
    }
    await setNotificationsEnabled(enabled);
  };

  const handleTestNotification = () =>
    run('notif', async () => {
      if (!notificationsAvailable) {
        Alert.alert(
          'Perlu Development Build 📲',
          'Fitur notifikasi tidak tersedia di Expo Go. Gunakan development build.'
        );
        return;
      }
      await sendTestNotification();
      Alert.alert('Terjadwal ✅', 'Notifikasi uji akan muncul dalam 5 detik.');
    });

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengaturan</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Tampilan ── */}
        <SectionHeader title="Tampilan" />
        <View style={styles.card}>
          <Row title="Tema">
            <View style={styles.chipRow}>
              {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => (
                <OptionChip
                  key={m}
                  label={m === 'light' ? 'Terang' : m === 'dark' ? 'Gelap' : 'Sistem'}
                  active={theme === m}
                  onPress={() => setTheme(m)}
                />
              ))}
            </View>
          </Row>
          <Row
            title="Ukuran Font"
            subtitle={`Pratinjau: ${fs.md}px`}
          >
            <View style={styles.chipRow}>
              {(Object.keys(FONT_SCALE_MAP) as FontScaleLevel[]).map((l) => (
                <OptionChip
                  key={l}
                  label={l === 'small' ? 'Kecil' : l === 'medium' ? 'Sedang' : 'Besar'}
                  active={fontScale === l}
                  onPress={() => setFontScale(l)}
                />
              ))}
            </View>
          </Row>
        </View>

        {/* ── Preferensi ── */}
        <SectionHeader title="Preferensi" />
        <View style={styles.card}>
          <Row title="Format Angka" subtitle="Pemisah ribuan untuk tampilan Rupiah">
            <View style={styles.chipRow}>
              <OptionChip
                label="1.000.000"
                active={numberFormat === 'dot'}
                onPress={() => setNumberFormat('dot')}
              />
              <OptionChip
                label="1,000,000"
                active={numberFormat === 'comma'}
                onPress={() => setNumberFormat('comma')}
              />
            </View>
          </Row>
          <Row
            title="Default Luas Lahan (Musim Baru)"
            subtitle={`${defaultLandSize} m²`}
            onPress={handleEditDefaultLandSize}
          />
          <Row
            title="Default Harga Referensi (Musim Baru)"
            subtitle={`Rp ${defaultRefPrice}/kg`}
            onPress={handleEditDefaultRefPrice}
          />
          <Row
            title="Rendemen GKG → Beras"
            subtitle={`${Math.round(rendemenRatio * 100)}% → nisab ±${(520 / rendemenRatio).toLocaleString('id-ID', { maximumFractionDigits: 0 })} kg GKG`}
            onPress={handleEditRendemen}
          />
          <Row
            title="Reset Anggaran Default"
            subtitle="Kembalikan semua kategori ke rasio RAB standar"
            onPress={handleResetBudget}
          />
        </View>

        {/* ── Notifikasi ── */}
        <SectionHeader title="Notifikasi" />
        {!notificationsAvailable && (
          <View style={styles.notifNotice}>
            <Text style={styles.notifNoticeText}>
              📲 Notifikasi tidak tersedia di Expo Go. Build development untuk
              mengaktifkan pengingat: <Text style={{ fontWeight: 'bold' }}>eas build -p android --profile development</Text>
            </Text>
          </View>
        )}
        <View style={styles.card}>
          <Row
            title="Pengingat Otomatis"
            subtitle="Jatuh tempo hutang & anggaran terlampaui"
          >
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ true: colors.primary }}
              thumbColor={colors.surface}
            />
          </Row>
          <Row
            title="Pengingat Jadwal Tani"
            subtitle="Harian pukul 07:00 — cek jadwal kegiatan"
          >
            <Switch
              value={farmReminderEnabled}
              onValueChange={setFarmReminderEnabled}
              trackColor={{ true: colors.primary }}
              thumbColor={colors.surface}
            />
          </Row>
          <Row
            title="Kirim Notifikasi Uji"
            subtitle="Verifikasi izin & tampilan notifikasi"
            onPress={handleTestNotification}
          />
        </View>

        {/* ── Data & Backup ── */}
        <SectionHeader title="Data & Backup" />
        <View style={styles.card}>
          <Row
            title="Ekspor CSV"
            subtitle="Pengeluaran, panen & penjualan (backward compat)"
            onPress={handleExportCSV}
          />
          <Row title="Impor CSV" onPress={handleImportCSV} />
          <Row
            title="Backup JSON Penuh"
            subtitle="Semua data: anggaran, hutang, status bayar, dll."
            onPress={handleBackupJSON}
          />
          <Row
            title="Restore Backup JSON"
            subtitle="Gabungkan data dari file backup"
            onPress={handleRestoreJSON}
          />
          <Row
            title="Laporan PDF Musim"
            subtitle={`Ringkasan musim ${selectedSeason} untuk koperasi/bank`}
            onPress={() => run('pdf', async () => {
              await sharePdfReport(db, selectedSeason);
            })}
          />
        </View>

        {/* ── Google Apps Script Backup ── */}
        <SectionHeader title="Backup Cloud (Apps Script)" />
        <View style={styles.card}>
          <Row
            title="URL Google Apps Script"
            subtitle={appsScriptUrl || 'Belum diatur'}
            onPress={() => {
              showPrompt(
                'Apps Script Web App URL',
                'Masukkan URL Web App dari Google Apps Script untuk backup.',
                appsScriptUrl || '',
                'url',
                async (text) => {
                  await setAppsScriptUrl(text.trim());
                }
              );
            }}
          />
          <Row title="Upload Backup ke Cloud" onPress={handleAppsScriptUpload} />
          <Row
            title="Restore Backup dari Cloud"
            subtitle={lastBackupAt ? `Terakhir upload: ${new Date(lastBackupAt).toLocaleString('id-ID')}` : undefined}
            onPress={handleAppsScriptRestore}
          />
        </View>

        {/* ── Tentang ── */}
        <SectionHeader title="Tentang" />
        <View style={styles.card}>
          <Row title="Versi Aplikasi" subtitle={`SawahArtha v${appVersion}`} />
          <Row
            title="Lisensi"
            subtitle="MIT License"
            onPress={() => Linking.openURL('https://github.com/')}
          />
        </View>

        {busy ? (
          <View style={styles.busyRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.busyText}>Memproses...</Text>
          </View>
        ) : null}
        
      <Modal
        visible={promptConfig.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPromptConfig((prev) => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{promptConfig.title}</Text>
            {!!promptConfig.message && (
              <Text style={styles.modalMessage}>{promptConfig.message}</Text>
            )}
            <TextInput
              style={styles.modalInput}
              value={promptValue}
              onChangeText={setPromptValue}
              keyboardType={promptConfig.keyboardType}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setPromptConfig((prev) => ({ ...prev, visible: false }))}
              >
                <Text style={styles.modalBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnSubmit}
                onPress={() => {
                  promptConfig.onSubmit(promptValue);
                  setPromptConfig((prev) => ({ ...prev, visible: false }));
                }}
              >
                <Text style={styles.modalBtnSubmitText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../src/constants/theme').FONT_SIZE) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      paddingTop: SPACING.xl + 24,
      paddingBottom: SPACING.md,
      paddingHorizontal: SPACING.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      ...SHADOW.sm,
    },
    backBtn: {
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: colors.background,
    },
    backBtnText: {
      fontSize: fs.sm,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.primaryDark,
    },
    headerTitle: {
      fontSize: fs.lg,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: SPACING.md,
    },
    sectionHeader: {
      fontSize: fs.xs + 1,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: SPACING.md,
      marginBottom: SPACING.xs,
      marginLeft: SPACING.xs,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      paddingHorizontal: SPACING.md,
      ...SHADOW.md,
      marginBottom: SPACING.sm,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: SPACING.md - 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderLight,
    },
    rowTextWrap: {
      flex: 1,
      paddingRight: SPACING.md,
    },
    rowTitle: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.text,
    },
    rowSubtitle: {
      fontSize: fs.xs,
      color: colors.textLight,
      marginTop: 2,
    },
    chipRow: {
      flexDirection: 'row',
      gap: SPACING.xs,
      flexWrap: 'wrap',
    },
    chip: {
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.sm + 2,
      borderRadius: BORDER_RADIUS.full,
      borderWidth: 1,
    },
    chipText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.semibold,
    },
    driveItem: {
      paddingVertical: SPACING.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderLight,
    },
    driveItemName: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.medium,
      color: colors.text,
    },
    driveItemDate: {
      fontSize: fs.xs,
      color: colors.textLight,
      marginTop: 2,
    },
    warningText: {
      fontSize: fs.xs,
      color: colors.warning,
      paddingVertical: SPACING.md,
    },
    notifNotice: {
      backgroundColor: colors.infoLight,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.sm + 2,
      marginBottom: SPACING.sm,
      marginHorizontal: SPACING.xs,
    },
    notifNoticeText: {
      fontSize: fs.xs,
      color: colors.blueDark,
      lineHeight: 16,
    },
    busyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      paddingVertical: SPACING.md,
    },
    busyText: {
      fontSize: fs.sm,
      color: colors.textSecondary,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.lg,
    },
    modalContent: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      ...SHADOW.lg,
    },
    modalTitle: {
      fontSize: fs.lg,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
      marginBottom: SPACING.xs,
    },
    modalMessage: {
      fontSize: fs.sm,
      color: colors.textSecondary,
      marginBottom: SPACING.md,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.sm,
      fontSize: fs.md,
      color: colors.text,
      marginBottom: SPACING.lg,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: SPACING.sm,
    },
    modalBtnCancel: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
    },
    modalBtnCancelText: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.textSecondary,
    },
    modalBtnSubmit: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      backgroundColor: colors.primary,
      borderRadius: BORDER_RADIUS.md,
    },
    modalBtnSubmitText: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.surface,
    },

  });
