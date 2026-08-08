/**
 * SawahArtha Design System
 * Farming-inspired color palette with emerald/forest green tones
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontScaleLevel = 'small' | 'medium' | 'large';

const categoryBgLight = {
  Insektisida: '#DBEAFE',
  Fungisida: '#EDE9FE',
  Rodentisida: '#FEF3C7',
  Pupuk: '#D1FAE5',
  'Jasa Pegawai': '#FCE7F3',
  'Item Barang': '#FFEDD5',
  Herbisida: '#CCFBF1',
  Moluksida: '#E0E7FF',
} as const;

const categoryTextLight = {
  Insektisida: '#1D4ED8',
  Fungisida: '#6D28D9',
  Rodentisida: '#D97706',
  Pupuk: '#047857',
  'Jasa Pegawai': '#BE185D',
  'Item Barang': '#EA580C',
  Herbisida: '#0F766E',
  Moluksida: '#4338CA',
} as const;

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;
  secondary: string;
  secondaryLight: string;
  blue: string;
  blueDark: string;
  blueLight: string;
  amberDark: string;
  amberDeep: string;
  amberLight: string;
  amberBg: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textLight: string;
  textInverse: string;
  danger: string;
  dangerLight: string;
  success: string;
  successLight: string;
  info: string;
  infoLight: string;
  warning: string;
  warningLight: string;
  chartExpense: string;
  chartRevenue: string;
  chartPupuk: string;
  chartInsektisida: string;
  chartFungisida: string;
  chartRodentisida: string;
  chartJasaPegawai: string;
  chartItemBarang: string;
  chartHerbisida: string;
  chartMoluksida: string;
  chartGacong: string;
  chartDeficit: string;
  border: string;
  borderLight: string;
  cardShadow: string;
  categoryBg: Record<string, string>;
  categoryText: Record<string, string>;
}

export const LIGHT_COLORS: ThemeColors = {
  // Primary - Emerald Green
  primary: '#059669',
  primaryDark: '#047857',
  primaryLight: '#D1FAE5',
  primaryMuted: '#A7F3D0',

  // Secondary - Amber/Gold (for accents, zakat)
  secondary: '#F59E0B',
  secondaryLight: '#FEF3C7',

  // Blue tones (gacong, info)
  blue: '#3B82F6',
  blueDark: '#1E40AF',
  blueLight: '#BFDBFE',

  // Amber tones (zakat)
  amberDark: '#B45309',
  amberDeep: '#92400E',
  amberLight: '#FDE68A',
  amberBg: '#FFFBEB',

  // Background
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAFA',

  // Text
  text: '#0F172A',
  textSecondary: '#374151',
  textLight: '#6B7280',
  textInverse: '#FFFFFF',

  // Semantic
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  // Chart Colors
  chartExpense: '#EF4444',
  chartRevenue: '#059669',
  chartPupuk: '#059669',
  chartInsektisida: '#3B82F6',
  chartFungisida: '#8B5CF6',
  chartRodentisida: '#F59E0B',
  chartJasaPegawai: '#EC4899',
  chartItemBarang: '#F97316',
  chartHerbisida: '#14B8A6',
  chartMoluksida: '#6366F1',
  chartGacong: '#A855F7',
  chartDeficit: '#FCA5A5',

  // Borders & Shadows
  border: '#9CA3AF',
  borderLight: '#D1D5DB',
  cardShadow: 'rgba(0, 0, 0, 0.08)',

  // Category badge colors
  categoryBg: { ...categoryBgLight } as Record<string, string>,
  categoryText: { ...categoryTextLight } as Record<string, string>,
};

export const DARK_COLORS: ThemeColors = {
  primary: '#34D399',
  primaryDark: '#10B981',
  primaryLight: '#064E3B',
  primaryMuted: '#065F46',

  secondary: '#FBBF24',
  secondaryLight: '#451A03',

  blue: '#60A5FA',
  blueDark: '#93C5FD',
  blueLight: '#1E3A5F',

  amberDark: '#FBBF24',
  amberDeep: '#F59E0B',
  amberLight: '#78350F',
  amberBg: '#1C1917',

  background: '#0F172A',
  surface: '#1E293B',
  surfaceElevated: '#273449',

  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textLight: '#94A3B8',
  textInverse: '#0F172A',

  danger: '#F87171',
  dangerLight: '#450A0A',
  success: '#34D399',
  successLight: '#064E3B',
  info: '#60A5FA',
  infoLight: '#172554',
  warning: '#FBBF24',
  warningLight: '#451A03',

  chartExpense: '#F87171',
  chartRevenue: '#34D399',
  chartPupuk: '#34D399',
  chartInsektisida: '#60A5FA',
  chartFungisida: '#A78BFA',
  chartRodentisida: '#FBBF24',
  chartJasaPegawai: '#F472B6',
  chartItemBarang: '#FB923C',
  chartHerbisida: '#2DD4BF',
  chartMoluksida: '#818CF8',
  chartGacong: '#C084FC',
  chartDeficit: '#7F1D1D',

  border: '#475569',
  borderLight: '#334155',
  cardShadow: 'rgba(0, 0, 0, 0.4)',

  categoryBg: {
    Insektisida: '#172554',
    Fungisida: '#2E1065',
    Rodentisida: '#451A03',
    Pupuk: '#064E3B',
    'Jasa Pegawai': '#4A044E',
    'Item Barang': '#431407',
    Herbisida: '#134E4A',
    Moluksida: '#1E1B4B',
  } as Record<string, string>,
  categoryText: {
    Insektisida: '#93C5FD',
    Fungisida: '#C4B5FD',
    Rodentisida: '#FCD34D',
    Pupuk: '#6EE7B7',
    'Jasa Pegawai': '#F9A8D4',
    'Item Barang': '#FDBA74',
    Herbisida: '#5EEAD4',
    Moluksida: '#A5B4FC',
  } as Record<string, string>,
};

export const COLORS: ThemeColors = LIGHT_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
};

export const FONT_SCALE_MAP: Record<FontScaleLevel, number> = {
  small: 0.9,
  medium: 1,
  large: 1.15,
};

export const FONT_WEIGHT = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const CATEGORIES = [
  'Insektisida',
  'Fungisida',
  'Rodentisida',
  'Pupuk',
  'Jasa Pegawai',
  'Item Barang',
  'Herbisida',
  'Moluksida',
] as const;

export type ExpenseCategory = (typeof CATEGORIES)[number];

export const DEFAULT_BUDGET_PER_HA = 25_000_000;

export const DEFAULT_BUDGET_RATIO: Record<ExpenseCategory, number> = {
  Pupuk: 0.30,
  'Jasa Pegawai': 0.25,
  Insektisida: 0.12,
  Herbisida: 0.10,
  'Item Barang': 0.08,
  Fungisida: 0.07,
  Rodentisida: 0.04,
  Moluksida: 0.04,
};

export const BUDGET_AUDIT_LOG_LIMIT = 50;

export const CURRENT_SEASON = 'MT-2026-1';
