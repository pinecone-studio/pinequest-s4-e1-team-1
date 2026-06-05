import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform, ScrollView, Dimensions,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';

const { width, height } = Dimensions.get('window');
type EmailMode = 'login' | 'signup' | 'forgot';

function translateFirebaseError(msg: string): string {
  if (msg.includes('email-already-in-use'))   return 'Энэ и-мэйл хаяг аль хэдийн бүртгэлтэй байна.';
  if (msg.includes('weak-password'))          return 'Нууц үг хэт богино байна. 6-аас дээш тэмдэгт оруулна уу.';
  if (msg.includes('user-not-found'))         return 'И-мэйл хаяг олдсонгүй.';
  if (msg.includes('wrong-password') || msg.includes('invalid-credential')) return 'Нууц үг буруу байна.';
  if (msg.includes('invalid-email'))          return 'И-мэйл хаягийн формат буруу байна.';
  if (msg.includes('too-many-requests'))      return 'Хэт олон удаа оролдлоо. Түр хүлээгээд дахин оролдоно уу.';
  if (msg.includes('network-request-failed')) return 'Интернэт холболт байхгүй байна.';
  return 'Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.';
}

export default function LoginScreen() {
  const [emailModal, setEmailModal] = useState(false);
  const [mode, setMode] = useState<EmailMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || (!password && mode !== 'forgot')) return;
    setLoading(true);
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, email, password);
      else if (mode === 'signup') await createUserWithEmailAndPassword(auth, email, password);
      else {
        await sendPasswordResetEmail(auth, email);
        Alert.alert('Амжилттай', 'Нууц үг сэргээх линк илгээлээ.');
        setMode('login');
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : '';
      Alert.alert('Алдаа', translateFirebaseError(raw));
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => { setMode('login'); setEmailModal(true); };

  return (
    <View style={styles.root}>
      {/* Gradient blobs */}
      <View style={[styles.blob, { top: -80, left: -80, width: 260, height: 260, backgroundColor: '#c7d2fe' }]} />
      <View style={[styles.blob, { top: height * 0.22, right: -90, width: 220, height: 220, backgroundColor: '#ddd6fe' }]} />
      <View style={[styles.blob, { bottom: height * 0.22, left: width * 0.15, width: 200, height: 200, backgroundColor: '#bbf7d0' }]} />

      {/* Center content */}
      <View style={styles.center}>
        <View style={styles.iconBg}>
          <Waveform />
        </View>
        <Text style={styles.headline}>{'Бага санаа.\nИлүү хий.'}</Text>
        <Text style={styles.sub}>{'Оюундаа байгаа бүхнийг\nзүгээр л ярьж тэмдэглэ.'}</Text>
      </View>

      {/* Bottom */}
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.googleBtn} onPress={openModal} activeOpacity={0.85}>
          <GoogleLogo />
          <Text style={styles.googleText}>Google-аар үргэлжлүүлэх</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.appleBtn} onPress={openModal} activeOpacity={0.85}>
          <Text style={styles.appleIcon}></Text>
          <Text style={styles.appleText}>Apple-аар үргэлжлүүлэх</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={openModal}>
          <Text style={styles.emailLink}>И-мэйлээр нэвтрэх</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          {'Үргэлжлүүлснээр та манай '}
          <Text style={styles.termsUnder}>Үйлчилгээний нөхцөл</Text>
          {' & '}
          <Text style={styles.termsUnder}>Нууцлалын бодлого</Text>
          {'-г зөвшөөрч байна.'}
        </Text>
      </View>

      {/* Email modal */}
      <Modal visible={emailModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modal} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => setEmailModal(false)} style={styles.closeRow}>
              <Text style={styles.closeX}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              {mode === 'login' ? 'Нэвтрэх' : mode === 'signup' ? 'Бүртгүүлэх' : 'Нууц үг сэргээх'}
            </Text>

            <TextInput style={styles.input} placeholder="И-мэйл" placeholderTextColor="#9ca3af"
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />

            {mode !== 'forgot' && (
              <TextInput style={styles.input} placeholder="Нууц үг" placeholderTextColor="#9ca3af"
                value={password} onChangeText={setPassword} secureTextEntry />
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>
                    {mode === 'login' ? 'Нэвтрэх' : mode === 'signup' ? 'Бүртгүүлэх' : 'Линк илгээх'}
                  </Text>
              }
            </TouchableOpacity>

            <View style={styles.mLinks}>
              {mode === 'login' && <>
                <TouchableOpacity onPress={() => setMode('signup')}><Text style={styles.mLink}>Бүртгэл үүсгэх</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setMode('forgot')}><Text style={styles.mLink}>Нууц үг мартсан?</Text></TouchableOpacity>
              </>}
              {(mode === 'signup' || mode === 'forgot') &&
                <TouchableOpacity onPress={() => setMode('login')}><Text style={styles.mLink}>← Нэвтрэх</Text></TouchableOpacity>
              }
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function Waveform() {
  const bars = [10, 18, 26, 20, 14, 22, 16];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      {bars.map((h, i) => (
        <View key={i} style={{ width: 3.5, height: h, backgroundColor: '#fff', borderRadius: 2 }} />
      ))}
    </View>
  );
}

function GoogleLogo() {
  const letters = [
    { c: 'G', color: '#4285F4' }, { c: 'o', color: '#EA4335' },
    { c: 'o', color: '#FBBC05' }, { c: 'g', color: '#4285F4' },
    { c: 'l', color: '#34A853' }, { c: 'e', color: '#EA4335' },
  ];
  return (
    <View style={{ flexDirection: 'row', marginRight: 8 }}>
      {letters.map(({ c, color }, i) => (
        <Text key={i} style={{ fontSize: 17, fontWeight: '700', color }}>{c}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eef0f8' },

  blob: { position: 'absolute', borderRadius: 999, opacity: 0.6 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 50 },

  iconBg: {
    width: 82, height: 82, borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#6366f1', shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: 10 },
  },

  headline: {
    fontSize: 38, fontWeight: '800', color: '#1e1b4b',
    textAlign: 'center', lineHeight: 46, letterSpacing: -0.5, marginBottom: 14,
  },
  sub: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24 },

  bottom: { paddingHorizontal: 22, paddingBottom: 44, gap: 11 },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 999, paddingVertical: 16,
    shadowColor: '#000', shadowOpacity: 0.09, shadowRadius: 14, shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  googleText: { fontSize: 16, fontWeight: '600', color: '#111827' },

  appleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#18181b', borderRadius: 999, paddingVertical: 16, gap: 8,
  },
  appleIcon: { fontSize: 20, color: '#fff' },
  appleText: { fontSize: 16, fontWeight: '600', color: '#fff' },

  emailLink: { textAlign: 'center', color: '#6366f1', fontSize: 14, fontWeight: '500', paddingVertical: 2 },

  terms: { fontSize: 11, color: '#9ca3af', textAlign: 'center', lineHeight: 16, marginTop: 2 },
  termsUnder: { color: '#6b7280', textDecorationLine: 'underline' },

  // Modal
  modal: { flexGrow: 1, padding: 24, paddingTop: 36 },
  closeRow: { alignSelf: 'flex-end', padding: 8, marginBottom: 4 },
  closeX: { fontSize: 20, color: '#9ca3af' },
  modalTitle: { fontSize: 28, fontWeight: '800', color: '#1e1b4b', marginBottom: 24 },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, marginBottom: 12, color: '#111',
  },
  submitBtn: { backgroundColor: '#6366f1', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  mLinks: { alignItems: 'center', gap: 14, marginTop: 20 },
  mLink: { color: '#6366f1', fontSize: 14 },
});
