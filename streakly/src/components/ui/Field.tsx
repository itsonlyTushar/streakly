import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardTypeOptions,
} from 'react-native';
import { useColors } from '../../theme/useColors';

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoFocus?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: KeyboardTypeOptions;
  monospace?: boolean;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  autoFocus,
  autoCapitalize = 'sentences',
  keyboardType,
  monospace,
}: FieldProps) {
  const colors = useColors();
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground + '80'}
        multiline={multiline}
        autoFocus={autoFocus}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        style={[
          styles.input,
          {
            backgroundColor: colors.secondary,
            color: colors.foreground,
            borderColor: colors.border + '40',
          },
          multiline && styles.multiline,
          monospace && styles.monospace,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6, marginBottom: 16 },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  monospace: { fontFamily: 'Courier', fontSize: 13 },
});
