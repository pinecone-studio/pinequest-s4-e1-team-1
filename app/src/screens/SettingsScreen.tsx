import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "expo-vector-icons";
import { signOut, deleteUser } from "firebase/auth";
import { auth } from "../firebase";

interface SettingItem {
  iconName: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  any,
  "SettingsMain"
>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Бүртгэл устгах",
      "Таны бүх өгөгдөл устана. Та итгэлтэй байна уу?",
      [
        { text: "Болих", style: "cancel" },
        {
          text: "Устгах",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              if (auth.currentUser) await deleteUser(auth.currentUser);
            } catch (err: unknown) {
              Alert.alert(
                "Алдаа",
                err instanceof Error ? err.message : "Алдаа гарлаа.",
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const settingItems: SettingItem[] = [
    {
      iconName: "user",
      title: "Account Settings",
      description: "Name, email & password",
      onPress: () => navigation.navigate("AccountSettings" as any),
    },

    {
      iconName: "moon",
      title: "Appearance",
      description: "Theme & calm motion",
      onPress: () =>
        Alert.alert(
          "Coming Soon",
          "Appearance settings will be available soon",
        ),
    },
    {
      iconName: "lock",
      title: "Privacy & Security",
      description: "Data protection & privacy",
      onPress: () =>
        Alert.alert(
          "Coming Soon",
          "Privacy & security settings will be available soon",
        ),
    },

    {
      iconName: "globe",
      title: "Language",
      description: "Select your language",
      onPress: () =>
        Alert.alert("Coming Soon", "Language settings will be available soon"),
    },
    {
      iconName: "help-circle",
      title: "Help & Support",
      description: "FAQs and contact support",
      onPress: () =>
        Alert.alert("Coming Soon", "Help & support will be available soon"),
    },
    {
      iconName: "info",
      title: "About",
      description: "App version & info",
      onPress: () => navigation.navigate("AboutScreen" as any),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.title}>Settings</Text>

      <View style={styles.settingsGroup}>
        {settingItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.settingItem,
              index !== settingItems.length - 1 && styles.settingItemBorder,
            ]}
            onPress={item.onPress}
          >
            <View style={styles.iconContainer}>
              <Feather name={item.iconName} size={20} color="#4f46e5" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              <Text style={styles.settingDescription}>{item.description}</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#d1d5db" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Feather name="log-out" size={18} color="#374151" />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={handleDeleteAccount}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#dc2626" />
        ) : (
          <>
            <Feather name="trash-2" size={18} color="#dc2626" />
            <Text style={styles.deleteText}>Delete account</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={styles.deleteHint}>Cannot be undone</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  contentContainer: { padding: 24, paddingBottom: 32 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginBottom: 24,
    marginTop: 8,
  },
  settingsGroup: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 24,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: "#9ca3af",
  },
  logoutBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
    gap: 10,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  deleteBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fca5a5",
    backgroundColor: "#fff5f5",
    marginBottom: 8,
    gap: 10,
  },
  deleteText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#dc2626",
  },
  deleteHint: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
});
