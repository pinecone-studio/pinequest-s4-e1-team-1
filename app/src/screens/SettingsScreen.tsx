import { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Switch,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "expo-vector-icons";
import { signOut, deleteUser } from "firebase/auth";
import { auth } from "../firebase";
import { useTheme } from "../theme/ThemeContext";

interface SettingItem {
  iconName: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}

type SettingsScreenNavigationProp = NativeStackNavigationProp<any, "SettingsMain">;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [loading, setLoading] = useState(false);
  const { isDark, toggleTheme, colors: C } = useTheme();

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
      title: "Бүртгэлийн Тохиргоо",
      description: "Нэр, И-мэйл, нууц үг",
      onPress: () => navigation.navigate("AccountSettings" as any),
    },
    {
      iconName: "moon",
      title: isDark ? "Хар горим" : "Цагаан горим",
      description: "Дэлгэцийн сэдэв",
      onPress: toggleTheme,
    },
    {
      iconName: "lock",
      title: "Нууцлал & Аюулгүй Байдал",
      description: "Өгөгдлийн хамгаалалт",
      onPress: () =>
        Alert.alert("Удахгүй", "Нууцлалын тохиргоо удахгүй нэмэгдэх болно"),
    },
    {
      iconName: "globe",
      title: "Хэл",
      description: "Таны хэлийг сонгоно уу",
      onPress: () =>
        Alert.alert("Удахгүй", "Хэлний тохиргоо удахгүй нэмэгдэх болно"),
    },
    {
      iconName: "help-circle",
      title: "Туслалцаа & Дэмжлэг",
      description: "Түгээмэл асуултууд",
      onPress: () =>
        Alert.alert("Удахгүй", "Туслалцаа удахгүй нэмэгдэх болно"),
    },
    {
      iconName: "info",
      title: "Аппликейшний Тайлбар",
      description: "Хувилбар & мэдээлэл",
      onPress: () => navigation.navigate("AboutScreen" as any),
    },
  ];

  return (
    <ScrollView
      style={[s.container, { backgroundColor: C.bg }]}
      contentContainerStyle={s.contentContainer}
    >
      <Text style={[s.title, { color: C.text }]}>Тохиргоо</Text>

      <View style={[s.settingsGroup, { backgroundColor: C.surface, borderColor: C.border }]}>
        {settingItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              s.settingItem,
              index !== settingItems.length - 1 && [s.settingItemBorder, { borderBottomColor: C.border }],
            ]}
            onPress={item.onPress}
          >
            <View style={[s.iconContainer, { backgroundColor: C.accentLight }]}>
              <Feather name={item.iconName} size={20} color={C.accent} />
            </View>
            <View style={s.settingContent}>
              <Text style={[s.settingTitle, { color: C.text }]}>{item.title}</Text>
              <Text style={[s.settingDescription, { color: C.textMuted }]}>{item.description}</Text>
            </View>
            {item.iconName === 'moon' ? (
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: C.border, true: C.accent }}
                thumbColor="#fff"
              />
            ) : (
              <Feather name="chevron-right" size={20} color={C.textMuted} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[s.logoutBtn, { backgroundColor: C.surface, borderColor: C.border }]}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={18} color={C.textSec} />
        <Text style={[s.logoutText, { color: C.textSec }]}>Гарах</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.deleteBtn}
        onPress={handleDeleteAccount}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#dc2626" />
        ) : (
          <>
            <Feather name="trash-2" size={18} color="#dc2626" />
            <Text style={s.deleteText}>Бүртгэл устгах</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={[s.deleteHint, { color: C.textMuted }]}>Устгасны дараа буцаах боломжгүй</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 24, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 24, marginTop: 8 },
  settingsGroup: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingItemBorder: { borderBottomWidth: 1 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  settingDescription: { fontSize: 13 },
  logoutBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 12,
    gap: 10,
  },
  logoutText: { fontSize: 15, fontWeight: "600" },
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
  deleteText: { fontSize: 15, fontWeight: "600", color: "#dc2626" },
  deleteHint: { fontSize: 12, textAlign: "center" },
});
