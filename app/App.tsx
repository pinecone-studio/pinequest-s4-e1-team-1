import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { onAuthStateChanged, User } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "./src/firebase";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import LoginScreen from "./src/screens/LoginScreen";
import RecordScreen from "./src/screens/RecordScreen";
import TasksScreen from "./src/screens/TasksScreen";
import ReportScreen from "./src/screens/ReportScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import AboutScreen from "./src/screens/AboutScreen";
import AccountSettingsScreen from "./src/screens/AccountSettingsScreen";
import CalendarScreen from "./src/screens/CalendarScreen";
import FriendsScreen from "./src/screens/FriendsScreen";
import HelpScreen from "./src/screens/HelpScreen";
import PrivacySecurityScreen from "./src/screens/PrivacySecurityScreen";
import ChangePasswordScreen from "./src/screens/ChangePasswordScreen";
import { useTaskNotifications } from "./src/hooks/useTaskNotifications";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function SettingsStackNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTitleStyle: { fontWeight: "700", color: colors.headerText },
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
        options={{ title: "Бүртгэлийн Тохиргоо" }}
      />
      <Stack.Screen
        name="AboutScreen"
        component={AboutScreen}
        options={{ title: "Аппликейшний Тайлбар" }}
      />
      <Stack.Screen
        name="HelpScreen"
        component={HelpScreen}
        options={{ title: "Туслалцаа & Дэмжлэг" }}
      />
      <Stack.Screen
        name="PrivacySecurity"
        component={PrivacySecurityScreen}
        options={{ title: "Нууцлал & Аюулгүй байдал" }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: "Нууц үг өөрчлөх" }}
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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FAFAFA",
        }}
      >
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
  useTaskNotifications();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Tab.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.headerBg },
            headerTitleStyle: { fontWeight: "700", color: colors.headerText },
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: {
              backgroundColor: colors.tabBg,
              borderTopColor: colors.tabBorder,
              borderTopWidth: 1,
              paddingTop: 4,
            },
            tabBarLabelStyle: {
              fontSize: 9,
              fontWeight: "600",
              marginBottom: 0,
              letterSpacing: -0.4,
            },
            tabBarItemStyle: {
              paddingHorizontal: 0,
            },
          }}
        >
          <Tab.Screen
            name="Record"
            component={RecordScreen}
            options={{
              title: "Бичих",
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "mic" : "mic-outline"}
                  size={24}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Tasks"
            component={TasksScreen}
            options={{
              title: "Даалгавар",
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "checkbox" : "checkbox-outline"}
                  size={24}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{
              title: "Хуанли",
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "calendar" : "calendar-outline"}
                  size={24}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Report"
            component={ReportScreen}
            options={{
              title: "Тайлан",
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "bar-chart" : "bar-chart-outline"}
                  size={24}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Friends"
            component={FriendsScreen}
            options={{
              title: "Найзууд",
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "people" : "people-outline"}
                  size={24}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsStackNavigator}
            options={{
              title: "Тохиргоо",
              headerShown: false,
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? "person-circle" : "person-circle-outline"}
                  size={24}
                  color={color}
                />
              ),
            }}
          />
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
