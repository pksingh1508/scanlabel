import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { layout, spacing, useAppTheme } from '@/theme';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  safeEdges?: Edge[];
  contentStyle?: ViewStyle;
  testID?: string;
};

export function Screen({
  children,
  scroll = false,
  safeEdges = ['top', 'bottom'],
  contentStyle,
  testID,
}: ScreenProps) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView edges={safeEdges} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          testID={testID}>
          <View style={styles.content}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[styles.staticContent, contentStyle]} testID={testID}>
          <View style={styles.content}>{children}</View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  staticContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  content: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: layout.screenMaxWidth,
    width: '100%',
  },
});
