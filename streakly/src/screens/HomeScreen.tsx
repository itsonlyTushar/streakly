import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView, 
  useColorScheme, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { db, auth } from '../lib/firebase';
import { GoalCard } from '../components/GoalCard';
import { colors } from '../theme/colors';
import firestore from '@react-native-firebase/firestore';

export function HomeScreen() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const currentColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const user = auth().currentUser;

  useEffect(() => {
    if (!user) return;

    const query = db.collection('goals')
      .where('userId', '==', user.uid)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc');

    const unsubscribe = query.onSnapshot(snapshot => {
      const goalsData = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGoals(goalsData);
      setLoading(false);
    }, error => {
      console.error("Error fetching goals: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.title, { color: currentColors.primary }]}>Goals</Text>
      <Text style={[styles.subtitle, { color: currentColors.mutedForeground }]}>
        Stay consistent, one step at a time.
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={[styles.emptyContainer, { borderColor: currentColors.border, backgroundColor: currentColors.secondary + '80' }]}>
      <Text style={[styles.emptyText, { color: currentColors.mutedForeground }]}>No active goals yet.</Text>
      <Text style={[styles.emptySubtext, { color: currentColors.mutedForeground }]}>Click the + button to start one.</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentColors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={currentColors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <FlatList
        data={goals}
        renderItem={({ item }) => <GoalCard goal={item} />}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100, // Space for the dock
  },
  header: {
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 48,
    fontFamily: 'GravitasOne-Regular',
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 16,
    marginLeft: 2,
    marginTop: 5,
  },
  emptyContainer: {
    padding: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 12,
    opacity: 0.8,
  },
});
