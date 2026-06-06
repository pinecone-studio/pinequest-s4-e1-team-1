import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

import { auth } from './src/firebase';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import RecordScreen from './src/screens/RecordScreen';
import TasksScreen from './src/screens/TasksScreen';
import ReportScreen from './src/screens/ReportScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AboutScreen from './src/screens/AboutScreen';
import AccountSettingsScreen from './src/screens/AccountSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SettingsStackNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTitleStyle: { fontWeight: '700', color: colors.headerText },
        headerTintColor: colors.headerText,
      }}
    >
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
        options={{ title: 'Бүртгэлийн Тохиргоо' }}
      />
      <Stack.Screen
        name="AboutScreen"
        component={AboutScreen}
        options={{ title: 'Аппликейшний Тайлбар' }}
      />
    </Stack.Navigator>
  );
}

function App() {
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
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

  return <AppTabs />;
}

function AppTabs() {
  const { colors, isDark } = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Tab.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.headerBg },
            headerTitleStyle: { fontWeight: '700', color: colors.headerText },
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: {
              backgroundColor: colors.tabBg,
              borderTopColor: colors.tabBorder,
              borderTopWidth: 1,
              paddingBottom: 4, height: 60,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
          }}
        >
          <Tab.Screen name="Record" component={RecordScreen} options={{
            title: 'Бичих',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center', width: 34, height: 34,
                borderRadius: 17, backgroundColor: focused ? '#6366f1' : 'transparent',
              }}>
                <Ionicons name={focused ? 'mic' : 'mic-outline'} size={20} color={focused ? '#fff' : color} />
              </View>
            ),
          }} />
          <Tab.Screen name="Tasks" component={TasksScreen} options={{
            title: 'Даалгавар',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'checkbox' : 'checkbox-outline'} size={24} color={color} />
            ),
          }} />
          <Tab.Screen name="Report" component={ReportScreen} options={{
            title: 'Тайлан',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={24} color={color} />
            ),
          }} />
          <Tab.Screen name="Settings" component={SettingsStackNavigator} options={{
            title: 'Тохиргоо',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={24} color={color} />
            ),
          }} />
        </Tab.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default function AppWithTheme() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}
