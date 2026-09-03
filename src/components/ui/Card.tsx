import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { layout, radius, spacing, useAppTheme } from '@/theme';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: CardProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderCurve: 'continuous',
    borderRadius: radius.md,
    borderWidth: layout.borderWidth,
    gap: spacing.sm,
    padding: spacing.md,
  },
});
