import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "expo-vector-icons";
import { auth } from "../firebase";
import { updateProfile, updatePassword } from "firebase/auth";
import { useTheme } from "../theme/ThemeContext";

export default function AccountSettingsScreen() {
  const { colors: C } = useTheme();
  const user = auth.currentUser;
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
        Alert.alert("Амжилттай", "Нэр амжилттай шинэчлэгдлээ");
      }
    } catch (error: any) {
      Alert.alert("Алдаа", error.message || "Профайл шинэчлэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !newPassword.trim()) {
      Alert.alert("Анхааруулга", "Шинэ нууц үг оруулна уу");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Анхааруулга", "Нууц үг 6 эсвэл түүнээс дээш тэмдэгт байх ёстой");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(user, newPassword);
      setNewPassword("");
      setShowPasswordField(false);
      Alert.alert("Амжилттай", "Нууц үг амжилттай өөрчлөгдлөө");
    } catch (error: any) {
      Alert.alert("Алдаа", error.message || "Нууц үг өөрчлөхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[s.container, { backgroundColor: C.bg }]} contentContainerStyle={s.content}>
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: C.text }]}>Профайлын Мэдээлэл</Text>

        <View style={[s.infoCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={s.fieldGroup}>
            <Text style={[s.label, { color: C.textSec }]}>Нэр</Text>
            <TextInput
              style={[s.input, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
              placeholder="Таны нэр"
              placeholderTextColor={C.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              editable={!loading}
            />
          </View>

          <View style={s.fieldGroup}>
            <Text style={[s.label, { color: C.textSec }]}>И-мэйл</Text>
            <View style={[s.emailField, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
              <Feather name="mail" size={18} color={C.accent} />
              <Text style={[s.emailText, { color: C.text }]}>{email}</Text>
            </View>
            <Text style={[s.emailHint, { color: C.textMuted }]}>И-мэйл өөрчлөх боломжгүй</Text>
          </View>

          <TouchableOpacity
            style={[s.button, s.primaryButton, { backgroundColor: C.accent, borderColor: C.accent }]}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="save" size={18} color="#fff" />
                <Text style={s.buttonText}>Хадгалах</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: C.text }]}>Нууц үг</Text>

        {!showPasswordField ? (
          <TouchableOpacity
            style={[s.button, s.secondaryButton, { backgroundColor: C.surface, borderColor: C.border }]}
            onPress={() => setShowPasswordField(true)}
            disabled={loading}
          >
            <Text style={[s.secondaryButtonText, { color: C.accent }]}>Нууц үг өөрчлөх</Text>
          </TouchableOpacity>
        ) : (
          <View style={[s.infoCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: C.textSec }]}>Шинэ Нууц үг</Text>
              <TextInput
                style={[s.input, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
                placeholder="6+ тэмдэгт"
                placeholderTextColor={C.textMuted}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!loading}
              />
              <Text style={[s.hint, { color: C.textMuted }]}>6 эсвэл түүнээс дээш тэмдэгт байх ёстой</Text>
            </View>

            <View style={s.buttonGroup}>
              <TouchableOpacity
                style={[s.button, s.primaryButton, { flex: 1, backgroundColor: C.accent, borderColor: C.accent }]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="check" size={18} color="#fff" />
                    <Text style={s.buttonText}>Хадгалах</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.button, s.cancelButton, { flex: 1, backgroundColor: C.surface, borderColor: C.border }]}
                onPress={() => { setShowPasswordField(false); setNewPassword(""); }}
                disabled={loading}
              >
                <Feather name="x" size={18} color={C.textSec} />
                <Text style={[s.cancelButtonText, { color: C.textSec }]}>Болих</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: C.text }]}>Бүртгэлийн Мэдээлэл</Text>
        <View style={[s.infoList, { backgroundColor: C.surface, borderColor: C.border }]}>
          <InfoRow icon="calendar" label="Бүртгэлийн Огноо" value={
            user?.metadata?.creationTime
              ? new Date(user.metadata.creationTime).toLocaleDateString("mn-MN")
              : "Үл мэдэгдэх"
          } colors={C} />
          <InfoRow icon="check-circle" label="И-мэйл Баталгаажаа" value={user?.emailVerified ? "Баталгаажсан" : "Баталгаажаагүй"} colors={C} />
        </View>
      </View>
    </ScrollView>
  );
}

type ColorsArg = ReturnType<typeof useTheme>['colors'];

function InfoRow({ icon, label, value, colors: C }: { icon: string; label: string; value: string; colors: ColorsArg }) {
  return (
    <View style={[s.infoRow, { borderBottomColor: C.border }]}>
      <View style={s.infoRowLeft}>
        <Feather name={icon as any} size={18} color={C.accent} />
        <Text style={[s.infoLabel, { color: C.text }]}>{label}</Text>
      </View>
      <Text style={[s.infoValue, { color: C.textSec }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 32 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  infoCard: { borderRadius: 12, borderWidth: 1, padding: 16 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 6, textTransform: "uppercase" },
  input: { borderRadius: 8, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12, fontSize: 14 },
  emailField: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12, gap: 8 },
  emailText: { fontSize: 14 },
  emailHint: { fontSize: 11, marginTop: 6 },
  hint: { fontSize: 11, marginTop: 6 },
  button: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryButton: { borderWidth: 1 },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  secondaryButton: { borderWidth: 1 },
  secondaryButtonText: { fontSize: 14, fontWeight: "600" },
  cancelButton: { borderWidth: 1 },
  cancelButtonText: { fontSize: 14, fontWeight: "600" },
  buttonGroup: { flexDirection: "row", gap: 8 },
  infoList: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  infoRowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  infoLabel: { fontSize: 14, fontWeight: "600" },
  infoValue: { fontSize: 13 },
});
