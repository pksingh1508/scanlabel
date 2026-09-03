import { StyleSheet, View } from 'react-native';

import { layout, radius, spacing, useAppTheme } from '@/theme';

import { ThemedText } from '../ui/ThemedText';

type ScannerPreviewProps = {
  instruction?: string;
};

export function ScannerPreview({
  instruction = 'Place the ingredients or nutrition panel inside the guide',
}: ScannerPreviewProps) {
  const { colors } = useAppTheme();

  return (
    <View
      accessibilityLabel="Camera preview placeholder"
      style={[styles.preview, { backgroundColor: colors.cameraSurface }]}>
      <View style={[styles.guide, { borderColor: colors.cameraGuide }]}>
        <View style={[styles.guideLabel, { backgroundColor: colors.cameraGuide }]}>
          <ThemedText style={{ color: colors.cameraSurface }} variant="label">
            LABEL AREA
          </ThemedText>
        </View>
      </View>
      <ThemedText style={[styles.instruction, { color: colors.cameraText }]} variant="captionStrong">
        {instruction}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    alignItems: 'center',
    aspectRatio: layout.cameraAspectRatio,
    borderCurve: 'continuous',
    borderRadius: radius.lg,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: spacing.lg,
  },
  guide: {
    alignItems: 'center',
    aspectRatio: layout.scanGuideAspectRatio,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: layout.guideBorderWidth,
    justifyContent: 'flex-start',
    width: layout.scanGuideWidth,
  },
  guideLabel: {
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  instruction: {
    marginTop: spacing.lg,
    maxWidth: layout.screenMaxWidth,
    textAlign: 'center',
  },
});
