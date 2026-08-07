/**
 * Root Layout - SawahArtha
 * Wraps the app in SQLiteProvider and SeasonProvider
 */
import React from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { initializeDatabase } from '../src/database/init';
import { SeasonProvider } from '../src/context/SeasonContext';
import { BudgetProvider } from '../src/context/BudgetContext';
import { COLORS } from '../src/constants/theme';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="sawah_artha.db" onInit={initializeDatabase}>
      <SeasonProvider>
        <BudgetProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </BudgetProvider>
      </SeasonProvider>
    </SQLiteProvider>
  );
}
