import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BulletList } from '@/components/result/BulletList';
import { IngredientList } from '@/components/result/IngredientList';
import { NutritionGrid } from '@/components/result/NutritionGrid';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ThemedText } from '@/components/ui/ThemedText';
import { DEMO_PRODUCT_ANALYSIS } from '@/lib/analysis/demo-fixture';
import { layout, radius, spacing, useAppTheme } from '@/theme';
import type { ProductAnalysis } from '@/types/analysis';

const NUTRIENT_LEVEL_LABELS: Record<
  keyof ProductAnalysis['labelSignals']['nutrientLevels'],
  string
> = {
  fat: 'fat',
  saturatedFat: 'saturated fat',
  sugar: 'sugar',
  salt: 'salt',
};

function formatSource(source: ProductAnalysis['source']) {
  if (source === 'combined') return 'Label photo + Open Food Facts';
  if (source === 'label_image') return 'Label photo';
  return 'Open Food Facts';
}

function resetDemoFlow() {
  if (router.canDismiss()) {
    router.dismissAll();
    return;
  }

  router.replace('/');
}

export default function ResultScreen() {
  const analysis = DEMO_PRODUCT_ANALYSIS;
  const { colors } = useAppTheme();

  return (
    <Screen safeEdges={['bottom']} scroll testID="result-screen">
      <View style={styles.page}>
        <View style={styles.product}>
          <Badge label="DEMO RESULT" />
          <ThemedText accessibilityRole="header" variant="title">
            {analysis.product.name ?? 'Unknown product'}
          </ThemedText>
          <ThemedText muted variant="bodyStrong">
            {[analysis.product.brand, analysis.product.servingSize].filter(Boolean).join(' · ')}
          </ThemedText>
        </View>

        <Card style={{ backgroundColor: colors.brandSoft, borderColor: colors.brand }}>
          <Badge label={analysis.verdict.title} tone="positive" />
          <ThemedText accessibilityRole="header" variant="section">
            Overall assessment
          </ThemedText>
          <ThemedText>{analysis.verdict.shortReason}</ThemedText>
          <ThemedText muted variant="captionStrong">
            Confidence: {analysis.verdict.confidence}
          </ThemedText>
        </Card>

        <Card>
          <SectionHeading description={`Per ${analysis.product.servingSize ?? 'label serving'}`} title="Calories" />
          <View style={styles.calorieRow}>
            <ThemedText style={{ color: colors.brand }} variant="display">
              {analysis.calories.perServingKcal ?? '—'}
            </ThemedText>
            <ThemedText muted variant="bodyStrong">
              kcal per serving
            </ThemedText>
          </View>
          <ThemedText muted variant="caption">
            {analysis.calories.per100gKcal === null
              ? 'Per 100 g value not listed'
              : `${analysis.calories.per100gKcal} kcal per 100 g`}
          </ThemedText>
        </Card>

        <Card>
          <SectionHeading description="Values shown per photographed serving" title="Nutrition" />
          <NutritionGrid nutrition={analysis.nutrition} />
        </Card>

        <Card>
          <SectionHeading title="What looks positive" />
          <BulletList items={analysis.positives} tone="positive" />
        </Card>

        <Card>
          <SectionHeading title="What to notice" />
          <BulletList items={analysis.concerns} tone="concern" />
        </Card>

        <Card style={{ borderColor: colors.allergen }}>
          <SectionHeading
            description="Declared allergens and possible traces are kept separate."
            title="Allergens"
          />
          <View style={styles.subsection}>
            <ThemedText variant="bodyStrong">Contains</ThemedText>
            <View style={styles.badges}>
              {analysis.allergens.declared.map((allergen) => (
                <Badge key={allergen} label={allergen} tone="allergen" />
              ))}
            </View>
          </View>
          <View style={styles.subsection}>
            <ThemedText variant="bodyStrong">May contain / traces</ThemedText>
            <View style={styles.badges}>
              {analysis.allergens.traces.map((allergen) => (
                <Badge key={allergen} label={allergen} tone="concern" />
              ))}
            </View>
          </View>
          {analysis.allergens.statement ? (
            <ThemedText muted variant="caption">
              Label statement: {analysis.allergens.statement}
            </ThemedText>
          ) : null}
          <ThemedText style={{ color: colors.allergen }} variant="captionStrong">
            If you have a severe allergy, always verify the physical package and manufacturer information.
          </ThemedText>
        </Card>

        <Card>
          <SectionHeading
            description={`${analysis.ingredients.items.length} ingredients parsed. Tap any row for evidence.`}
            title="Ingredients explained"
          />
          <IngredientList items={analysis.ingredients.items} />
          {analysis.ingredients.rawText ? (
            <View style={[styles.rawText, { backgroundColor: colors.surfaceSubtle }]}>
              <ThemedText variant="captionStrong">As printed</ThemedText>
              <ThemedText muted variant="caption">
                {analysis.ingredients.rawText}
              </ThemedText>
            </View>
          ) : null}
        </Card>

        <Card>
          <SectionHeading title="Label signals" />
          <View style={styles.badges}>
            {analysis.labelSignals.nutriScore ? (
              <Badge label={`Nutri-Score ${analysis.labelSignals.nutriScore}`} />
            ) : null}
            {analysis.labelSignals.novaGroup ? (
              <Badge label={`NOVA group ${analysis.labelSignals.novaGroup}`} />
            ) : null}
            {(Object.entries(analysis.labelSignals.nutrientLevels) as [
              keyof ProductAnalysis['labelSignals']['nutrientLevels'],
              string | null,
            ][]).map(([name, level]) =>
              level ? (
                <Badge
                  key={name}
                  label={`${NUTRIENT_LEVEL_LABELS[name]}: ${level}`}
                  tone={level === 'high' ? 'concern' : 'neutral'}
                />
              ) : null,
            )}
          </View>
          <View style={styles.subsection}>
            <ThemedText variant="bodyStrong">Identified additives</ThemedText>
            <ThemedText muted>
              {analysis.labelSignals.additives.length
                ? analysis.labelSignals.additives.join(', ')
                : 'None identified from available data.'}
            </ThemedText>
          </View>
        </Card>

        <Card>
          <SectionHeading title="Data quality" />
          <View style={styles.metadataRow}>
            <ThemedText muted>Source</ThemedText>
            <ThemedText style={styles.metadataValue} variant="bodyStrong">
              {formatSource(analysis.source)}
            </ThemedText>
          </View>
          <View style={styles.metadataRow}>
            <ThemedText muted>Confidence</ThemedText>
            <ThemedText style={styles.metadataValue} variant="bodyStrong">
              {analysis.dataQuality.confidence}
            </ThemedText>
          </View>
          <View style={styles.subsection}>
            <ThemedText variant="bodyStrong">Missing information</ThemedText>
            <BulletList items={analysis.dataQuality.missingFields} tone="neutral" />
          </View>
          <View style={styles.subsection}>
            <ThemedText variant="bodyStrong">Warnings</ThemedText>
            <BulletList items={analysis.dataQuality.warnings} tone="neutral" />
          </View>
        </Card>

        <View style={[styles.disclaimer, { borderColor: colors.border }]}>
          <ThemedText variant="bodyStrong">General information only</ThemedText>
          <ThemedText muted variant="caption">
            {analysis.disclaimer}
          </ThemedText>
        </View>

        <Button
          accessibilityHint="Clears this demo result and returns to the initial scanner"
          onPress={resetDemoFlow}
          title="Scan another"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  product: {
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  calorieRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  subsection: {
    gap: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  rawText: {
    borderCurve: 'continuous',
    borderRadius: radius.sm,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  metadataRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  metadataValue: {
    flex: 1,
    textAlign: 'right',
  },
  disclaimer: {
    borderTopWidth: layout.borderWidth,
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
});
