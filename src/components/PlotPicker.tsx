/**
 * PlotPicker - chip pemilih petak lahan (opsional) untuk form
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_WEIGHT,
  type ThemeColors,
} from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import type { Plot } from '../database/plotService';

interface Props {
  plots: Plot[];
  selectedPlotId: number | null;
  onChange: (plotId: number | null) => void;
}

export default function PlotPicker({ plots, selectedPlotId, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (plots.length === 0) return null;

  const items: Array<{ id: number | null; label: string }> = [
    { id: null, label: 'Semua' },
    ...plots.map((p) => ({ id: p.id, label: p.name })),
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Petak Lahan</Text>
      <View style={styles.row}>
        {items.map((item) => {
          const active = selectedPlotId === item.id;
          return (
            <TouchableOpacity
              key={item.id ?? 'all'}
              style={[
                styles.chip,
                { borderColor: active ? colors.primary : colors.borderLight },
                active && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => onChange(item.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? colors.primaryDark : colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
    container: {
      marginBottom: SPACING.sm,
    },
    label: {
      fontSize: fs.xs + 1,
      fontWeight: FONT_WEIGHT.semibold,
      color: colors.textSecondary,
      marginBottom: SPACING.xs,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.xs,
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
  });
