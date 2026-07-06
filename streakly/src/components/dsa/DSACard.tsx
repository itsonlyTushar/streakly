import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { DSAItem, DSADifficulty } from '../../types';
import { useColors } from '../../theme/useColors';
import { Badge } from '../ui/Badge';
import { MilestoneDots } from '../ui/MilestoneDots';
import { isDue, isOverdue } from '../../lib/dates';

export const DIFFICULTY_COLOR: Record<DSADifficulty, string> = {
  Easy: '#10b981',
  Medium: '#f59e0b',
  Hard: '#f43f5e',
};

interface DSACardProps {
  item: DSAItem;
  onPress: () => void;
}

export function DSACard({ item, onPress }: DSACardProps) {
  const colors = useColors();
  const due = isDue(item.nextReviewDate);
  const overdue = isOverdue(item.nextReviewDate);
  const reviewDate = item.nextReviewDate?.toDate?.();
  const diffColor = DIFFICULTY_COLOR[item.difficulty] ?? colors.mutedForeground;

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
        <Badge label={item.difficulty} color={diffColor} />
        {reviewDate ? (
          <Text style={[styles.review, { color: overdue ? '#f59e0b' : colors.mutedForeground }]}>
            {due ? 'Due ' : ''}
            {format(reviewDate, 'MMM d')}
          </Text>
        ) : (
          <Text style={[styles.review, { color: '#10b981' }]}>Mastered</Text>
        )}
      </View>

      <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
        {item.problemName}
      </Text>

      {item.topics && item.topics.length > 0 ? (
        <View style={styles.topics}>
          {item.topics.slice(0, 3).map(t => (
            <View key={t} style={[styles.topicChip, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.topicText, { color: colors.mutedForeground }]}>{t}</Text>
            </View>
          ))}
          {item.topics.length > 3 ? (
            <View style={[styles.topicChip, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.topicText, { color: colors.mutedForeground }]}>
                +{item.topics.length - 3}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.dots}>
        <MilestoneDots reviewCount={item.reviewCount} isDue={due} doneColor={colors.primary} />
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
  review: { fontSize: 11, fontWeight: '700' },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 12 },
  topicChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  topicText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  dots: { marginTop: 2 },
});
