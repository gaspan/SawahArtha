/**
 * Tab Layout - SawahArtha
 * Bottom tab navigator with 3 tabs: Dashboard, Pengeluaran, Penghasilan
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT } from '../../src/constants/theme';
import { useBudget } from '../../src/context/BudgetContext';

function TabIcon({ emoji, focused, badgeCount }: {
  emoji: string;
  focused: boolean;
  badgeCount?: number;
}) {
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
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
    fontSize: FONT_SIZE.xs,
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
    backgroundColor: COLORS.primaryLight,
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
    backgroundColor: COLORS.danger,
    borderWidth: 2,
    borderColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: COLORS.textInverse,
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
  },
});
