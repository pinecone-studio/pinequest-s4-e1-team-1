import React from 'react'; // required for JSX transform
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';

import RecordScreen from './src/screens/RecordScreen';
import TasksScreen from './src/screens/TasksScreen';
import ReportScreen from './src/screens/ReportScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: '700' },
          tabBarActiveTintColor: '#4f46e5',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: { borderTopColor: '#e5e7eb' },
        }}
      >
        <Tab.Screen
          name="Record"
          component={RecordScreen}
          options={{
            title: 'Бичих',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎙</Text>,
          }}
        />
        <Tab.Screen
          name="Tasks"
          component={TasksScreen}
          options={{
            title: 'Даалгавар',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>✅</Text>,
          }}
        />
        <Tab.Screen
          name="Report"
          component={ReportScreen}
          options={{
            title: 'Тайлан',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
