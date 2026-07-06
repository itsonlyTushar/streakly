import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../theme/useColors';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.container,
        { borderColor: colors.border, backgroundColor: colors.secondary + '80' },
      ]}
    >
      <Text style={[styles.title, { color: colors.mutedForeground }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    borderRadius: 28,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 5, textAlign: 'center' },
  subtitle: { fontSize: 12, opacity: 0.8, textAlign: 'center' },
});
