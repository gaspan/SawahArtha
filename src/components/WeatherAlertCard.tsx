/**
 * WeatherAlertCard - Rekomendasi pintar pertanian berbasis cuaca
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  SHADOW,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import type { AlertPriority } from '../utils/weatherAlerts';

export interface WeatherAlertItem {
  title: string;
  message: string;
  priority: AlertPriority | string;
}

interface Props {
  alerts: WeatherAlertItem[];
  onDismiss?: (index: number) => void;
}

function getPriorityMeta(priority: string, colors: ThemeColors) {
  if (priority === 'high') {
    return {
      bg: colors.dangerLight,
      border: colors.danger,
      text: colors.danger,
      badge: 'Prioritas Tinggi',
      badgeBg: 'rgba(239, 68, 68, 0.15)',
    };
  }
  if (priority === 'medium') {
    return {
      bg: colors.warningLight,
      border: colors.warning,
      text: colors.warning,
      badge: 'Perhatian Tani',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
    };
  }
  return {
    bg: colors.successLight,
    border: colors.success,
    text: colors.success,
    badge: 'Kondisi Optimal',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
  };
}

export default function WeatherAlertCard({ alerts, onDismiss }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (alerts.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleGroup}>
          <Text style={styles.cardIcon}>🌾</Text>
          <Text style={styles.cardTitle}>Rekomendasi Tani Cerdas</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{alerts.length} Saran</Text>
        </View>
      </View>

      <View style={styles.list}>
        {alerts.map((a, i) => {
          const meta = getPriorityMeta(a.priority, colors);
          return (
            <View
              key={`${a.title}-${i}`}
              style={[
                styles.item,
                {
                  backgroundColor: meta.bg,
                  borderLeftColor: meta.border,
                },
              ]}
            >
              <View style={styles.itemTopRow}>
                <View style={styles.itemTitleWrapper}>
                  <Text style={[styles.itemTitle, { color: meta.text }]}>
                    {a.title}
                  </Text>
                  <View style={[styles.priorityBadge, { backgroundColor: meta.badgeBg }]}>
                    <Text style={[styles.priorityBadgeText, { color: meta.text }]}>
                      {meta.badge}
                    </Text>
                  </View>
                </View>

                {onDismiss ? (
                  <TouchableOpacity
                    onPress={() => onDismiss(i)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.dismissBtn}
                  >
                    <Text style={styles.dismissText}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <Text style={styles.itemMessage}>{a.message}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      ...SHADOW.md,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm + 2,
    },
    cardTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    cardIcon: {
      fontSize: 18,
    },
    cardTitle: {
      fontSize: fs.md,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.text,
    },
    countBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 3,
      borderRadius: BORDER_RADIUS.full,
    },
    countBadgeText: {
      fontSize: 11,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.primaryDark,
    },
    list: {
      gap: SPACING.sm,
    },
    item: {
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.sm + 2,
      borderLeftWidth: 4,
    },
    itemTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    itemTitleWrapper: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    itemTitle: {
      fontSize: fs.sm,
      fontWeight: FONT_WEIGHT.bold,
    },
    priorityBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: BORDER_RADIUS.full,
    },
    priorityBadgeText: {
      fontSize: 10,
      fontWeight: FONT_WEIGHT.bold,
    },
    dismissBtn: {
      padding: 2,
      marginLeft: SPACING.xs,
    },
    dismissText: {
      fontSize: fs.sm,
      color: colors.textLight,
      fontWeight: FONT_WEIGHT.bold,
    },
    itemMessage: {
      fontSize: fs.xs + 0.5,
      color: colors.text,
      lineHeight: 18,
      opacity: 0.9,
    },
  });
