import { StyleSheet, View } from 'react-native';

import { layout, radius, spacing, useAppTheme } from '@/theme';
import type { ProductAnalysis } from '@/types/analysis';

import { ThemedText } from '../ui/ThemedText';

type NutritionGridProps = {
  nutrition: ProductAnalysis['nutrition'];
};

const LABELS: Record<keyof ProductAnalysis['nutrition'], string> = {
  protein: 'Protein',
  carbohydrates: 'Carbohydrates',
  sugars: 'Sugars',
  fat: 'Fat',
  saturatedFat: 'Saturated fat',
  fiber: 'Fiber',
  sodium: 'Sodium',
  salt: 'Salt',
};

export function NutritionGrid({ nutrition }: NutritionGridProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.grid}>
      {(Object.keys(LABELS) as (keyof ProductAnalysis['nutrition'])[]).map((key) => {
        const nutrient = nutrition[key];
        const value = nutrient.value === null ? 'Not listed' : `${nutrient.value} ${nutrient.unit ?? ''}`.trim();

        return (
          <View
            accessibilityLabel={`${LABELS[key]}: ${value}`}
            key={key}
            style={[styles.cell, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
            <ThemedText muted variant="caption">
              {LABELS[key]}
            </ThemedText>
            <ThemedText variant="bodyStrong">{value}</ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  cell: {
    borderCurve: 'continuous',
    borderRadius: radius.sm,
    borderWidth: layout.borderWidth,
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.xxs,
    minWidth: 132,
    padding: spacing.sm,
  },
});
