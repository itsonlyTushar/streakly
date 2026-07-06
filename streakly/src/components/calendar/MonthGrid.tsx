import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  startOfToday,
} from 'date-fns';
import { useColors } from '../../theme/useColors';
import { SRSItem, DSAItem } from '../../types';
import { DIFFICULTY_COLOR } from '../dsa/DSACard';

export type CalendarFilter = 'all' | 'srs' | 'dsa';
export type DayBucket = { srs: SRSItem[]; dsa: DSAItem[] };

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface MonthGridProps {
  month: Date;
  itemsByDate: Record<string, DayBucket>;
  filter: CalendarFilter;
  selectedDate: Date | null;
  onSelectDay: (day: Date) => void;
}

export function MonthGrid({ month, itemsByDate, filter, selectedDate, onSelectDay }: MonthGridProps) {
  const colors = useColors();
  const today = startOfToday();

  const cells = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    const out: Date[] = [];
    let day = start;
    while (day <= end) {
      out.push(day);
      day = addDays(day, 1);
    }
    return out;
  }, [month]);

  return (
    <View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map(d => (
          <Text key={d} style={[styles.weekday, { color: colors.mutedForeground }]}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const bucket = itemsByDate[key] || { srs: [], dsa: [] };
          const dots: string[] = [];
          if (filter === 'all' || filter === 'srs') bucket.srs.forEach(() => dots.push('#3b82f6'));
          if (filter === 'all' || filter === 'dsa')
            bucket.dsa.forEach(i => dots.push(DIFFICULTY_COLOR[i.difficulty] ?? colors.mutedForeground));

          const inMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <Pressable
              key={key}
              onPress={() => onSelectDay(day)}
              style={[
                styles.cell,
                {
                  borderColor: isSelected ? colors.primary : colors.border + '30',
                  backgroundColor: isSelected ? colors.secondary : 'transparent',
                  opacity: inMonth ? 1 : 0.35,
                },
              ]}
            >
              <View style={[styles.dayNum, isToday && { backgroundColor: colors.primary }]}>
                <Text
                  style={[
                    styles.dayText,
                    { color: isToday ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {format(day, 'd')}
                </Text>
              </View>

              <View style={styles.dots}>
                {dots.slice(0, 4).map((c, i) => (
                  <View key={i} style={[styles.dot, { backgroundColor: c }]} />
                ))}
                {dots.length > 4 ? (
                  <Text style={[styles.more, { color: colors.mutedForeground }]}>+{dots.length - 4}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.2857%',
    height: 60,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayNum: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontSize: 12, fontWeight: '700' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 3, minHeight: 8 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  more: { fontSize: 8, fontWeight: '800' },
});
