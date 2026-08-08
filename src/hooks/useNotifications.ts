/**
 * useNotifications - sync scheduled reminders when app regains focus
 * and when notification-related settings change.
 */
import { useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useSettings } from '../context/SettingsContext';
import { syncScheduledNotifications } from '../services/notificationService';

export function useNotificationSync() {
  const db = useSQLiteContext();
  const { notificationsEnabled } = useSettings();

  const sync = useCallback(async () => {
    try {
      await syncScheduledNotifications(db);
    } catch (error) {
      console.error('Error syncing notifications:', error);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      sync();
    }, [sync])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => sub.remove();
  }, [sync]);

  return { notificationsEnabled };
}
