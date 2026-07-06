import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  color: string; // base hex color; used tinted for bg + solid for text
}

export function Badge({ label, color }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '1A', borderColor: color + '33' }]}>
      <Text style={[styles.text, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  text: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
});
