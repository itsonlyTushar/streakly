import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { useColors } from '../../theme/useColors';

type Variant = 'primary' | 'secondary' | 'destructive' | 'success';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
}: ButtonProps) {
  const colors = useColors();

  const palette: Record<Variant, { bg: string; fg: string }> = {
    primary: { bg: colors.primary, fg: colors.primaryForeground },
    secondary: { bg: colors.secondary, fg: colors.foreground },
    destructive: { bg: colors.destructive + '15', fg: colors.destructive },
    success: { bg: '#10b981', fg: '#ffffff' },
  };
  const { bg, fg } = palette[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  text: { fontSize: 14, fontWeight: '700' },
});
