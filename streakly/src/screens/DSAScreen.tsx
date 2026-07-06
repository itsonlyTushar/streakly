import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  useColorScheme,
  Alert,
} from 'react-native';
import { format } from 'date-fns';
import { auth } from '../lib/firebase';
import { dsaService } from '../services/dsa.service';
import { getInitialReviewDate } from '../lib/srs-utils';
import { dsaSolved, dsaForgot } from '../lib/review';
import { DSAItem, DSADifficulty } from '../types';
import { useColors } from '../theme/useColors';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Fab } from '../components/ui/Fab';
import { Field } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { FormModal } from '../components/ui/FormModal';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { DSACard, DIFFICULTY_COLOR } from '../components/dsa/DSACard';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
const FILTERS = ['All', 'Easy', 'Medium', 'Hard'] as const;

export function DSAScreen() {
  const colors = useColors();
  const scheme = useColorScheme();
  const user = auth().currentUser;

  const [items, setItems] = useState<DSAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<DSAItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Add form
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<DSADifficulty>('Medium');
  const [topics, setTopics] = useState('');
  const [url, setUrl] = useState('');
  const [intuition, setIntuition] = useState('');
  const [timeC, setTimeC] = useState('');
  const [spaceC, setSpaceC] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsub = dsaService.subscribeToItems(user.uid, data => {
      setItems(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const visible = useMemo(
    () => (filter === 'All' ? items : items.filter(i => i.difficulty === filter)),
    [items, filter],
  );

  const openAdd = () => {
    setName('');
    setDifficulty('Medium');
    setTopics('');
    setUrl('');
    setIntuition('');
    setTimeC('');
    setSpaceC('');
    setCode('');
    setAddOpen(true);
  };

  const handleAdd = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    try {
      await dsaService.addItem({
        userId: user.uid,
        email: user.email,
        problemName: name,
        difficulty,
        topics: topics.split(',').map(t => t.trim()).filter(Boolean),
        problemUrl: url,
        intuition,
        timeComplexity: timeC,
        spaceComplexity: spaceC,
        codeSnippet: code,
        nextReviewDate: getInitialReviewDate(),
      });
      setAddOpen(false);
    } catch {
      Alert.alert('Error', 'Could not save this problem.');
    } finally {
      setSaving(false);
    }
  };

  const doReview = async (fn: (i: DSAItem) => Promise<unknown>) => {
    if (!selected) return;
    try {
      await fn(selected);
    } catch {
      Alert.alert('Error', 'Could not update.');
    } finally {
      setSelected(null);
    }
  };

  const confirmDelete = (item: DSAItem) => {
    Alert.alert('Delete problem?', item.problemName, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await dsaService.deleteItem(item.id);
          setSelected(null);
        },
      },
    ]);
  };

  const selectedReviewDate = selected?.nextReviewDate?.toDate?.();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScreenHeader title="DSA Arena" subtitle="Track and revise problems." />

          {items.length > 0 && (
            <View style={styles.filter}>
              <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />
            </View>
          )}

          {items.length === 0 ? (
            <EmptyState title="No problems yet." subtitle="Tap + to log one you've solved." />
          ) : visible.length === 0 ? (
            <EmptyState title={`No ${filter.toLowerCase()} problems.`} />
          ) : (
            visible.map(item => (
              <DSACard key={item.id} item={item} onPress={() => setSelected(item)} />
            ))
          )}
        </ScrollView>
      )}

      <Fab onPress={openAdd} />

      {/* Add problem */}
      <FormModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        title="New problem"
        subtitle="Scheduled for spaced review."
        footer={
          <>
            <Button title="Cancel" variant="secondary" onPress={() => setAddOpen(false)} style={styles.flexBtn} />
            <Button title="Add problem" onPress={handleAdd} loading={saving} style={styles.flexBtn} />
          </>
        }
      >
        <Field label="Problem name" value={name} onChangeText={setName} placeholder="e.g. Two Sum" autoFocus />
        <SegmentedControl label="Difficulty" options={DIFFICULTIES} value={difficulty} onChange={setDifficulty} />
        <Field label="Topics (comma separated)" value={topics} onChangeText={setTopics} placeholder="Arrays, Hashmaps" autoCapitalize="words" />
        <Field label="Problem URL (optional)" value={url} onChangeText={setUrl} placeholder="https://…" autoCapitalize="none" keyboardType="url" />
        <Field label="Intuition (optional)" value={intuition} onChangeText={setIntuition} placeholder="Key idea / approach" multiline />
        <Field label="Time complexity (optional)" value={timeC} onChangeText={setTimeC} placeholder="O(n)" autoCapitalize="none" />
        <Field label="Space complexity (optional)" value={spaceC} onChangeText={setSpaceC} placeholder="O(1)" autoCapitalize="none" />
        <Field label="Code (optional)" value={code} onChangeText={setCode} placeholder="Paste your solution" multiline monospace autoCapitalize="none" />
      </FormModal>

      {/* Detail / review */}
      <FormModal
        visible={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.problemName ?? ''}
        subtitle={
          selectedReviewDate
            ? `Next review ${format(selectedReviewDate, 'EEEE, MMM d')}`
            : 'All milestones complete'
        }
        footer={
          <>
            <Button title="Forgot" variant="destructive" onPress={() => doReview(dsaForgot)} style={styles.flexBtn} />
            <Button title="Solved" variant="success" onPress={() => doReview(dsaSolved)} style={styles.flexBtn} />
          </>
        }
      >
        {selected ? (
          <View style={styles.detail}>
            <View style={styles.detailBadges}>
              <View
                style={[
                  styles.diffPill,
                  { backgroundColor: (DIFFICULTY_COLOR[selected.difficulty] ?? colors.mutedForeground) + '1A' },
                ]}
              >
                <Text style={[styles.diffText, { color: DIFFICULTY_COLOR[selected.difficulty] ?? colors.mutedForeground }]}>
                  {selected.difficulty}
                </Text>
              </View>
            </View>

            {selected.topics && selected.topics.length > 0 ? (
              <View style={styles.topics}>
                {selected.topics.map(t => (
                  <View key={t} style={[styles.topicChip, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.topicText, { color: colors.mutedForeground }]}>{t}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {selected.intuition ? (
              <DetailBlock label="Intuition" value={selected.intuition} />
            ) : null}

            {(selected.timeComplexity || selected.spaceComplexity) ? (
              <View style={styles.complexRow}>
                {selected.timeComplexity ? (
                  <DetailBlock label="Time" value={selected.timeComplexity} inline />
                ) : null}
                {selected.spaceComplexity ? (
                  <DetailBlock label="Space" value={selected.spaceComplexity} inline />
                ) : null}
              </View>
            ) : null}

            {selected.codeSnippet ? (
              <View style={styles.codeWrap}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>CODE</Text>
                <ScrollView
                  horizontal
                  style={[styles.codeBox, { backgroundColor: colors.secondary }]}
                  showsHorizontalScrollIndicator={false}
                >
                  <Text style={[styles.code, { color: colors.foreground }]}>{selected.codeSnippet}</Text>
                </ScrollView>
              </View>
            ) : null}

            <Text style={[styles.deleteLink, { color: colors.destructive }]} onPress={() => confirmDelete(selected)}>
              Delete problem
            </Text>
          </View>
        ) : null}
      </FormModal>
    </SafeAreaView>
  );
}

function DetailBlock({ label, value, inline }: { label: string; value: string; inline?: boolean }) {
  const colors = useColors();
  return (
    <View style={inline ? styles.inlineBlock : undefined}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1 },
  content: { padding: 20, paddingBottom: 140 },
  filter: { marginBottom: 4 },
  flexBtn: { flex: 1 },
  detail: { gap: 16, paddingTop: 4 },
  detailBadges: { flexDirection: 'row', gap: 8 },
  diffPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  diffText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  topicChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  topicText: { fontSize: 10, fontWeight: '800' },
  complexRow: { flexDirection: 'row', gap: 24 },
  inlineBlock: {},
  detailLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  codeWrap: { gap: 6 },
  codeBox: { borderRadius: 12, padding: 12, maxHeight: 220 },
  code: { fontFamily: 'Courier', fontSize: 12.5, lineHeight: 18 },
  deleteLink: { fontSize: 13, fontWeight: '700', paddingVertical: 4 },
});
