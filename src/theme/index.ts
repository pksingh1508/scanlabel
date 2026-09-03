import { useColorScheme } from 'react-native';

const sharedColors = {
  brand: '#2E6B4F',
  brandPressed: '#24563F',
  brandSoft: '#E3F1E9',
  onBrand: '#FFFFFF',
  positive: '#287A4B',
  positiveSoft: '#E4F4E9',
  concern: '#9A5A17',
  concernSoft: '#FFF0D8',
  allergen: '#8A4238',
  allergenSoft: '#FCE8E4',
  cameraSurface: '#14231E',
  cameraGuide: '#D5F5E3',
  cameraText: '#F6FAF8',
  cameraMutedText: '#C5D1CA',
  cameraOverlay: 'rgba(8, 18, 13, 0.78)',
  transparent: 'transparent',
} as const;

const lightColors = {
  ...sharedColors,
  background: '#F7F8F4',
  surface: '#FFFFFF',
  surfaceSubtle: '#EFF2EC',
  text: '#17201C',
  textMuted: '#5D6862',
  border: '#DCE2DC',
  header: '#F7F8F4',
} as const;

const darkColors = {
  ...sharedColors,
  brand: '#76C99B',
  brandPressed: '#96D9B5',
  brandSoft: '#1D3B2D',
  onBrand: '#10231A',
  positive: '#7BD39E',
  positiveSoft: '#193726',
  concern: '#F2BA73',
  concernSoft: '#402C17',
  allergen: '#F0A299',
  allergenSoft: '#452521',
  background: '#101512',
  surface: '#19201C',
  surfaceSubtle: '#222B26',
  text: '#F2F6F3',
  textMuted: '#AAB5AE',
  border: '#344039',
  header: '#101512',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' as const },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const },
  section: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: '600' as const },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  captionStrong: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700' as const },
} as const;

export const layout = {
  screenMaxWidth: 720,
  buttonMinHeight: 54,
  compactButtonMinHeight: 44,
  scanGuideWidth: '78%' as const,
  scanGuideAspectRatio: 1.45,
  cameraAspectRatio: 1.15,
  borderWidth: 1,
  guideBorderWidth: 2,
  cameraControlInset: 12,
} as const;

export const motion = {
  quick: 140,
  standard: 220,
} as const;

export type AppColors = typeof lightColors;

export function useAppTheme() {
  const colorScheme = useColorScheme();

  return {
    colors: colorScheme === 'dark' ? darkColors : lightColors,
    isDark: colorScheme === 'dark',
  };
}
