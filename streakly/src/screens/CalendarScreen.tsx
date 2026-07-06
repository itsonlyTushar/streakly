import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Pressable,
  useColorScheme,
  Alert,
} from 'react-native';
import {
  addMonths,
  format,
  startOfDay,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Brain } from 'lucide-react-native';
import { auth } from '../lib/firebase';
import { srsService } from '../services/srs.service';
import { dsaService } from '../services/dsa.service';
import { srsGotIt, srsForgot, dsaSolved, dsaForgot } from '../lib/review';
import { SRSItem, DSAItem } from '../types';
import { useColors } from '../theme/useColors';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { FormModal } from '../components/ui/FormModal';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { MilestoneDots } from '../components/ui/MilestoneDots';
import { Badge } from '../components/ui/Badge';
import { MonthGrid, DayBucket } from '../components/calendar/MonthGrid';
import { DIFFICULTY_COLOR } from '../components/dsa/DSACard';

const FILTERS = ['All', 'SRS', 'DSA'] as const;

export function CalendarScreen() {
  const colors = useColors();
  const scheme = useColorScheme();
  const user = auth().currentUser;

  const [srsItems, setSrsItems] = useState<SRSItem[]>([]);
  const [dsaItems, setDsaItems] = useState<DSAItem[]>([]);
  const [srsLoaded, setSrsLoaded] = useState(false);
  const [dsaLoaded, setDsaLoaded] = useState(false);

  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterLabel, setFilterLabel] = useState<(typeof FILTERS)[number]>('All');

  useEffect(() => {
    if (!user) return;
    const unsubSrs = srsService.subscribeToItems(user.uid, data => {
      setSrsItems(data);
      setSrsLoaded(true);
    });
    const unsubDsa = dsaService.subscribeToItems(user.uid, data => {
      setDsaItems(data);
      setDsaLoaded(true);
    });
    return () => {
      unsubSrs();
      unsubDsa();
    };
  }, [user]);

  const filter = filterLabel.toLowerCase() as 'all' | 'srs' | 'dsa';
  const loading = !srsLoaded || !dsaLoaded;

  const itemsByDate = useMemo(() => {
    const map: Record<string, DayBucket> = {};
    const add = (date: Date, type: 'srs' | 'dsa', item: SRSItem | DSAItem) => {
      const key = format(startOfDay(date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = { srs: [], dsa: [] };
      if (type === 'srs') map[key].srs.push(item as SRSItem);
      else map[key].dsa.push(item as DSAItem);
    };
    srsItems.forEach(i => {
      const d = i.nextReviewDate?.toDate?.();
      if (d) add(d, 'srs', i);
    });
    dsaItems.forEach(i => {
      const d = i.nextReviewDate?.toDate?.();
      if (d) add(d, 'dsa', i);
    });
    return map;
  }, [srsItems, dsaItems]);

  const dayBucket: DayBucket = selectedDate
    ? itemsByDate[format(startOfDay(selectedDate), 'yyyy-MM-dd')] || { srs: [], dsa: [] }
    : { srs: [], dsa: [] };

  const showSrs = filter === 'all' || filter === 'srs';
  const showDsa = filter === 'all' || filter === 'dsa';
  const daySrs = showSrs ? dayBucket.srs : [];
  const dayDsa = showDsa ? dayBucket.dsa : [];

  const runAction = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch {
      Alert.alert('Error', 'Could not update.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScreenHeader title="Calendar" subtitle="Your upcoming revisions." />

          <SegmentedControl options={FILTERS} value={filterLabel} onChange={setFilterLabel} />

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border + '40' }]}>
            <View style={styles.monthNav}>
              <Text style={[styles.monthTitle, { color: colors.foreground }]}>
                {format(month, 'MMMM yyyy')}
              </Text>
              <View style={styles.navBtns}>
                <NavButton onPress={() => setMonth(subMonths(month, 1))}>
                  <ChevronLeft size={18} color={colors.foreground} />
                </NavButton>
                <NavButton onPress={() => setMonth(addMonths(month, 1))}>
                  <ChevronRight size={18} color={colors.foreground} />
                </NavButton>
              </View>
            </View>

            <MonthGrid
              month={month}
              itemsByDate={itemsByDate}
              filter={filter}
              selectedDate={selectedDate}
              onSelectDay={setSelectedDate}
            />
          </View>

          <View style={styles.legend}>
            <LegendDot color="#3b82f6" label="SRS" />
            <LegendDot color={DIFFICULTY_COLOR.Easy} label="Easy" />
            <LegendDot color={DIFFICULTY_COLOR.Medium} label="Medium" />
            <LegendDot color={DIFFICULTY_COLOR.Hard} label="Hard" />
          </View>
        </ScrollView>
      )}

      {/* Day detail */}
      <FormModal
        visible={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? format(selectedDate, 'EEEE, MMM d') : ''}
        subtitle="Revisions due"
      >
        {daySrs.length === 0 && dayDsa.length === 0 ? (
          <EmptyState title="Nothing due this day." />
        ) : (
          <View style={styles.dayList}>
            {daySrs.map(item => (
              <View key={item.id} style={[styles.dayCard, { backgroundColor: colors.secondary + '80' }]}>
                <View style={styles.dayCardHead}>
                  <View style={styles.srsTag}>
                    <Brain size={12} color="#3b82f6" />
                    <Text style={styles.srsTagText}>SRS</Text>
                  </View>
                </View>
                <Text style={[styles.dayItemTitle, { color: colors.foreground }]}>{item.topic}</Text>
                <MilestoneDots reviewCount={item.reviewCount} isDue doneColor="#3b82f6" />
                <View style={styles.actions}>
                  <Button title="Forgot" variant="destructive" onPress={() => runAction(() => srsForgot(item))} style={styles.actionBtn} />
                  <Button title="Got it" variant="success" onPress={() => runAction(() => srsGotIt(item))} style={styles.actionBtn} />
                </View>
              </View>
            ))}

            {dayDsa.map(item => (
              <View key={item.id} style={[styles.dayCard, { backgroundColor: colors.secondary + '80' }]}>
                <View style={styles.dayCardHead}>
                  <Badge label={`DSA · ${item.difficulty}`} color={DIFFICULTY_COLOR[item.difficulty] ?? colors.mutedForeground} />
                </View>
                <Text style={[styles.dayItemTitle, { color: colors.foreground }]}>{item.problemName}</Text>
                <MilestoneDots reviewCount={item.reviewCount} isDue doneColor={colors.primary} />
                <View style={styles.actions}>
                  <Button title="Forgot" variant="destructive" onPress={() => runAction(() => dsaForgot(item))} style={styles.actionBtn} />
                  <Button title="Solved" variant="success" onPress={() => runAction(() => dsaSolved(item))} style={styles.actionBtn} />
                </View>
              </View>
            ))}
          </View>
        )}
      </FormModal>
    </SafeAreaView>
  );
}

function NavButton({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navBtn,
        { borderColor: colors.border + '40', opacity: pressed ? 0.6 : 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const colors = useColors();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1 },
  content: { padding: 20, paddingBottom: 140 },
  card: { borderRadius: 24, borderWidth: 1, padding: 14, marginTop: 4 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  navBtns: { flexDirection: 'row', gap: 8 },
  navBtn: { padding: 8, borderRadius: 12, borderWidth: 1 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, fontWeight: '700' },
  dayList: { gap: 12 },
  dayCard: { borderRadius: 18, padding: 14, gap: 10 },
  dayCardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  srsTag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#3b82f61A', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  srsTagText: { fontSize: 9, fontWeight: '900', color: '#3b82f6', letterSpacing: 0.8 },
  dayItemTitle: { fontSize: 15, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  actionBtn: { flex: 1, paddingVertical: 10 },
});
