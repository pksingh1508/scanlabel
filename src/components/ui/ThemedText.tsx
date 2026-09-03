import { Text, type TextProps } from 'react-native';

import { typography, useAppTheme } from '@/theme';

type TextVariant = keyof typeof typography;

type ThemedTextProps = TextProps & {
  variant?: TextVariant;
  muted?: boolean;
};

export function ThemedText({
  variant = 'body',
  muted = false,
  style,
  ...props
}: ThemedTextProps) {
  const { colors } = useAppTheme();

  return (
    <Text
      maxFontSizeMultiplier={2}
      style={[typography[variant], { color: muted ? colors.textMuted : colors.text }, style]}
      {...props}
    />
  );
}
