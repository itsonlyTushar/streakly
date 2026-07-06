import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Cpu } from 'lucide-react-native';
import { MachineCodingEntry } from '../../types';
import { useColors } from '../../theme/useColors';
import { Badge } from '../ui/Badge';

export const LANGUAGE_COLOR: Record<MachineCodingEntry['language'], string> = {
  JavaScript: '#eab308',
  React: '#06b6d4',
};

interface MCCardProps {
  item: MachineCodingEntry;
  onPress: () => void;
}

export function MCCard({ item, onPress }: MCCardProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border + '55', opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.iconChip, { backgroundColor: LANGUAGE_COLOR[item.language] + '1A' }]}>
        <Cpu size={16} color={LANGUAGE_COLOR[item.language]} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
          {item.questionName}
        </Text>
        <Badge label={item.language} color={LANGUAGE_COLOR[item.language]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 8 },
  name: { fontSize: 15, fontWeight: '700' },
});
