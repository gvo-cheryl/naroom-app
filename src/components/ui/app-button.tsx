import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// 프로토타입 .btn / .btn.ghost / .btn.quiet / .btn.danger 대응.
export type AppButtonVariant = 'primary' | 'ghost' | 'quiet' | 'danger';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({ title, onPress, variant = 'primary', disabled, loading, style }: AppButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const containerStyle: StyleProp<ViewStyle> = [
    styles.base,
    variant === 'primary' && { backgroundColor: theme.text },
    variant === 'ghost' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border },
    variant === 'quiet' && { backgroundColor: 'transparent', paddingVertical: Spacing.two + 3 },
    variant === 'danger' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border },
    isDisabled && styles.disabled,
    style,
  ];

  const textColor =
    variant === 'primary'
      ? theme.background
      : variant === 'ghost'
        ? theme.textSecondary
        : variant === 'danger'
          ? theme.clay
          : theme.textTertiary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [...containerStyle, pressed && !isDisabled && styles.pressed]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <ThemedText type={variant === 'ghost' || variant === 'danger' ? 'default' : 'smallBold'} style={{ color: textColor }}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'stretch',
    borderRadius: Radius.button,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
