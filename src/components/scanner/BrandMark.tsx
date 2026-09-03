import { StyleSheet, View } from 'react-native';

import { radius, spacing, useAppTheme } from '@/theme';

import { ThemedText } from '../ui/ThemedText';

export function BrandMark() {
  const { colors } = useAppTheme();

  return (
    <View accessibilityLabel="ScanLabel" accessibilityRole="header" style={styles.container}>
      <View style={[styles.mark, { backgroundColor: colors.brandSoft }]}>
        <ThemedText accessibilityElementsHidden style={{ color: colors.brand }} variant="section">
          ◇
        </ThemedText>
      </View>
      <ThemedText variant="section">ScanLabel</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mark: {
    alignItems: 'center',
    aspectRatio: 1,
    borderCurve: 'continuous',
    borderRadius: radius.sm,
    justifyContent: 'center',
    padding: spacing.xs,
  },
});
