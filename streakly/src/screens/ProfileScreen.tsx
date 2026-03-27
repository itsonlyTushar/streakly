import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, useColorScheme, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { auth } from '../lib/firebase';
import { LogOut } from 'lucide-react-native';

export function ProfileScreen() {
  const colorScheme = useColorScheme();
  const currentColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const user = auth().currentUser;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentColors.primary }]}>Profile</Text>
      </View>
      <View style={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
          <Text style={[styles.userName, { color: currentColors.primary }]}>{user?.displayName || 'User'}</Text>
          <Text style={[styles.userEmail, { color: currentColors.mutedForeground }]}>{user?.email}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: currentColors.destructive + '15' }]}
          onPress={() => auth().signOut()}
        >
          <LogOut color={currentColors.destructive} size={20} />
          <Text style={[styles.logoutText, { color: currentColors.destructive }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, marginTop: 20 },
  title: { fontSize: 48, fontFamily: 'GravitasOne-Regular', letterSpacing: -2 },
  content: { flex: 1, padding: 20, gap: 20 },
  profileCard: {
    padding: 30,
    borderRadius: 30,
    borderWidth: 1,
  },
  userName: { fontSize: 24, fontWeight: '700' },
  userEmail: { fontSize: 14, marginTop: 5 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 20,
    gap: 10,
  },
  logoutText: { fontWeight: '700' },
});
