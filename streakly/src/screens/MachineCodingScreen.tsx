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
import { auth } from '../lib/firebase';
import { machineCodingService } from '../services/machineCoding.service';
import { MachineCodingEntry } from '../types';
import { useColors } from '../theme/useColors';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Fab } from '../components/ui/Fab';
import { Field } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { FormModal } from '../components/ui/FormModal';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { MCCard, LANGUAGE_COLOR } from '../components/machineCoding/MCCard';

const LANGUAGES = ['JavaScript', 'React'] as const;

export function MachineCodingScreen() {
  const colors = useColors();
  const scheme = useColorScheme();
  const user = auth().currentUser;

  const [items, setItems] = useState<MachineCodingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<MachineCodingEntry | null>(null);
  const [saving, setSaving] = useState(false);

  const [questionName, setQuestionName] = useState('');
  const [language, setLanguage] = useState<MachineCodingEntry['language']>('JavaScript');
  const [approach, setApproach] = useState('');
  const [solutionCode, setSolutionCode] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsub = machineCodingService.subscribeToItems(user.uid, data => {
      setItems(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const openAdd = () => {
    setQuestionName('');
    setLanguage('JavaScript');
    setApproach('');
    setSolutionCode('');
    setAddOpen(true);
  };

  const handleAdd = async () => {
    if (!questionName.trim() || !user) return;
    setSaving(true);
    try {
      await machineCodingService.addItem({
        userId: user.uid,
        email: user.email,
        questionName,
        approach,
        solutionCode,
        language,
      });
      setAddOpen(false);
    } catch {
      Alert.alert('Error', 'Could not save this entry.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item: MachineCodingEntry) => {
    Alert.alert('Delete entry?', item.questionName, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await machineCodingService.deleteItem(item.id);
          setSelected(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScreenHeader title="Machine Coding" subtitle="Your solved patterns library." />

          {items.length === 0 ? (
            <EmptyState title="No entries yet." subtitle="Tap + to save a solution." />
          ) : (
            items.map(item => (
              <MCCard key={item.id} item={item} onPress={() => setSelected(item)} />
            ))
          )}
        </ScrollView>
      )}

      <Fab onPress={openAdd} />

      {/* Add entry */}
      <FormModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        title="New entry"
        subtitle="Save an approach and solution."
        footer={
          <>
            <Button title="Cancel" variant="secondary" onPress={() => setAddOpen(false)} style={styles.flexBtn} />
            <Button title="Save entry" onPress={handleAdd} loading={saving} style={styles.flexBtn} />
          </>
        }
      >
        <Field label="Question" value={questionName} onChangeText={setQuestionName} placeholder="e.g. Debounce function" autoFocus />
        <SegmentedControl label="Language" options={LANGUAGES} value={language} onChange={setLanguage} />
        <Field label="Approach" value={approach} onChangeText={setApproach} placeholder="How you solved it…" multiline />
        <Field label="Solution code" value={solutionCode} onChangeText={setSolutionCode} placeholder="Paste your solution" multiline monospace autoCapitalize="none" />
      </FormModal>

      {/* Detail */}
      <FormModal
        visible={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.questionName ?? ''}
        subtitle={selected ? selected.language : undefined}
        footer={
          selected ? (
            <Button
              title="Delete entry"
              variant="destructive"
              onPress={() => confirmDelete(selected)}
              style={styles.flexBtn}
            />
          ) : undefined
        }
      >
        {selected ? (
          <View style={styles.detail}>
            <View style={[styles.langPill, { backgroundColor: LANGUAGE_COLOR[selected.language] + '1A' }]}>
              <Text style={[styles.langText, { color: LANGUAGE_COLOR[selected.language] }]}>
                {selected.language}
              </Text>
            </View>

            {selected.approach ? (
              <View>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>APPROACH</Text>
                <Text style={[styles.approach, { color: colors.foreground }]}>{selected.approach}</Text>
              </View>
            ) : null}

            {selected.solutionCode ? (
              <View style={styles.codeWrap}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>SOLUTION</Text>
                <ScrollView
                  horizontal
                  style={[styles.codeBox, { backgroundColor: colors.secondary }]}
                  showsHorizontalScrollIndicator={false}
                >
                  <Text style={[styles.code, { color: colors.foreground }]}>{selected.solutionCode}</Text>
                </ScrollView>
              </View>
            ) : null}
          </View>
        ) : null}
      </FormModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1 },
  content: { padding: 20, paddingBottom: 140 },
  flexBtn: { flex: 1 },
  detail: { gap: 16, paddingTop: 4 },
  langPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  langText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
  approach: { fontSize: 14, lineHeight: 21 },
  codeWrap: { gap: 6 },
  codeBox: { borderRadius: 12, padding: 12, maxHeight: 320 },
  code: { fontFamily: 'Courier', fontSize: 12.5, lineHeight: 18 },
});
