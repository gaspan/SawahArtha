/**
 * Root Layout - SawahArtha
 * Wraps the app in SQLiteProvider and SeasonProvider
 */
import React from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { initializeDatabase } from '../src/database/init';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { SettingsProvider } from '../src/context/SettingsContext';
import { SeasonProvider } from '../src/context/SeasonContext';
import { BudgetProvider } from '../src/context/BudgetContext';

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="sawah_artha.db" onInit={initializeDatabase}>
      <ThemeProvider>
        <SettingsProvider>
          <ThemedStatusBar />
          <SeasonProvider>
            <BudgetProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="settings" />
              </Stack>
            </BudgetProvider>
          </SeasonProvider>
        </SettingsProvider>
      </ThemeProvider>
    </SQLiteProvider>
  );
}
