import { StyleSheet, View } from 'react-native';

import { spacing, useAppTheme } from '@/theme';

import { ThemedText } from '../ui/ThemedText';

type BulletListProps = {
  items: string[];
  tone: 'positive' | 'concern' | 'neutral';
};

export function BulletList({ items, tone }: BulletListProps) {
  const { colors } = useAppTheme();
  const markerColor =
    tone === 'positive' ? colors.positive : tone === 'concern' ? colors.concern : colors.textMuted;

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item} style={styles.row}>
          <ThemedText accessibilityElementsHidden style={{ color: markerColor }} variant="bodyStrong">
            {tone === 'positive' ? '✓' : tone === 'concern' ? '!' : '•'}
          </ThemedText>
          <ThemedText style={styles.text}>{item}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  text: {
    flex: 1,
  },
});
