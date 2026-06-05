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

export default function AccountSettingsScreen() {
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
      Alert.alert(
        "Анхааруулга",
        "Нууц үг 6 эсвэл түүнээс дээш тэмдэгт байх ёстой",
      );
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Профайлын Мэдээлэл</Text>

        <View style={styles.infoCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Нэр</Text>
            <TextInput
              style={styles.input}
              placeholder="Таны нэр"
              placeholderTextColor="#9ca3af"
              value={displayName}
              onChangeText={setDisplayName}
              editable={!loading}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>И-мэйл</Text>
            <View style={styles.emailField}>
              <Feather name="mail" size={18} color="#4f46e5" />
              <Text style={styles.emailText}>{email}</Text>
            </View>
            <Text style={styles.emailHint}>И-мэйл өөрчлөх боломжгүй</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="save" size={18} color="#fff" />
                <Text style={styles.buttonText}>Хадгалах</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Нууц үг</Text>

        {!showPasswordField ? (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setShowPasswordField(true)}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Нууц үг өөрчлөх</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.infoCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Шинэ Нууц үг</Text>
              <TextInput
                style={styles.input}
                placeholder="6+ тэмдэгт"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!loading}
              />
              <Text style={styles.hint}>
                6 эсвэл түүнээс дээш тэмдэгт байх ёстой
              </Text>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, { flex: 1 }]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="check" size={18} color="#fff" />
                    <Text style={styles.buttonText}>Хадгалах</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { flex: 1 }]}
                onPress={() => {
                  setShowPasswordField(false);
                  setNewPassword("");
                }}
                disabled={loading}
              >
                <Feather name="x" size={18} color="#6b7280" />
                <Text style={styles.cancelButtonText}>Болих</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Бүртгэлийн Мэдээлэл</Text>
        <View style={styles.infoList}>
          <InfoRow
            icon="calendar"
            label="Бүртгэлийн Огноо"
            value={
              user?.metadata?.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString(
                    "mn-MN",
                  )
                : "Үл мэдэгдэх"
            }
          />
          <InfoRow
            icon="check-circle"
            label="И-мэйл Баталгаажаа"
            value={user?.emailVerified ? "Баталгаажсан" : "Баталгаажаагүй"}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <Feather name={icon as any} size={18} color="#4f46e5" />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 24, paddingBottom: 32 },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
  },
  fieldGroup: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#111",
  },
  emailField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  emailText: {
    fontSize: 14,
    color: "#111",
  },
  emailHint: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 6,
  },
  hint: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 6,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    borderWidth: 1,
    borderColor: "#4f46e5",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  secondaryButtonText: {
    color: "#4f46e5",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  infoList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  infoValue: {
    fontSize: 13,
    color: "#6b7280",
  },
});
