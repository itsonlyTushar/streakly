import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { Brain } from 'lucide-react-native';
import { SRSItem } from '../../types';
import { useColors } from '../../theme/useColors';
import { MilestoneDots } from '../ui/MilestoneDots';
import { isDue, isOverdue } from '../../lib/dates';

interface SRSCardProps {
  item: SRSItem;
  onPress: () => void;
}

export function SRSCard({ item, onPress }: SRSCardProps) {
  const colors = useColors();
  const due = isDue(item.nextReviewDate);
  const overdue = isOverdue(item.nextReviewDate);
  const reviewDate = item.nextReviewDate?.toDate?.();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: overdue ? '#f59e0b55' : colors.border + '55',
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconChip, { backgroundColor: '#3b82f61A' }]}>
          <Brain size={14} color="#3b82f6" />
        </View>
        <Text style={[styles.milestone, { color: colors.mutedForeground }]}>
          Milestone {Math.min(item.reviewCount + 1, 4)}
        </Text>
      </View>

      <Text style={[styles.topic, { color: colors.foreground }]} numberOfLines={2}>
        {item.topic}
      </Text>

      {reviewDate ? (
        <Text
          style={[
            styles.reviewLabel,
            { color: overdue ? '#f59e0b' : colors.mutedForeground },
          ]}
        >
          {due ? 'Due ' : 'Next review '}
          {format(reviewDate, 'MMM d')}
        </Text>
      ) : (
        <Text style={[styles.reviewLabel, { color: '#10b981' }]}>Mastered</Text>
      )}

      <View style={styles.dots}>
        <MilestoneDots reviewCount={item.reviewCount} isDue={due} doneColor="#3b82f6" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconChip: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestone: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  topic: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  reviewLabel: { fontSize: 12, fontWeight: '600', marginBottom: 12 },
  dots: { marginTop: 2 },
});
