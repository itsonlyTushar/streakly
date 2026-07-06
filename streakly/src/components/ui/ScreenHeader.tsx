import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../theme/useColors';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 24,
  },
  textCol: { flex: 1 },
  title: { fontSize: 40, fontFamily: 'GravitasOne-Regular', letterSpacing: -2 },
  subtitle: { fontSize: 14, marginLeft: 2, marginTop: 5 },
});
