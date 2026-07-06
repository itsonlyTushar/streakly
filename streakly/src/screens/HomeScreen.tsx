import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  useColorScheme,
} from 'react-native';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import { db, auth } from '../lib/firebase';
import { GoalCard } from '../components/GoalCard';
import { useColors } from '../theme/useColors';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { EmptyState } from '../components/ui/EmptyState';

interface Goal {
  id: string;
  goal: string;
  dueDate: string;
  createdAt: { toMillis: () => number } | null;
  userId: string;
  status: 'active' | 'completed';
  color?: string;
}

export function HomeScreen() {
  const colors = useColors();
  const scheme = useColorScheme();
  const user = auth().currentUser;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'goals'),
      where('userId', '==', user.uid),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        setGoals(
          snapshot.docs.map(
            (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({ id: d.id, ...d.data() } as Goal),
          ),
        );
        setLoading(false);
      },
      error => {
        console.error('Error fetching goals: ', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <FlatList
        data={goals}
        renderItem={({ item }) => <GoalCard goal={item} />}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <ScreenHeader title="Goals" subtitle="Stay consistent, one step at a time." />
        }
        ListEmptyComponent={
          <EmptyState
            title="No active goals yet."
            subtitle="Goals you create will show up here."
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center' },
  listContent: { padding: 20, paddingBottom: 120 },
});
