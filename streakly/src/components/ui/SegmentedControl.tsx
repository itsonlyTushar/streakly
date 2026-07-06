import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useColors } from '../../theme/useColors';

interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedControlProps<T>) {
  const colors = useColors();
  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>
      ) : null}
      <View style={[styles.row, { backgroundColor: colors.secondary }]}>
        {options.map(option => {
          const active = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={[
                styles.segment,
                active && { backgroundColor: colors.card },
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: active ? colors.primary : colors.mutedForeground },
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6, marginBottom: 16 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  row: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentText: { fontSize: 12, fontWeight: '700' },
});
