import React, { useEffect, useState } from 'react';
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
import { srsService } from '../services/srs.service';
import { getInitialReviewDate } from '../lib/srs-utils';
import { srsGotIt, srsForgot } from '../lib/review';
import { isDue } from '../lib/dates';
import { SRSItem } from '../types';
import { useColors } from '../theme/useColors';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Fab } from '../components/ui/Fab';
import { Field } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { FormModal } from '../components/ui/FormModal';
import { MilestoneDots } from '../components/ui/MilestoneDots';
import { SRSCard } from '../components/srs/SRSCard';

export function SRSScreen() {
  const colors = useColors();
  const scheme = useColorScheme();
  const user = auth().currentUser;

  const [items, setItems] = useState<SRSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<SRSItem | null>(null);
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = srsService.subscribeToItems(user.uid, data => {
      setItems(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const due = items.filter(i => isDue(i.nextReviewDate));
  const upcoming = items.filter(i => !isDue(i.nextReviewDate));

  const openAdd = () => {
    setTopic('');
    setDetails('');
    setAddOpen(true);
  };

  const handleAdd = async () => {
    if (!topic.trim() || !user) return;
    setSaving(true);
    try {
      await srsService.addItem(user.uid, user.email, topic, details, getInitialReviewDate());
      setAddOpen(false);
    } catch {
      Alert.alert('Error', 'Could not save this topic.');
    } finally {
      setSaving(false);
    }
  };

  const doReview = async (fn: (i: SRSItem) => Promise<unknown>) => {
    if (!selected) return;
    try {
      await fn(selected);
    } catch {
      Alert.alert('Error', 'Could not update.');
    } finally {
      setSelected(null);
    }
  };

  const confirmDelete = (item: SRSItem) => {
    Alert.alert('Delete topic?', item.topic, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await srsService.deleteItem(item.id);
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
          <ScreenHeader title="Spaced Repetition" subtitle="Review before you forget." />

          {items.length === 0 ? (
            <EmptyState title="No topics yet." subtitle="Tap + to add something you're learning." />
          ) : (
            <>
              {due.length > 0 && (
                <Section label={`Due now · ${due.length}`} color="#f59e0b">
                  {due.map(item => (
                    <SRSCard key={item.id} item={item} onPress={() => setSelected(item)} />
                  ))}
                </Section>
              )}
              {upcoming.length > 0 && (
                <Section label={`Upcoming · ${upcoming.length}`} color={colors.mutedForeground}>
                  {upcoming.map(item => (
                    <SRSCard key={item.id} item={item} onPress={() => setSelected(item)} />
                  ))}
                </Section>
              )}
            </>
          )}
        </ScrollView>
      )}

      <Fab onPress={openAdd} />

      {/* Add topic */}
      <FormModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        title="New topic"
        subtitle="Schedule it for spaced review."
        footer={
          <>
            <Button title="Cancel" variant="secondary" onPress={() => setAddOpen(false)} style={styles.flexBtn} />
            <Button title="Add topic" onPress={handleAdd} loading={saving} style={styles.flexBtn} />
          </>
        }
      >
        <Field label="Topic" value={topic} onChangeText={setTopic} placeholder="e.g. React reconciliation" autoFocus />
        <Field
          label="Details (optional)"
          value={details}
          onChangeText={setDetails}
          placeholder="Notes, links, key points…"
          multiline
        />
      </FormModal>

      {/* Detail / review */}
      <FormModal
        visible={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.topic ?? ''}
        subtitle={
          selectedReviewDate
            ? `Next review ${format(selectedReviewDate, 'EEEE, MMM d')}`
            : 'All milestones complete'
        }
        footer={
          <>
            <Button title="Forgot" variant="destructive" onPress={() => doReview(srsForgot)} style={styles.flexBtn} />
            <Button title="Got it" variant="success" onPress={() => doReview(srsGotIt)} style={styles.flexBtn} />
          </>
        }
      >
        {selected ? (
          <View style={styles.detail}>
            <MilestoneDots reviewCount={selected.reviewCount} isDue doneColor="#3b82f6" />
            {selected.details ? (
              <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{selected.details}</Text>
            ) : null}
            <Text
              style={[styles.deleteLink, { color: colors.destructive }]}
              onPress={() => confirmDelete(selected)}
            >
              Delete topic
            </Text>
          </View>
        ) : null}
      </FormModal>
    </SafeAreaView>
  );
}

function Section({
  label,
  color,
  children,
}: {
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color }]}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1 },
  content: { padding: 20, paddingBottom: 140 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 10 },
  flexBtn: { flex: 1 },
  detail: { gap: 16, paddingTop: 4 },
  detailText: { fontSize: 14, lineHeight: 21 },
  deleteLink: { fontSize: 13, fontWeight: '700', paddingVertical: 4 },
});
