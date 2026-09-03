import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { ThemedText } from './ThemedText';

type SectionHeadingProps = {
  title: string;
  description?: string;
};

export function SectionHeading({ title, description }: SectionHeadingProps) {
  return (
    <View style={styles.container}>
      <ThemedText accessibilityRole="header" variant="section">
        {title}
      </ThemedText>
      {description ? <ThemedText muted>{description}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xxs,
  },
});
