import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { LoginScreen } from '../screens/LoginScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const colorScheme = useColorScheme();
  const currentColors = colorScheme === 'dark' ? colors.dark : colors.light;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth(), (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: currentColors.background }}>
        <ActivityIndicator size="large" color={currentColors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={BottomTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
