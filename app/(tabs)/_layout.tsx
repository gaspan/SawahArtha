/**
 * Tab Layout - SawahArtha
 * Bottom tab navigator with 3 tabs: Dashboard, Pengeluaran, Penghasilan
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';
import { FONT_WEIGHT, type ThemeColors } from '../../src/constants/theme';
import { useBudget } from '../../src/context/BudgetContext';
import { useTheme, useThemedStyles } from '../../src/context/ThemeContext';

function TabIcon({ emoji, focused, badgeCount }: {
  emoji: string;
  focused: boolean;
  badgeCount?: number;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Text style={styles.emoji}>{emoji}</Text>
      {badgeCount != null && badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { overBudgetCount } = useBudget();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Pengeluaran',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💰" focused={focused} badgeCount={overBudgetCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          title: 'Penghasilan',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🌾" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          title: 'Hutang',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💳" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Jurnal',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📔" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../../src/constants/theme').FONT_SIZE) =>
  StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabLabel: {
    fontSize: fs.xs,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: 2,
  },
  tabItem: {
    paddingTop: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: colors.primaryLight,
  },
  emoji: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
  },
});
