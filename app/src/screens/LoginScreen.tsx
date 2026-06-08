import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal, KeyboardAvoidingView,
  Platform, ScrollView, Dimensions, Animated, Linking,
} from 'react-native';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withDelay, withSpring, FadeInDown, ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, sendEmailVerification,
} from 'firebase/auth';
import { auth } from '../firebase';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');
type EmailMode = 'login' | 'signup' | 'forgot';

/* ── Firebase error translation ───────────────────────────────────────────── */
function translateFirebaseError(msg: string): string {
  if (msg.includes('email-already-in-use'))   return 'Энэ и-мэйл аль хэдийн бүртгэлтэй.';
  if (msg.includes('weak-password'))          return 'Нууц үг хэт богино. 6+ тэмдэгт оруулна уу.';
  if (msg.includes('user-not-found'))         return 'И-мэйл хаяг олдсонгүй.';
  if (msg.includes('wrong-password') || msg.includes('invalid-credential')) return 'Нууц үг буруу.';
  if (msg.includes('invalid-email'))          return 'И-мэйл хаягийн формат буруу.';
  if (msg.includes('too-many-requests'))      return 'Хэт олон удаа оролдлоо. Түр хүлээнэ үү.';
  if (msg.includes('network-request-failed')) return 'Интернэт холболт байхгүй.';
  return 'Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.';
}

/* ── Animated aurora blob ─────────────────────────────────────────────────── */
function AuroraBlob({
  color, size, top, left, right, bottom, dur, dx, dy,
}: {
  color: string; size: number;
  top?: number; left?: number; right?: number; bottom?: number;
  dur: number; dx: number; dy: number;
}) {
  const anim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: { x: dx, y: dy }, duration: dur, useNativeDriver: true }),
        Animated.timing(anim, { toValue: { x: -dx * .6, y: -dy * .5 }, duration: dur * 1.2, useNativeDriver: true }),
        Animated.timing(anim, { toValue: { x: 0, y: 0 }, duration: dur * .9, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        top, left, right, bottom,
        transform: [{ translateX: anim.x }, { translateY: anim.y }],
      }}
    />
  );
}

/* ── Animated waveform bar ────────────────────────────────────────────────── */
function WaveBar({ delay, color }: { delay: number; color: string }) {
  const h = useSharedValue(8);

  useEffect(() => {
    h.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(22, { duration: 380 }),
          withTiming(6,  { duration: 380 }),
        ), -1, true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({ height: h.value }));

  return (
    <Reanimated.View
      style={[{ width: 3.5, borderRadius: 2, backgroundColor: color }, style]}
    />
  );
}

/* ── Animated waveform ────────────────────────────────────────────────────── */
function Waveform({ color = '#fff' }: { color?: string }) {
  const delays = [0, 80, 160, 240, 160, 80, 0];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      {delays.map((d, i) => <WaveBar key={i} delay={d} color={color} />)}
    </View>
  );
}

/* ── Press scale button ───────────────────────────────────────────────────── */
function ScaleBtn({ children, onPress, style }: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Reanimated.View style={[animStyle, style]}>
      <TouchableOpacity
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        onPress={onPress}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Reanimated.View>
  );
}

/* ── Main screen ──────────────────────────────────────────────────────────── */
export default function LoginScreen() {
  const { isDark } = useTheme();
  const [emailModal, setEmailModal] = useState(false);
  const [mode, setMode]             = useState<EmailMode>('login');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);

  const C = isDark ? DARK : LIGHT;

  const handleSubmit = async () => {
    if (!email || (!password && mode !== 'forgot')) return;
    setLoading(true);
    try {
      if (mode === 'login')       await signInWithEmailAndPassword(auth, email, password);
      else if (mode === 'signup') {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(user).catch(() => {});
        Alert.alert('Бүртгэл үүслээ', 'Таны и-мэйл рүү баталгаажуулах линк илгээлээ. Шалгана уу.');
      }
      else {
        await sendPasswordResetEmail(auth, email);
        Alert.alert('Амжилттай', 'Нууц үг сэргээх линк илгээлээ.');
        setMode('login');
      }
    } catch (err: unknown) {
      Alert.alert('Алдаа', translateFirebaseError(err instanceof Error ? err.message : ''));
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => { setMode('login'); setEmailModal(true); };

  return (
    <View style={[s.root, { backgroundColor: C.bg }]}>

      {/* Aurora blobs */}
      <AuroraBlob color={C.blob1} size={320} top={-130} left={-110} dur={9000}  dx={50}  dy={40}  />
      <AuroraBlob color={C.blob2} size={280} top={height*.3} right={-110} dur={12000} dx={-40} dy={60}  />
      <AuroraBlob color={C.blob3} size={250} bottom={height*.25} left={width*.1} dur={8000}  dx={60}  dy={-50} />
      <AuroraBlob color={C.blob4} size={200} top={height*.6} left={width*.55} dur={11000} dx={-50} dy={30}  />

      {/* Center */}
      <View style={s.center}>
        {/* Badge */}
        <Reanimated.View entering={FadeInDown.delay(80).springify()}>
          <View style={[s.badge, { borderColor: C.badgeBorder, backgroundColor: C.badgeBg }]}>
            <View style={[s.badgeDot, { backgroundColor: C.accent }]} />
            <Text style={[s.badgeText, { color: C.accent }]}>AI-тай бүтээмжтэй ажиллах шинэ арга</Text>
          </View>
        </Reanimated.View>

        {/* Icon */}
        <Reanimated.View entering={ZoomIn.delay(160).springify()} style={s.iconWrap}>
          <LinearGradient
            colors={['#7c3aed', '#db2777']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.iconBg}
          >
            <Waveform color="#fff" />
          </LinearGradient>
        </Reanimated.View>

        {/* Headline */}
        <Reanimated.View entering={FadeInDown.delay(220).springify()} style={{ alignItems: 'center' }}>
          <Text style={[s.headline, { color: C.text }]}>Ярьж тэмдэглэ.</Text>
          <Text style={[s.headline, { color: C.accent }]}>AI бүгдийг</Text>
          <Text style={[s.headline, { color: C.text }]}>зохион байгуулна.</Text>
        </Reanimated.View>

        {/* Sub */}
        <Reanimated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={[s.sub, { color: C.textMuted }]}>
            {'Дуут бичлэгийг өгөхөд даалгавар,\nхуваарь автоматаар үүснэ.'}
          </Text>
        </Reanimated.View>

      </View>

      {/* Bottom — button + terms */}
      <View style={s.bottom}>
        <Reanimated.View entering={FadeInDown.delay(360).springify()} style={s.emailBtnWrap}>
          <ScaleBtn onPress={openModal}>
            <LinearGradient
              colors={['#7c3aed', '#db2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.emailBtn}
            >
              <Text style={s.emailBtnText}>И-мэйлээр нэвтрэх</Text>
            </LinearGradient>
          </ScaleBtn>
        </Reanimated.View>

        <Reanimated.View entering={FadeInDown.delay(440).springify()}>
          <Text style={[s.terms, { color: C.termsColor }]}>
            {'Үргэлжлүүлснээр та манай '}
            <Text
              style={[s.termsUnder, { color: C.termsUnder }]}
              onPress={() => Linking.openURL('https://terms-beryl.vercel.app/terms')}
            >Үйлчилгээний нөхцөл</Text>
            {' & '}
            <Text
              style={[s.termsUnder, { color: C.termsUnder }]}
              onPress={() => Linking.openURL('https://terms-beryl.vercel.app/privacy')}
            >Нууцлалын бодлого</Text>
            {'-г зөвшөөрч байна.'}
          </Text>
        </Reanimated.View>
      </View>

      {/* Email modal */}
      <Modal visible={emailModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[s.modal]}
            style={{ backgroundColor: C.modalBg }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Modal aurora */}
            <AuroraBlob color={C.blob1} size={200} top={-60} right={-60} dur={10000} dx={30} dy={20} />
            <AuroraBlob color={C.blob2} size={180} bottom={80} left={-40} dur={9000} dx={-20} dy={30} />

            {/* Close */}
            <TouchableOpacity onPress={() => setEmailModal(false)} style={s.closeRow}>
              <View style={[s.closeBtn, { backgroundColor: C.closeBg, borderColor: C.btnBorder }]}>
                <Text style={[s.closeX, { color: C.textMuted }]}>✕</Text>
              </View>
            </TouchableOpacity>

            {/* Mode badge */}
            <View style={[s.badge, { borderColor: C.badgeBorder, backgroundColor: C.badgeBg, marginBottom: 20 }]}>
              <View style={[s.badgeDot, { backgroundColor: C.accent }]} />
              <Text style={[s.badgeText, { color: C.accent }]}>
                {mode === 'login' ? 'Нэвтрэх' : mode === 'signup' ? 'Шинэ бүртгэл' : 'Нууц үг сэргээх'}
              </Text>
            </View>

            <Text style={[s.modalTitle, { color: C.text }]}>
              {mode === 'login' ? 'Сайн уу' : mode === 'signup' ? 'Эхлэцгээе' : 'Нууц үг мартсан?'}
            </Text>
            <Text style={[s.modalSub, { color: C.textMuted }]}>
              {mode === 'login' ? 'И-мэйл болон нууц үгээ оруулна уу'
                : mode === 'signup' ? 'Шинэ бүртгэл үүсгэх'
                : 'Нууц үг сэргээх линк илгээнэ'}
            </Text>

            <Text style={[s.inputLabel, { color: C.inputLabel }]}>И-мэйл</Text>
            <TextInput
              style={[s.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              placeholder="name@example.com" placeholderTextColor={C.placeholder}
              value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
            />

            {mode !== 'forgot' && (
              <>
                <Text style={[s.inputLabel, { color: C.inputLabel }]}>Нууц үг</Text>
                <TextInput
                  style={[s.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
                  placeholder="••••••••" placeholderTextColor={C.placeholder}
                  value={password} onChangeText={setPassword} secureTextEntry
                />
              </>
            )}

            <ScaleBtn onPress={handleSubmit}>
              <LinearGradient
                colors={['#7c3aed', '#db2777']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.submitBtn}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.submitText}>
                      {mode === 'login' ? 'Нэвтрэх' : mode === 'signup' ? 'Бүртгүүлэх' : 'Линк илгээх'}
                    </Text>
                }
              </LinearGradient>
            </ScaleBtn>

            <View style={s.mLinks}>
              {mode === 'login' && <>
                <TouchableOpacity onPress={() => setMode('signup')}>
                  <Text style={[s.mLink, { color: C.accent }]}>Бүртгэл үүсгэх</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMode('forgot')}>
                  <Text style={[s.mLinkMuted, { color: C.textMuted }]}>Нууц үг мартсан?</Text>
                </TouchableOpacity>
              </>}
              {(mode === 'signup' || mode === 'forgot') &&
                <TouchableOpacity onPress={() => setMode('login')}>
                  <Text style={[s.mLink, { color: C.accent }]}>← Нэвтрэх</Text>
                </TouchableOpacity>
              }
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/* ── Theme tokens ─────────────────────────────────────────────────────────── */
const DARK = {
  bg:          '#030309',
  text:        '#ffffff',
  textMuted:   'rgba(255,255,255,0.38)',
  accent:      '#a78bfa',
  badge:       'rgba(124,58,237,0.12)',
  badgeBg:     'rgba(124,58,237,0.12)',
  badgeBorder: 'rgba(124,58,237,0.28)',
  btnBg:       'rgba(255,255,255,0.06)',
  btnBorder:   'rgba(255,255,255,0.1)',
  appleBg:     '#ffffff',
  appleText:   '#000000',
  blob1:       'rgba(124,58,237,0.28)',
  blob2:       'rgba(219,39,119,0.2)',
  blob3:       'rgba(14,165,233,0.15)',
  blob4:       'rgba(16,185,129,0.12)',
  modalBg:     '#0a0818',
  closeBg:     'rgba(255,255,255,0.08)',
  inputBg:     'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.09)',
  inputLabel:  'rgba(255,255,255,0.45)',
  placeholder: 'rgba(255,255,255,0.2)',
  termsColor:  'rgba(255,255,255,0.45)',
  termsUnder:  'rgba(255,255,255,0.75)',
};

const LIGHT = {
  bg:          '#f5f3ff',
  text:        '#1e1b4b',
  textMuted:   'rgba(30,27,75,0.45)',
  accent:      '#7c3aed',
  badgeBg:     'rgba(124,58,237,0.08)',
  badgeBorder: 'rgba(124,58,237,0.22)',
  btnBg:       '#ffffff',
  btnBorder:   'rgba(0,0,0,0.08)',
  appleBg:     '#1c1c1e',
  appleText:   '#ffffff',
  blob1:       'rgba(124,58,237,0.14)',
  blob2:       'rgba(219,39,119,0.1)',
  blob3:       'rgba(14,165,233,0.09)',
  blob4:       'rgba(16,185,129,0.08)',
  modalBg:     '#faf8ff',
  closeBg:     'rgba(0,0,0,0.05)',
  inputBg:     '#ffffff',
  inputBorder: 'rgba(0,0,0,0.1)',
  inputLabel:  'rgba(30,27,75,0.5)',
  placeholder: 'rgba(30,27,75,0.25)',
  termsColor:  'rgba(30,27,75,0.55)',
  termsUnder:  'rgba(30,27,75,0.8)',
};

/* ── Static styles ────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root:    { flex: 1, overflow: 'hidden' },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 60 },
  bottom:  { paddingHorizontal: 24, paddingBottom: 44, gap: 14, alignItems: 'center' },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 6, marginBottom: 26,
  },
  badgeDot:  { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  iconWrap: { marginBottom: 24 },
  iconBg: {
    width: 80, height: 80, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7c3aed', shadowOpacity: 0.5,
    shadowRadius: 28, shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  headline: { fontSize: 34, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5, lineHeight: 40 },
  sub:      { fontSize: 15, textAlign: 'center', lineHeight: 22, marginTop: 14 },

  emailBtnWrap: { width: '100%' },
  emailBtn: { borderRadius: 999, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  emailBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  terms:     { fontSize: 12, textAlign: 'center', lineHeight: 19 },
  termsUnder: { textDecorationLine: 'underline' },

  modal:     { flexGrow: 1, padding: 24, paddingTop: 40 },
  closeRow:  { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  closeBtn:  {
    width: 32, height: 32, borderRadius: 999, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  closeX: { fontSize: 14 },

  modalTitle: { fontSize: 30, fontWeight: '900', marginBottom: 6, letterSpacing: -0.4 },
  modalSub:   { fontSize: 14, marginBottom: 28 },

  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 7, letterSpacing: 0.3 },
  input: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, marginBottom: 16,
  },

  submitBtn: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  mLinks:   { alignItems: 'center', gap: 14, marginTop: 22 },
  mLink:    { fontSize: 14, fontWeight: '500' },
  mLinkMuted: { fontSize: 13 },
});
