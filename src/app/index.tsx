import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/scanner/BrandMark';
import { CameraScanner } from '@/components/scanner/CameraScanner';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { spacing } from '@/theme';

export default function HomeScreen() {
  return (
    <Screen scroll testID="home-screen">
      <View style={styles.header}>
        <BrandMark />
        <Button
          accessibilityHint="Opens app purpose, privacy, and data source information"
          onPress={() => router.push('/about')}
          size="compact"
          title="About"
          variant="quiet"
        />
      </View>

      <View style={styles.intro}>
        <ThemedText accessibilityRole="header" variant="display">
          Scan a food label
        </ThemedText>
        <ThemedText muted>
          Understand the nutrition, ingredients, allergens, and what stands out.
        </ThemedText>
      </View>

      <CameraScanner />

      <View style={styles.actions}>
        <ThemedText style={styles.centered} variant="bodyStrong">
          Keep the label flat, fill the frame, and avoid glare.
        </ThemedText>
        <Button
          accessibilityHint="Opens the label capture screen"
          onPress={() => router.push('/capture')}
          title="Scan label"
        />
        <ThemedText muted style={styles.centered} variant="caption">
          No account or scan history. Label images are used only for the current analysis.
        </ThemedText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  intro: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xl,
  },
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  centered: {
    textAlign: 'center',
  },
});
