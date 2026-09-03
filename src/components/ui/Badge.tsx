import { StyleSheet, View } from 'react-native';

import { radius, spacing, useAppTheme } from '@/theme';

import { ThemedText } from './ThemedText';

type BadgeTone = 'neutral' | 'positive' | 'concern' | 'allergen';

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const { colors } = useAppTheme();
  const toneColors = {
    neutral: { background: colors.surfaceSubtle, foreground: colors.textMuted },
    positive: { background: colors.positiveSoft, foreground: colors.positive },
    concern: { background: colors.concernSoft, foreground: colors.concern },
    allergen: { background: colors.allergenSoft, foreground: colors.allergen },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: toneColors.background }]}>
      <ThemedText variant="captionStrong" style={{ color: toneColors.foreground }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderCurve: 'continuous',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
});
