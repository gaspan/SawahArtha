import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSQLiteContext } from 'expo-sqlite';
import { SPACING, BORDER_RADIUS, FONT_WEIGHT, SHADOW, type ThemeColors } from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { getWeather, getWeatherEmoji, type WeatherData } from '../services/weatherService';

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
  onPress?: () => void;
  onWeatherLoaded?: (data: WeatherData) => void;
}

function getWeatherGradient(icon: string): [string, string, string] {
  // Rain / Thunderstorm
  if (icon.startsWith('09') || icon.startsWith('10') || icon.startsWith('11')) {
    return ['#1E293B', '#1E3A8A', '#0F766E'];
  }
  // Clear / Few Clouds
  if (icon.startsWith('01') || icon.startsWith('02')) {
    return ['#0284C7', '#0369A1', '#047857'];
  }
  // Clouds / Mist
  if (icon.startsWith('03') || icon.startsWith('04') || icon.startsWith('50')) {
    return ['#334155', '#0F766E', '#065F46'];
  }
  return ['#065F46', '#047857', '#0284C7'];
}

function getWindRecommendation(speedMs: number): { label: string; safe: boolean } {
  if (speedMs < 5) return { label: 'Aman Semprot', safe: true };
  if (speedMs <= 8) return { label: 'Waspada Angin', safe: true };
  return { label: 'Tunda Semprot', safe: false };
}

function getHumidityRecommendation(humidity: number): string {
  if (humidity > 85) return 'Lembap Tinggi';
  if (humidity >= 60) return 'Optimal';
  return 'Kering';
}

function formatDayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Hari ini';
  if (index === 1) return 'Besok';
  try {
    const d = new Date(dateStr);
    const day = d.toLocaleDateString('id-ID', { weekday: 'short' });
    return day.charAt(0).toUpperCase() + day.slice(1);
  } catch {
    return dateStr;
  }
}

export default function WeatherWidget({
  latitude,
  longitude,
  onPress,
  onWeatherLoaded,
}: WeatherWidgetProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const db = useSQLiteContext();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeather();
  }, [latitude, longitude]);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getWeather(db, latitude, longitude);
      setWeather(data);
      onWeatherLoaded?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat cuaca');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Memuat prakiraan cuaca sawah...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <TouchableOpacity style={styles.errorContainer} onPress={fetchWeather} activeOpacity={0.8}>
        <Text style={styles.errorIcon}>🌤️</Text>
        <Text style={styles.errorTitle}>Prakiraan Cuaca</Text>
        <Text style={styles.errorText}>{error}</Text>
        <View style={styles.retryBadge}>
          <Text style={styles.retryBadgeText}>🔄 Ketuk untuk coba lagi</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (!weather) return null;

  const { current, forecast } = weather;
  const gradientColors = getWeatherGradient(current.icon);
  const windRec = getWindRecommendation(current.wind_speed);
  const humidityRec = getHumidityRecommendation(current.humidity);
  const fiveDays = forecast.slice(0, 5);

  return (
    <TouchableOpacity
      style={styles.wrapper}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.locationContainer}>
            <Text style={styles.locationPin}>📍</Text>
            <Text style={styles.locationText}>Lahan Sawah</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Terkini</Text>
            </View>
          </View>
          <View style={styles.detailLink}>
            <Text style={styles.detailLinkText}>Detail 5 Hari →</Text>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroLeft}>
            <View style={styles.tempRow}>
              <Text style={styles.tempMain}>{Math.round(current.temp)}</Text>
              <Text style={styles.tempUnit}>°C</Text>
            </View>
            <Text style={styles.description}>{current.description}</Text>
            <View style={styles.tempRangePill}>
              <Text style={styles.tempRangeText}>
                ↓ {Math.round(current.temp_min)}° · ↑ {Math.round(current.temp_max)}° · Terasa {Math.round(current.feels_like)}°
              </Text>
            </View>
          </View>

          <View style={styles.heroRight}>
            <View style={styles.iconCircle}>
              <Text style={styles.heroIcon}>{getWeatherEmoji(current.icon)}</Text>
            </View>
          </View>
        </View>

        {/* Farming Metrics Matrix (Glass Pills) */}
        <View style={styles.matrixRow}>
          {/* Kelembapan */}
          <View style={styles.glassPill}>
            <Text style={styles.glassPillIcon}>💧</Text>
            <View style={styles.glassPillContent}>
              <Text style={styles.glassPillLabel}>Kelembapan</Text>
              <Text style={styles.glassPillValue}>{current.humidity}%</Text>
              <Text style={styles.glassPillSub}>{humidityRec}</Text>
            </View>
          </View>

          {/* Kecepatan Angin & Rekomendasi Semprot */}
          <View style={styles.glassPill}>
            <Text style={styles.glassPillIcon}>💨</Text>
            <View style={styles.glassPillContent}>
              <Text style={styles.glassPillLabel}>Angin</Text>
              <Text style={styles.glassPillValue}>{current.wind_speed} m/s</Text>
              <Text style={[styles.glassPillSub, !windRec.safe && styles.glassPillSubWarn]}>
                {windRec.label}
              </Text>
            </View>
          </View>

          {/* Curah Hujan / Peluang */}
          <View style={styles.glassPill}>
            <Text style={styles.glassPillIcon}>🌧️</Text>
            <View style={styles.glassPillContent}>
              <Text style={styles.glassPillLabel}>Curah Hujan</Text>
              <Text style={styles.glassPillValue}>
                {current.rain_1h && current.rain_1h > 0
                  ? `${current.rain_1h} mm`
                  : `${current.rain_probability ?? 0}%`}
              </Text>
              <Text style={styles.glassPillSub}>
                {current.rain_1h && current.rain_1h > 0 ? 'Sedang Turun' : 'Peluang'}
              </Text>
            </View>
          </View>
        </View>

        {/* 5-Day Mini Forecast Strip */}
        {fiveDays.length > 0 && (
          <View style={styles.forecastStrip}>
            <View style={styles.forecastHeader}>
              <Text style={styles.forecastHeaderTitle}>Prakiraan Harian</Text>
            </View>
            <View style={styles.forecastRow}>
              {fiveDays.map((day, idx) => (
                <View key={day.date || idx} style={styles.forecastDayCard}>
                  <Text style={styles.forecastDayLabel}>{formatDayLabel(day.date, idx)}</Text>
                  <Text style={styles.forecastDayIcon}>{getWeatherEmoji(day.icon)}</Text>
                  <Text style={styles.forecastDayTemp}>
                    {Math.round(day.temp_max)}°
                  </Text>
                  {day.rain_probability > 30 ? (
                    <View style={styles.forecastRainPill}>
                      <Text style={styles.forecastRainText}>{day.rain_probability}%</Text>
                    </View>
                  ) : (
                    <Text style={styles.forecastDayMin}>{Math.round(day.temp_min)}°</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: SPACING.md,
      borderRadius: BORDER_RADIUS.xl,
      ...SHADOW.md,
    },
    gradientCard: {
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.md + 2,
      overflow: 'hidden',
    },
    loadingContainer: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.md,
      ...SHADOW.sm,
      gap: SPACING.xs,
    },
    loadingText: {
      fontSize: fs.sm,
      color: colors.textSecondary,
      fontWeight: FONT_WEIGHT.medium,
    },
    errorContainer: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md + 4,
      alignItems: 'center',
      marginBottom: SPACING.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      ...SHADOW.sm,
    },
    errorIcon: {
      fontSize: 36,
      marginBottom: SPACING.xs,
    },
    errorTitle: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
      marginBottom: 2,
    },
    errorText: {
      fontSize: fs.xs,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: SPACING.sm,
    },
    retryBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      borderRadius: BORDER_RADIUS.full,
    },
    retryBadgeText: {
      fontSize: fs.xs,
      color: colors.primaryDark,
      fontWeight: FONT_WEIGHT.bold,
    },

    // Top Header
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    locationPin: {
      fontSize: 14,
    },
    locationText: {
      fontSize: fs.xs + 1,
      fontWeight: FONT_WEIGHT.bold,
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.full,
      gap: 4,
      marginLeft: 4,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#4ADE80',
    },
    liveText: {
      fontSize: 10,
      fontWeight: FONT_WEIGHT.bold,
      color: '#FFFFFF',
    },
    detailLink: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      paddingHorizontal: SPACING.sm,
      paddingVertical: 3,
      borderRadius: BORDER_RADIUS.full,
    },
    detailLinkText: {
      fontSize: 11,
      color: '#FFFFFF',
      fontWeight: FONT_WEIGHT.semibold,
    },

    // Hero Section
    heroSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    heroLeft: {
      flex: 1,
    },
    tempRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    tempMain: {
      fontSize: 52,
      fontWeight: FONT_WEIGHT.bold,
      color: '#FFFFFF',
      lineHeight: 58,
      letterSpacing: -1,
    },
    tempUnit: {
      fontSize: 24,
      fontWeight: FONT_WEIGHT.bold,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 6,
      marginLeft: 2,
    },
    description: {
      fontSize: fs.md,
      color: '#FFFFFF',
      fontWeight: FONT_WEIGHT.semibold,
      textTransform: 'capitalize',
      marginTop: 2,
    },
    tempRangePill: {
      marginTop: 6,
      alignSelf: 'flex-start',
    },
    tempRangeText: {
      fontSize: fs.xs,
      color: 'rgba(255, 255, 255, 0.85)',
      fontWeight: FONT_WEIGHT.medium,
    },
    heroRight: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconCircle: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    heroIcon: {
      fontSize: 44,
    },

    // Matrix
    matrixRow: {
      flexDirection: 'row',
      gap: SPACING.xs + 2,
      marginBottom: SPACING.md,
    },
    glassPill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      borderRadius: BORDER_RADIUS.md,
      paddingVertical: SPACING.xs + 2,
      paddingHorizontal: SPACING.xs + 3,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.22)',
      gap: 6,
    },
    glassPillIcon: {
      fontSize: 18,
    },
    glassPillContent: {
      flex: 1,
    },
    glassPillLabel: {
      fontSize: 10,
      color: 'rgba(255, 255, 255, 0.75)',
      fontWeight: FONT_WEIGHT.medium,
    },
    glassPillValue: {
      fontSize: fs.xs + 1,
      fontWeight: FONT_WEIGHT.bold,
      color: '#FFFFFF',
      marginTop: 1,
    },
    glassPillSub: {
      fontSize: 9,
      color: '#E0F2FE',
      fontWeight: FONT_WEIGHT.semibold,
      marginTop: 1,
    },
    glassPillSubWarn: {
      color: '#FDE047',
    },

    // 5-Day Strip
    forecastStrip: {
      backgroundColor: 'rgba(0, 0, 0, 0.18)',
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.sm,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    forecastHeader: {
      marginBottom: SPACING.xs,
    },
    forecastHeaderTitle: {
      fontSize: 11,
      fontWeight: FONT_WEIGHT.bold,
      color: 'rgba(255, 255, 255, 0.85)',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    forecastRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    forecastDayCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 2,
    },
    forecastDayLabel: {
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.85)',
      fontWeight: FONT_WEIGHT.medium,
      marginBottom: 2,
    },
    forecastDayIcon: {
      fontSize: 22,
      marginVertical: 2,
    },
    forecastDayTemp: {
      fontSize: 12,
      fontWeight: FONT_WEIGHT.bold,
      color: '#FFFFFF',
    },
    forecastDayMin: {
      fontSize: 10,
      color: 'rgba(255, 255, 255, 0.65)',
      marginTop: 1,
    },
    forecastRainPill: {
      backgroundColor: 'rgba(56, 189, 248, 0.3)',
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: BORDER_RADIUS.full,
      marginTop: 2,
    },
    forecastRainText: {
      fontSize: 9,
      color: '#BAE6FD',
      fontWeight: FONT_WEIGHT.bold,
    },
  });
