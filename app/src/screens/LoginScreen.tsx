import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';

type Mode = 'login' | 'signup' | 'forgot';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || (!password && mode !== 'forgot')) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await sendPasswordResetEmail(auth, email);
        Alert.alert('Амжилттай', 'Нууц үг сэргээх линк и-мэйлд илгээлээ.');
        setMode('login');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Алдаа гарлаа.';
      Alert.alert('Алдаа', msg.replace('Firebase: ', '').replace(/\s*\(auth\/.*\)/, ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Товч</Text>
      <Text style={styles.subtitle}>
        {mode === 'login' ? 'Нэвтрэх' : mode === 'signup' ? 'Бүртгүүлэх' : 'Нууц үг сэргээх'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="И-мэйл"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {mode !== 'forgot' && (
        <TextInput
          style={styles.input}
          placeholder="Нууц үг"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      )}

      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>
            {mode === 'login' ? 'Нэвтрэх' : mode === 'signup' ? 'Бүртгүүлэх' : 'Линк илгээх'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.links}>
        {mode === 'login' && (
          <>
            <TouchableOpacity onPress={() => setMode('signup')}>
              <Text style={styles.link}>Бүртгэл үүсгэх</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('forgot')}>
              <Text style={styles.link}>Нууц үг мартсан?</Text>
            </TouchableOpacity>
          </>
        )}
        {(mode === 'signup' || mode === 'forgot') && (
          <TouchableOpacity onPress={() => setMode('login')}>
            <Text style={styles.link}>← Нэвтрэх</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f9fafb' },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: '#4f46e5', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  links: { alignItems: 'center', gap: 12, marginTop: 20 },
  link: { color: '#4f46e5', fontSize: 14 },
});
