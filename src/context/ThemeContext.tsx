/**
 * ThemeContext - Global theme & font scale (Tier 4B)
 * Persists preference in settings table; provides reactive colors.
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
import { useColorScheme } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import {
  LIGHT_COLORS,
  DARK_COLORS,
  FONT_SIZE,
  FONT_SCALE_MAP,
  type ThemeColors,
  type ThemeMode,
  type FontScaleLevel,
} from '../constants/theme';
import { getSetting, setSetting, SETTING_KEYS } from '../database/settingsService';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => Promise<void>;
  fontScale: FontScaleLevel;
  setFontScale: (level: FontScaleLevel) => Promise<void>;
  isDark: boolean;
  colors: ThemeColors;
  fs: typeof FONT_SIZE;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyFontScale(base: typeof FONT_SIZE, level: FontScaleLevel): typeof FONT_SIZE {
  const scale = FONT_SCALE_MAP[level];
  const out = {} as typeof FONT_SIZE;
  for (const key of Object.keys(base) as (keyof typeof FONT_SIZE)[]) {
    out[key] = Math.round(base[key] * scale);
  }
  return out;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [fontScale, setFontScaleState] = useState<FontScaleLevel>('medium');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [savedTheme, savedFont] = await Promise.all([
          getSetting(db, SETTING_KEYS.theme),
          getSetting(db, SETTING_KEYS.fontScale),
        ]);
        if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system') {
          setThemeState(savedTheme);
        }
        if (savedFont === 'small' || savedFont === 'medium' || savedFont === 'large') {
          setFontScaleState(savedFont);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, [db]);

  const setTheme = useCallback(
    async (mode: ThemeMode) => {
      setThemeState(mode);
      try {
        await setSetting(db, SETTING_KEYS.theme, mode);
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    },
    [db]
  );

  const setFontScale = useCallback(
    async (level: FontScaleLevel) => {
      setFontScaleState(level);
      try {
        await setSetting(db, SETTING_KEYS.fontScale, level);
      } catch (error) {
        console.error('Error saving font scale:', error);
      }
    },
    [db]
  );

  const value = useMemo<ThemeContextType>(() => {
    const resolved =
      theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : theme;
    const colors = resolved === 'dark' ? DARK_COLORS : LIGHT_COLORS;
    return {
      theme,
      setTheme,
      fontScale,
      setFontScale,
      isDark: resolved === 'dark',
      colors,
      fs: applyFontScale(FONT_SIZE, fontScale),
    };
  }, [theme, fontScale, systemScheme, setTheme, setFontScale]);

  if (!isLoaded) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Build memoized styles from a factory that takes (colors, fs).
 * Usage: const styles = useThemedStyles(makeStyles);
 */
export function useThemedStyles<T>(
  make: (colors: ThemeColors, fs: typeof FONT_SIZE) => T
): T {
  const { colors, fs } = useTheme();
  return useMemo(() => make(colors, fs), [colors, fs, make]);
}
