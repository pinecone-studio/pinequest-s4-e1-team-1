import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { Feather } from "expo-vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { auth } from "../firebase";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type PrivacySecurityScreenNavigationProp = NativeStackNavigationProp<any, "PrivacySecurity">;

interface PrivacySecurityScreenProps {
  navigation: PrivacySecurityScreenNavigationProp;
}

export default function PrivacySecurityScreen({ navigation }: PrivacySecurityScreenProps) {
  const { colors: C } = useTheme();
  const user = auth.currentUser;

  const menuItems = [
    {
      icon: "file-text",
      title: "Privacy Policy",
      description: "Бидний нууцлалын бодлого",
      onPress: () => Linking.openURL("https://pinequest.io/privacy"),
    },
    {
      icon: "file-text",
      title: "Terms of Service",
      description: "Үйлчилгээний нөхцөл",
      onPress: () => Linking.openURL("https://pinequest.io/terms"),
    },
    {
      icon: "key",
      title: "Change Password",
      description: "Нууц үг өөрчлөх",
      onPress: () => navigation.navigate("ChangePassword" as any),
    },
  
    {
      icon: "trash-2",
      title: "Delete Account",
      description: "Бүртгэлээ бүрэн устгах",
      onPress: () =>
        Alert.alert(
          "Бүртгэл устгах",
          "Та итгэлтэй байна уу? Таны бүх өгөгдөл устана.",
          [
            { text: "Болих", style: "cancel" },
            {
              text: "Устгах",
              style: "destructive",
              onPress: async () => {
                try {
                  if (auth.currentUser) await auth.currentUser.delete();
                } catch (err: any) {
                  Alert.alert("Алдаа", err.message || "Алдаа гарлаа");
                }
              },
            },
          ]
        ),
    },

  ];

  return (
    <ScrollView style={[s.container, { backgroundColor: C.bg }]} contentContainerStyle={s.content}>
      <Text style={[s.title, { color: C.text }]}>Нууцлал & Аюулгүй байдал</Text>

      <View style={[s.menuGroup, { backgroundColor: C.surface, borderColor: C.border }]}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              s.menuItem,
              index !== menuItems.length - 1 && [s.menuItemBorder, { borderBottomColor: C.border }],
            ]}
            onPress={item.onPress}
          >
            <View style={[s.iconContainer, { backgroundColor: C.accentLight }]}>
              <Feather name={item.icon as any} size={20} color={C.accent} />
            </View>
            <View style={s.menuContent}>
              <Text style={[s.menuTitle, { color: C.text }]}>{item.title}</Text>
              <Text style={[s.menuDescription, { color: C.textMuted }]}>{item.description}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={C.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 24, marginTop: 8 },
  menuGroup: { borderRadius: 12, borderWidth: 1, marginBottom: 24, overflow: "hidden" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuItemBorder: { borderBottomWidth: 1 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  menuDescription: { fontSize: 13 },
});
