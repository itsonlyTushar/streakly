import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SRS_INTERVALS } from '../../lib/srs-utils';
import { useColors } from '../../theme/useColors';

interface MilestoneDotsProps {
  reviewCount: number;
  isDue?: boolean;
  doneColor: string;
}

export function MilestoneDots({ reviewCount, isDue, doneColor }: MilestoneDotsProps) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      {SRS_INTERVALS.map((day, idx) => {
        const done = reviewCount > idx;
        const current = reviewCount === idx;
        const bg = done
          ? doneColor
          : current && isDue
          ? '#f59e0b'
          : colors.secondary;
        return <View key={day} style={[styles.dot, { backgroundColor: bg }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  dot: { flex: 1, height: 6, borderRadius: 3 },
});
