import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { onAuthStateChanged, User } from 'firebase/auth';

import { auth } from './src/firebase';
import LoginScreen from './src/screens/LoginScreen';
import RecordScreen from './src/screens/RecordScreen';
import TasksScreen from './src/screens/TasksScreen';
import ReportScreen from './src/screens/ReportScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <StatusBar style="dark" />
        <LoginScreen />
      </>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          <Tab.Screen name="Record"   component={RecordScreen}   options={{ title: 'Бичих',    tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎙</Text>  }} />
          <Tab.Screen name="Tasks"    component={TasksScreen}    options={{ title: 'Даалгавар', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>✅</Text>  }} />
          <Tab.Screen name="Report"   component={ReportScreen}   options={{ title: 'Тайлан',   tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text>  }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Тохиргоо', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text> }} />
        </Tab.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
