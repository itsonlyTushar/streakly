import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, CalendarDays, Brain, Code, Cpu, User } from 'lucide-react-native';
import { useColors } from '../theme/useColors';
import { HomeScreen } from '../screens/HomeScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { SRSScreen } from '../screens/SRSScreen';
import { DSAScreen } from '../screens/DSAScreen';
import { MachineCodingScreen } from '../screens/MachineCodingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export function BottomTabNavigator() {
  const colors = useColors();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          elevation: 10,
          position: 'absolute',
          bottom: 30,
          left: 20,
          right: 20,
          height: 70,
          borderRadius: 25,
          borderWidth: 1,
          borderColor: colors.border + '20',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          paddingBottom: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground + '60',
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} /> }}
      />
      <Tab.Screen
        name="SRS"
        component={SRSScreen}
        options={{ tabBarIcon: ({ color, size }) => <Brain color={color} size={size} /> }}
      />
      <Tab.Screen
        name="DSA"
        component={DSAScreen}
        options={{ tabBarIcon: ({ color, size }) => <Code color={color} size={size} /> }}
      />
      <Tab.Screen
        name="MachineCoding"
        component={MachineCodingScreen}
        options={{ tabBarIcon: ({ color, size }) => <Cpu color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
