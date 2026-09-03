import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ThemedText } from '@/components/ui/ThemedText';
import { layout, radius, spacing, useAppTheme } from '@/theme';

const STAGES = [
  { label: 'Reading label', state: 'complete' },
  { label: 'Checking nutrition', state: 'active' },
  { label: 'Explaining ingredients', state: 'waiting' },
] as const;

export default function AnalyzingScreen() {
  const { colors } = useAppTheme();

  return (
    <Screen safeEdges={['bottom']} testID="analyzing-screen">
      <View style={styles.content}>
        <View style={styles.heading}>
          <ActivityIndicator accessibilityLabel="Analysis in progress" color={colors.brand} size="large" />
          <ThemedText accessibilityRole="header" style={styles.centered} variant="title">
            Making the label easier to understand
          </ThemedText>
          <ThemedText accessibilityLiveRegion="polite" muted style={styles.centered}>
            This usually takes a moment. These stages summarize progress and may complete together.
          </ThemedText>
        </View>
        <Card>
          {STAGES.map((stage) => {
            const isComplete = stage.state === 'complete';
            const isActive = stage.state === 'active';

            return (
              <View key={stage.label} style={styles.stage}>
                <View
                  style={[
                    styles.stageMarker,
                    {
                      backgroundColor: isComplete || isActive ? colors.brandSoft : colors.surfaceSubtle,
                      borderColor: isComplete || isActive ? colors.brand : colors.border,
                    },
                  ]}>
                  <ThemedText
                    accessibilityElementsHidden
                    style={{ color: isComplete || isActive ? colors.brand : colors.textMuted }}
                    variant="captionStrong">
                    {isComplete ? '✓' : isActive ? '•' : '–'}
                  </ThemedText>
                </View>
                <ThemedText muted={!isComplete && !isActive} style={styles.stageLabel} variant="bodyStrong">
                  {stage.label}
                </ThemedText>
              </View>
            );
          })}
        </Card>
        <View style={styles.actions}>
          <Button
            accessibilityHint="Opens the static sample analysis result"
            onPress={() => router.replace('/result')}
            title="View demo result"
          />
          <ThemedText muted style={styles.centered} variant="caption">
            Demo mode uses a local fixture and sends no image or product data.
          </ThemedText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.xl,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  heading: {
    alignItems: 'center',
    gap: spacing.md,
  },
  centered: {
    textAlign: 'center',
  },
  stage: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: layout.compactButtonMinHeight,
  },
  stageMarker: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: radius.pill,
    borderWidth: layout.borderWidth,
    justifyContent: 'center',
    padding: spacing.xs,
  },
  stageLabel: {
    flex: 1,
  },
  actions: {
    gap: spacing.sm,
  },
});
