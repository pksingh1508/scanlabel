import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { layout, radius, spacing, useAppTheme } from '@/theme';
import type { IngredientItem } from '@/types/analysis';

import { Badge } from '../ui/Badge';
import { ThemedText } from '../ui/ThemedText';

type IngredientListProps = {
  items: IngredientItem[];
};

function IngredientRow({ item }: { item: IngredientItem }) {
  const [expanded, setExpanded] = useState(false);
  const { colors } = useAppTheme();
  const tone = item.concernLevel === 'moderate' ? 'concern' : 'neutral';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}. ${item.explanation}`}
      accessibilityHint={expanded ? 'Collapse ingredient details' : 'Show ingredient details'}
      accessibilityState={{ expanded }}
      onPress={() => setExpanded((value) => !value)}
      style={({ pressed }) => [
        styles.row,
        { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
      ]}>
      <View style={styles.titleRow}>
        <ThemedText style={styles.name} variant="bodyStrong">
          {item.name}
        </ThemedText>
        <ThemedText accessibilityElementsHidden muted variant="bodyStrong">
          {expanded ? '−' : '+'}
        </ThemedText>
      </View>
      <ThemedText>{item.explanation}</ThemedText>
      {expanded ? (
        <View style={styles.details}>
          <Badge label={item.category.replaceAll('_', ' ')} tone={tone} />
          {item.evidence ? (
            <ThemedText muted variant="caption">
              Evidence: {item.evidence}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

export function IngredientList({ items }: IngredientListProps) {
  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <IngredientRow item={item} key={`${item.name}-${index}`} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    borderBottomWidth: layout.borderWidth,
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
  },
  details: {
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
});
