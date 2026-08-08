/**
 * SettingsContext - Preferences store (Tier 4C/4D)
 * number format, default land size / ref price for new seasons, last backup time.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getSetting, setSetting, SETTING_KEYS } from '../database/settingsService';
import { setThousandsSeparator } from '../utils/formatConfig';

export type NumberFormat = 'dot' | 'comma';

interface SettingsContextType {
  numberFormat: NumberFormat;
  setNumberFormat: (format: NumberFormat) => Promise<void>;
  defaultLandSize: number;
  setDefaultLandSize: (size: number) => Promise<void>;
  defaultRefPrice: number;
  setDefaultRefPrice: (price: number) => Promise<void>;
  lastBackupAt: string | null;
  setLastBackupAt: (iso: string | null) => Promise<void>;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  farmReminderEnabled: boolean;
  setFarmReminderEnabled: (enabled: boolean) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [numberFormat, setNumberFormatState] = useState<NumberFormat>('dot');
  const [defaultLandSize, setDefaultLandSizeState] = useState(1400);
  const [defaultRefPrice, setDefaultRefPriceState] = useState(0);
  const [lastBackupAt, setLastBackupAtState] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [farmReminderEnabled, setFarmReminderEnabledState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [nf, dls, drp, lba, ntf, farm] = await Promise.all([
          getSetting(db, SETTING_KEYS.numberFormat),
          getSetting(db, SETTING_KEYS.defaultLandSize),
          getSetting(db, SETTING_KEYS.defaultRefPrice),
          getSetting(db, SETTING_KEYS.lastBackupAt),
          getSetting(db, SETTING_KEYS.notificationsEnabled),
          getSetting(db, SETTING_KEYS.farmReminderEnabled),
        ]);
        const fmt: NumberFormat = nf === 'comma' ? 'comma' : 'dot';
        setNumberFormatState(fmt);
        setThousandsSeparator(fmt === 'comma' ? ',' : '.');
        if (dls) setDefaultLandSizeState(parseFloat(dls) || 1400);
        if (drp) setDefaultRefPriceState(parseFloat(drp) || 0);
        if (lba) setLastBackupAtState(lba);
        setNotificationsEnabledState(ntf === '1');
        setFarmReminderEnabledState(farm === '1');
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, [db]);

  const setNumberFormat = useCallback(
    async (format: NumberFormat) => {
      setNumberFormatState(format);
      setThousandsSeparator(format === 'comma' ? ',' : '.');
      try {
        await setSetting(db, SETTING_KEYS.numberFormat, format);
      } catch (error) {
        console.error('Error saving number format:', error);
      }
    },
    [db]
  );

  const setDefaultLandSize = useCallback(
    async (size: number) => {
      setDefaultLandSizeState(size);
      try {
        await setSetting(db, SETTING_KEYS.defaultLandSize, String(size));
      } catch (error) {
        console.error('Error saving default land size:', error);
      }
    },
    [db]
  );

  const setDefaultRefPrice = useCallback(
    async (price: number) => {
      setDefaultRefPriceState(price);
      try {
        await setSetting(db, SETTING_KEYS.defaultRefPrice, String(price));
      } catch (error) {
        console.error('Error saving default ref price:', error);
      }
    },
    [db]
  );

  const setLastBackupAt = useCallback(
    async (iso: string | null) => {
      setLastBackupAtState(iso);
      try {
        await setSetting(db, SETTING_KEYS.lastBackupAt, iso ?? '');
      } catch (error) {
        console.error('Error saving last backup time:', error);
      }
    },
    [db]
  );

  const setNotificationsEnabled = useCallback(
    async (enabled: boolean) => {
      setNotificationsEnabledState(enabled);
      try {
        await setSetting(db, SETTING_KEYS.notificationsEnabled, enabled ? '1' : '0');
      } catch (error) {
        console.error('Error saving notifications setting:', error);
      }
    },
    [db]
  );

  const setFarmReminderEnabled = useCallback(
    async (enabled: boolean) => {
      setFarmReminderEnabledState(enabled);
      try {
        await setSetting(db, SETTING_KEYS.farmReminderEnabled, enabled ? '1' : '0');
      } catch (error) {
        console.error('Error saving farm reminder setting:', error);
      }
    },
    [db]
  );

  const value = useMemo<SettingsContextType>(
    () => ({
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
    }),
    [
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
    ]
  );

  if (!isLoaded) {
    return null;
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
