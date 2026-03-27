import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, useColorScheme } from 'react-native';
import { colors } from '../theme/colors';

export function ArchiveScreen() {
  const colorScheme = useColorScheme();
  const currentColors = colorScheme === 'dark' ? colors.dark : colors.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentColors.primary }]}>Archive</Text>
        <Text style={[styles.subtitle, { color: currentColors.mutedForeground }]}>
          Your past achievements.
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={{ color: currentColors.mutedForeground }}>No archived goals yet.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, marginTop: 20 },
  title: { fontSize: 48, fontFamily: 'GravitasOne-Regular', letterSpacing: -2 },
  subtitle: { fontSize: 16, marginLeft: 2, marginTop: 5 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
