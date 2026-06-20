/**
 * SeasonPicker - Season Selector Dropdown
 *
 * A premium dropdown picker for selecting farming seasons on the Dashboard.
 * Shows the current season_code in a styled button with a chevron indicator.
 * When tapped, displays an absolutely-positioned overlay with all seasons
 * and a '+ Mulai Musim Tanam Baru' action button at the bottom.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SHADOW,
} from '../constants/theme';

interface Props {
  selectedSeason: string;
  seasons: Array<{ id: number; season_code: string; is_active: number }>;
  onSelectSeason: (seasonCode: string) => void;
  onNewSeason: () => void;
}

const SeasonPicker: React.FC<Props> = ({
  selectedSeason,
  seasons,
  onSelectSeason,
  onNewSeason,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelectSeason = useCallback(
    (seasonCode: string) => {
      onSelectSeason(seasonCode);
      setIsOpen(false);
    },
    [onSelectSeason]
  );

  const handleNewSeason = useCallback(() => {
    setIsOpen(false);
    onNewSeason();
  }, [onNewSeason]);

  const handleBackdropPress = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <View style={styles.container}>
      {/* Trigger Button */}
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <View style={styles.triggerContent}>
          <View style={styles.seasonIndicator} />
          <View style={styles.triggerTextContainer}>
            <Text style={styles.triggerLabel}>Musim Tanam</Text>
            <Text style={styles.triggerValue}>{selectedSeason}</Text>
          </View>
        </View>
        <Text style={styles.chevron}>{isOpen ? '▴' : '▾'}</Text>
      </TouchableOpacity>

      {/* Dropdown Overlay */}
      {isOpen && (
        <>
          {/* Invisible Backdrop to catch outside taps */}
          <Pressable style={styles.backdrop} onPress={handleBackdropPress} />

          <View style={styles.dropdown}>
            {/* Season Options */}
            {seasons.map((season) => {
              const isSelected = season.season_code === selectedSeason;
              return (
                <TouchableOpacity
                  key={season.id}
                  style={[
                    styles.dropdownItem,
                    isSelected && styles.dropdownItemSelected,
                  ]}
                  onPress={() => handleSelectSeason(season.season_code)}
                  activeOpacity={0.6}
                >
                  <View style={styles.dropdownItemContent}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        isSelected && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {season.season_code}
                    </Text>
                    {season.is_active === 1 && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Aktif</Text>
                      </View>
                    )}
                  </View>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}

            {/* Divider */}
            <View style={styles.divider} />

            {/* New Season Button */}
            <TouchableOpacity
              style={styles.newSeasonButton}
              onPress={handleNewSeason}
              activeOpacity={0.7}
            >
              <Text style={styles.newSeasonIcon}>+</Text>
              <Text style={styles.newSeasonText}>Mulai Musim Tanam Baru</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    ...SHADOW.md,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seasonIndicator: {
    width: 10,
    height: 10,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  triggerTextContainer: {
    flexDirection: 'column',
  },
  triggerLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  triggerValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  chevron: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
  },
  backdrop: {
    position: 'absolute',
    top: -500,
    left: -500,
    right: -500,
    bottom: -500,
    zIndex: 998,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    zIndex: 999,
    ...SHADOW.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownItemText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.text,
  },
  dropdownItemTextSelected: {
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primaryDark,
  },
  activeBadge: {
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    marginLeft: SPACING.sm,
  },
  activeBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryDark,
  },
  checkmark: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
  },
  newSeasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.secondaryLight,
  },
  newSeasonIcon: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.secondary,
    marginRight: SPACING.sm,
  },
  newSeasonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.secondary,
  },
});

export default SeasonPicker;
