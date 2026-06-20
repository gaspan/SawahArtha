/**
 * SawahArtha Design System
 * Farming-inspired color palette with emerald/forest green tones
 */

export const COLORS = {
  // Primary - Emerald Green
  primary: '#059669',
  primaryDark: '#047857',
  primaryLight: '#D1FAE5',
  primaryMuted: '#A7F3D0',

  // Secondary - Amber/Gold (for accents, zakat)
  secondary: '#F59E0B',
  secondaryLight: '#FEF3C7',

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

  // Borders & Shadows
  border: '#9CA3AF',
  borderLight: '#D1D5DB',
  cardShadow: 'rgba(0, 0, 0, 0.08)',

  // Category badge colors
  categoryBg: {
    Insektisida: '#DBEAFE',
    Fungisida: '#EDE9FE',
    Rodentisida: '#FEF3C7',
    Pupuk: '#D1FAE5',
    'Jasa Pegawai': '#FCE7F3',
    'Item Barang': '#FFEDD5',
    Herbisida: '#CCFBF1',
    Moluksida: '#E0E7FF',
  } as Record<string, string>,
  categoryText: {
    Insektisida: '#1D4ED8',
    Fungisida: '#6D28D9',
    Rodentisida: '#D97706',
    Pupuk: '#047857',
    'Jasa Pegawai': '#BE185D',
    'Item Barang': '#EA580C',
    Herbisida: '#0F766E',
    Moluksida: '#4338CA',
  } as Record<string, string>,
};

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

export const CURRENT_SEASON = 'MT-2026-1';
