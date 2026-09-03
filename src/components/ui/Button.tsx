import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { layout, radius, spacing, useAppTheme } from '@/theme';

import { ThemedText } from './ThemedText';

type ButtonVariant = 'primary' | 'secondary' | 'quiet';
type ButtonSize = 'regular' | 'compact';

type ButtonProps = {
  title: string;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  variant = 'primary',
  size = 'regular',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const { colors } = useAppTheme();
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'compact' ? styles.compact : styles.regular,
        {
          backgroundColor: isPrimary
            ? pressed
              ? colors.brandPressed
              : colors.brand
            : isSecondary
              ? colors.surface
              : colors.transparent,
          borderColor: isSecondary ? colors.border : colors.transparent,
          opacity: disabled ? 0.45 : pressed && !isPrimary ? 0.65 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onBrand : colors.brand} />
      ) : (
        <ThemedText
          variant="bodyStrong"
          style={{ color: isPrimary ? colors.onBrand : colors.brand, textAlign: 'center' }}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radius.md,
    borderWidth: layout.borderWidth,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  regular: {
    minHeight: layout.buttonMinHeight,
  },
  compact: {
    minHeight: layout.compactButtonMinHeight,
  },
});
