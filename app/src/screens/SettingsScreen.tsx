import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { signOut, deleteUser } from 'firebase/auth';
import { auth } from '../firebase';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Бүртгэл устгах',
      'Таны бүх өгөгдөл устана. Та итгэлтэй байна уу?',
      [
        { text: 'Болих', style: 'cancel' },
        {
          text: 'Устгах',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              if (auth.currentUser) await deleteUser(auth.currentUser);
            } catch (err: unknown) {
              Alert.alert('Алдаа', err instanceof Error ? err.message : 'Алдаа гарлаа.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Тохиргоо</Text>

      {user?.email && (
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>И-мэйл</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Гарах</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} disabled={loading}>
        {loading ? <ActivityIndicator color="#dc2626" /> : <Text style={styles.deleteText}>Бүртгэл устгах</Text>}
      </TouchableOpacity>
      <Text style={styles.deleteHint}>Устгасны дараа буцааж сэргээх боломжгүй</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f9fafb' },
  title: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 24, marginTop: 8 },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16,
  },
  infoLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { fontSize: 15, color: '#111' },
  logoutBtn: {
    backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 24 },
  deleteBtn: {
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fff5f5',
  },
  deleteText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
  deleteHint: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 8 },
});
