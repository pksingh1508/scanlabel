import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ScannerPreview } from '@/components/scanner/ScannerPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ThemedText } from '@/components/ui/ThemedText';
import { spacing } from '@/theme';

export default function CaptureScreen() {
  return (
    <Screen safeEdges={['bottom']} scroll testID="capture-screen">
      <View style={styles.content}>
        <SectionHeading
          description="For this static demo, the frame below stands in for the live camera coming in Step 3."
          title="Photograph the package"
        />
        <ScannerPreview instruction="Capture ingredients and nutrition clearly. One good photo may be enough." />
        <Card>
          <ThemedText variant="bodyStrong">Get a readable scan</ThemedText>
          <ThemedText muted>
            Use bright, even light. Hold steady and keep small label text in focus.
          </ThemedText>
        </Card>
        <Button
          accessibilityHint="Uses the built-in sample label for this static demo"
          onPress={() => router.push('/analyzing')}
          title="Use demo label"
        />
        <Button onPress={() => router.back()} title="Cancel" variant="quiet" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
});
