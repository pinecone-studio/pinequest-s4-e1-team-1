import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "expo-vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { updatePassword } from "firebase/auth";
import { auth } from "../firebase";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type ChangePasswordScreenNavigationProp = NativeStackNavigationProp<any, "ChangePassword">;

interface ChangePasswordScreenProps {
  navigation: ChangePasswordScreenNavigationProp;
}

export default function ChangePasswordScreen({ navigation }: ChangePasswordScreenProps) {
  const { colors: C } = useTheme();
  const user = auth.currentUser;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!user) {
      Alert.alert("Алдаа", "Хэрэглэгчийн мэдээлэл олдсонгүй");
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Анхааруулга", "Нүүдсэн бүх талбарыг бөглөнө үү");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Анхааруулга", "Нууц үг 6 эсвэл түүнээс дээш тэмдэгт байх ёстой");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Анхааруулга", "Нууц үг үл таарч байна");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(user, newPassword);
      Alert.alert("Амжилттай", "Нууц үг амжилттай өөрчлөгдлөө", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Alert.alert("Алдаа", error.message || "Нууц үг өөрчлөхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[s.container, { backgroundColor: C.bg }]} contentContainerStyle={s.content}>
      <View style={s.header}>
        <View style={[s.headerIcon, { backgroundColor: C.accentLight }]}>
          <Feather name="key" size={32} color={C.accent} />
        </View>
        <Text style={[s.headerTitle, { color: C.text }]}>Нууц үг өөрчлөх</Text>
        <Text style={[s.headerSubtitle, { color: C.textMuted }]}>
          Таны бүртгэлийн нууц үгийг шинэчлээрэй
        </Text>
      </View>

      <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: C.textSec }]}>Шинэ нууц үг</Text>
          <View style={[s.inputContainer, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
            <TextInput
              style={[s.input, { color: C.text }]}
              placeholder="6+ тэмдэгт"
              placeholderTextColor={C.textMuted}
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={20}
                color={C.textMuted}
              />
            </TouchableOpacity>
          </View>
          <Text style={[s.hint, { color: C.textMuted }]}>
            Наад зах нь 6 тэмдэгт, том ба жижиг үсэг орсон байх сайн
          </Text>
        </View>

        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: C.textSec }]}>Нууц үгийг дахин оруулна уу</Text>
          <View style={[s.inputContainer, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
            <TextInput
              style={[s.input, { color: C.text }]}
              placeholder="Нууц үгээ баталгаажуул"
              placeholderTextColor={C.textMuted}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Feather
                name={showConfirmPassword ? "eye" : "eye-off"}
                size={20}
                color={C.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.infoBox}>
          <Feather name="info" size={18} color={C.accent} />
          <Text style={[s.infoText, { color: C.text }]}>
            Нууц үг өөрчлөгдсөний дараа та дахин нэвтрэх хэрэгтэй болно
          </Text>
        </View>

        <TouchableOpacity
          style={[s.button, { backgroundColor: C.accent, borderColor: C.accent }]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="save" size={18} color="#fff" />
              <Text style={s.buttonText}>Нууц үг өөрчлөх</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 32 },
  header: { alignItems: "center", marginBottom: 32 },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  headerSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 24 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  input: { flex: 1, fontSize: 14, marginRight: 8 },
  hint: { fontSize: 11, marginTop: 6 },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  infoText: { fontSize: 13, flex: 1, lineHeight: 18 },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
