import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Archive, User, Settings } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import { colors } from '../theme/colors';
import { HomeScreen } from '../screens/HomeScreen';
import { ArchiveScreen } from '../screens/ArchiveScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export function BottomTabNavigator() {
  const colorScheme = useColorScheme();
  const currentColors = colorScheme === 'dark' ? colors.dark : colors.light;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: currentColors.card,
          borderTopWidth: 0,
          elevation: 10,
          position: 'absolute',
          bottom: 30,
          left: 40,
          right: 40,
          height: 70,
          borderRadius: 25,
          borderWidth: 1,
          borderColor: currentColors.border + '20',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          paddingBottom: 0,
        },
        tabBarActiveTintColor: currentColors.primary,
        tabBarInactiveTintColor: currentColors.mutedForeground + '60',
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Archive" 
        component={ArchiveScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Archive color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
