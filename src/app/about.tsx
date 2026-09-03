import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ThemedText } from '@/components/ui/ThemedText';
import { spacing } from '@/theme';

export default function AboutScreen() {
  return (
    <Screen safeEdges={['bottom']} scroll testID="about-screen">
      <View style={styles.page}>
        <View style={styles.intro}>
          <ThemedText accessibilityRole="header" variant="title">
            Clearer food labels, in a few taps
          </ThemedText>
          <ThemedText muted>
            ScanLabel helps explain packaged-food nutrition, ingredients, allergens, and notable label signals.
          </ThemedText>
        </View>

        <Card>
          <SectionHeading title="What ScanLabel does" />
          <ThemedText>
            It reads available package-label facts and turns them into one general, plain-language summary. It is not a calorie diary, meal planner, or health tracker.
          </ThemedText>
        </Card>

        <Card>
          <SectionHeading title="Privacy" />
          <ThemedText>
            No account, application database, or scan history is used. The camera is used only to
            scan barcodes and photograph labels. Label photos are sent once for the current analysis
            and are not intentionally retained by ScanLabel — starting a new scan discards them.
          </ThemedText>
        </Card>

        <Card>
          <SectionHeading title="General-information disclaimer" />
          <ThemedText>
            Results are educational and are not personalized medical advice. Product recipes and labels can change. Always verify the current physical package, especially for severe allergies.
          </ThemedText>
        </Card>

        <Card>
          <SectionHeading title="Data sources" />
          <ThemedText>
            A photographed current package label is the primary source when readable. Barcode data
            may supplement it, and an AI service transiently processes the provided facts to extract
            and explain them without filling in missing values.
          </ThemedText>
        </Card>

        <Card>
          <SectionHeading title="Open Food Facts attribution" />
          <ThemedText>
            Barcode lookups use Open Food Facts data: © Open Food Facts contributors. The database
            is available under the Open Database License (ODbL) and its individual contents under
            the Database Contents License (DbCL). Product images are not reused by this app. See
            world.openfoodfacts.org/terms-of-use.
          </ThemedText>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  intro: {
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
});
