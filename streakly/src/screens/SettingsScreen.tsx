import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, useColorScheme } from 'react-native';
import { colors } from '../theme/colors';

export function SettingsScreen() {
  const colorScheme = useColorScheme();
  const currentColors = colorScheme === 'dark' ? colors.dark : colors.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentColors.primary }]}>Settings</Text>
      </View>
      <View style={styles.content}>
        <Text style={{ color: currentColors.mutedForeground }}>Settings coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, marginTop: 20 },
  title: { fontSize: 48, fontFamily: 'GravitasOne-Regular', letterSpacing: -2 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
