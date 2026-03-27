import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { ArrowRight, CheckCircle2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

interface GoalCardProps {
  goal: {
    id: string;
    goal: string;
    dueDate: string;
    createdAt: any;
    userId: string;
    status: 'active' | 'completed';
    color?: string;
  };
  onPress?: () => void;
}

const COLORS = [
  '#FFD580', // Orange/Yellow
  '#FF9B85', // Coral
  '#D4E09B', // Green
  '#A9DEF9', // Blue
  '#D0BCFF', // Purple
];

export function GoalCard({ goal, onPress }: GoalCardProps) {
  const cardColor = goal.color || COLORS[Math.floor(Math.random() * COLORS.length)];
  const isCompleted = goal.status === 'completed';

  const daysLeft = differenceInDays(
    startOfDay(new Date(goal.dueDate)),
    startOfDay(new Date())
  );

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: cardColor }, isCompleted && styles.completedCard]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.topSection}>
        <View style={styles.header}>
          <Text style={styles.goalText} numberOfLines={2}>
            {goal.goal}
          </Text>
          <Text style={styles.targetText}>
            {isCompleted
              ? 'Completed'
              : 'Target: ' + format(new Date(goal.dueDate), 'MMM d, yyyy')}
          </Text>
        </View>

        {isCompleted && (
          <View style={styles.completedBadge}>
            <CheckCircle2 color="rgba(0,0,0,0.6)" size={14} />
            <Text style={styles.completedBadgeText}>Hall of Fame</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomSection}>
        {!isCompleted ? (
          <View>
            <Text style={[styles.daysLeftText, daysLeft <= 0 && styles.overdueText]}>
              {daysLeft > 0 ? daysLeft : daysLeft === 0 ? '!' : '!!'}
            </Text>
            <Text style={styles.daysLeftLabel}>
              {daysLeft > 0 ? (daysLeft === 1 ? 'day left' : 'days left') : daysLeft === 0 ? 'due today' : 'overdue'}
            </Text>
          </View>
        ) : (
          <Text style={styles.achievedText}>Goal achieved</Text>
        )}
        
        <View style={styles.arrowContainer}>
          <ArrowRight color="rgba(0,0,0,0.6)" size={24} />
        </View>
      </View>

      <View style={styles.decorativeBlur} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 40,
    padding: 30,
    minHeight: 280,
    justifyContent: 'space-between',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  completedCard: {
    opacity: 0.9,
  },
  topSection: {
    gap: 15,
  },
  header: {
    gap: 5,
  },
  goalText: {
    fontSize: 28,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.8)',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  targetText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.3)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    width: 'auto',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  daysLeftText: {
    fontSize: 48,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.6)',
    lineHeight: 48,
    letterSpacing: -2,
  },
  overdueText: {
    color: 'rgba(255,0,0,0.5)',
  },
  daysLeftLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.3)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 2,
  },
  achievedText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.1)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  arrowContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorativeBlur: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 150,
    height: 150,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 75,
  },
});
