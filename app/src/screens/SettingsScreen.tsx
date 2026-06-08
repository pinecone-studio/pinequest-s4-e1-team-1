import { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "expo-vector-icons";
import { signOut, deleteUser } from "firebase/auth";
import { auth } from "../firebase";
import { deleteUserData } from "../api";
import { useTheme } from "../theme/ThemeContext";

type Nav = NativeStackNavigationProp<any, "SettingsMain">;

export default function SettingsScreen({ navigation }: { navigation: Nav }) {
  const [loading, setLoading] = useState(false);
  const { isDark, toggleTheme, colors: C } = useTheme();

  const user = auth.currentUser;

  const handleLogout = async () => {
    Alert.alert("Гарах", "Гарахдаа итгэлтэй байна уу?", [
      { text: "Болих", style: "cancel" },
      { text: "Гарах", style: "destructive", onPress: async () => { await signOut(auth); } },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert("Бүртгэл устгах", "Таны бүх өгөгдөл устана. Та итгэлтэй байна уу?", [
      { text: "Болих", style: "cancel" },
      {
        text: "Устгах", style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await deleteUserData().catch(() => {});
            if (auth.currentUser) await deleteUser(auth.currentUser);
          } catch (err: any) {
            if (err?.code === 'auth/requires-recent-login') {
              Alert.alert("Дахин нэвтрэх шаардлагатай", "Аюулгүй байдлын үүднээс аккаунт устгахын өмнө дахин нэвтэрнэ үү.");
            } else {
              Alert.alert("Алдаа", err instanceof Error ? err.message : "Алдаа гарлаа.");
            }
          } finally { setLoading(false); }
        },
      },
    ]);
  };

  const groups: { title: string; items: { icon: keyof typeof Feather.glyphMap; label: string; sub?: string; onPress: () => void; right?: "arrow" | "switch" }[] }[] = [
    {
      title: "Бүртгэл",
      items: [
        { icon: "user", label: "Бүртгэлийн тохиргоо", sub: user?.email ?? "", onPress: () => navigation.navigate("AccountSettings") },
      ],
    },
    {
      title: "Дүр төрх",
      items: [
        { icon: isDark ? "moon" : "sun", label: isDark ? "Харанхуй горим" : "Гэрэл горим", sub: "Өнгөний загвар", onPress: toggleTheme, right: "switch" },
      ],
    },
    {
      title: "Аюулгүй байдал",
      items: [
        { icon: "lock", label: "Нууцлал & Аюулгүй байдал", sub: "Өгөгдлийн хамгаалалт", onPress: () => navigation.navigate("PrivacySecurity") },
      ],
    },
    {
      title: "Тусламж",
      items: [
        { icon: "help-circle", label: "Туслалцаа & Дэмжлэг", sub: "Асуулт, тусламж", onPress: () => navigation.navigate("HelpScreen") },
        { icon: "info", label: "Аппын тухай", sub: "Хувилбар & мэдээлэл", onPress: () => navigation.navigate("AboutScreen") },
      ],
    },
  ];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={[s.title, { color: C.text }]}>Тохиргоо</Text>
        </View>

        {/* Profile card */}
        <TouchableOpacity
          style={[s.profileCard, { backgroundColor: C.surface, borderColor: C.border }]}
          onPress={() => navigation.navigate("AccountSettings")}
          activeOpacity={0.8}
        >
          <View style={[s.avatar, { backgroundColor: C.accentLight }]}>
            <Feather name="user" size={22} color={C.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.profileName, { color: C.text }]}>
              {user?.displayName ?? "Хэрэглэгч"}
            </Text>
            <Text style={[s.profileEmail, { color: C.textMuted }]} numberOfLines={1}>
              {user?.email ?? ""}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={C.textMuted} />
        </TouchableOpacity>

        {/* Setting groups */}
        {groups.map((group) => (
          <View key={group.title} style={s.group}>
            <Text style={[s.groupTitle, { color: C.textMuted }]}>{group.title}</Text>
            <View style={[s.groupCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              {group.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    s.row,
                    idx < group.items.length - 1 && [s.rowBorder, { borderBottomColor: C.border }],
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[s.iconWrap, { backgroundColor: C.accentLight }]}>
                    <Feather name={item.icon} size={17} color={C.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.rowLabel, { color: C.text }]}>{item.label}</Text>
                    {item.sub ? (
                      <Text style={[s.rowSub, { color: C.textMuted }]} numberOfLines={1}>{item.sub}</Text>
                    ) : null}
                  </View>
                  {item.right === "switch" ? (
                    <Switch
                      value={isDark}
                      onValueChange={toggleTheme}
                      trackColor={{ false: C.border, true: C.accent }}
                      thumbColor="#fff"
                    />
                  ) : (
                    <Feather name="chevron-right" size={17} color={C.textMuted} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity
          style={[s.logoutBtn, { backgroundColor: C.surface, borderColor: C.border }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={17} color={C.textSec} />
          <Text style={[s.logoutText, { color: C.textSec }]}>Гарах</Text>
        </TouchableOpacity>

        {/* Delete account */}
        <TouchableOpacity
          style={[s.deleteBtn]}
          onPress={handleDeleteAccount}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator size="small" color="#dc2626" />
            : <>
                <Feather name="trash-2" size={15} color="#dc2626" />
                <Text style={s.deleteText}>Бүртгэл устгах</Text>
              </>
          }
        </TouchableOpacity>

        <Text style={[s.version, { color: C.textMuted }]}>MonTask v1.0.0 · 2026</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  header: { paddingTop: 12, paddingBottom: 20 },
  title:  { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },

  profileCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 28,
  },
  avatar: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  profileName:  { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  profileEmail: { fontSize: 12 },

  group:      { marginBottom: 20 },
  groupTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, marginLeft: 4 },
  groupCard:  { borderRadius: 16, borderWidth: 1, overflow: "hidden" },

  row:       { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1 },
  iconWrap:  { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowLabel:  { fontSize: 14, fontWeight: "600" },
  rowSub:    { fontSize: 11, marginTop: 1 },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 14, borderWidth: 1, paddingVertical: 14,
    marginBottom: 10,
  },
  logoutText: { fontSize: 14, fontWeight: "600" },

  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, marginBottom: 16,
  },
  deleteText: { fontSize: 13, color: "#dc2626" },

  version: { fontSize: 11, textAlign: "center", marginBottom: 4 },
});
