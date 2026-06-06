import { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Animated,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  useAudioRecorder, useAudioRecorderState,
  requestRecordingPermissionsAsync, setAudioModeAsync,
  IOSOutputFormat, AudioQuality,
} from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { transcribeAudio, processText, saveEntry } from '../api';

const CHIMEGE_PRESET = {
  extension: '.wav', sampleRate: 16000, numberOfChannels: 1, bitRate: 256000,
  android: { outputFormat: 'mpeg4' as const, audioEncoder: 'aac' as const },
  ios: { outputFormat: IOSOutputFormat.LINEARPCM, audioQuality: AudioQuality.MAX, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
  web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
};

type ProcessResult = {
  tasks: { title: string; due: string }[];
  events: { title: string; datetime: string }[];
  summary: string;
};

type Phase = 'idle' | 'recording' | 'processing' | 'done';
type Mode = 'voice' | 'text';

export default function RecordScreen() {
  const { colors, isDark } = useTheme();
  const C = colors;
  const navigation = useNavigation<any>();
  const recorder = useAudioRecorder(CHIMEGE_PRESET);
  const state = useAudioRecorderState(recorder);
  const [phase, setPhase] = useState<Phase>('idle');
  const [mode, setMode] = useState<Mode>('voice');
  const [transcribed, setTranscribed] = useState('');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [manualText, setManualText] = useState('');

  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.3)).current;
  const opacity2 = useRef(new Animated.Value(0.15)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    requestRecordingPermissionsAsync().then(async (s) => {
      if (!s.granted) Alert.alert('Микрофон', 'Зөвшөөрөл олгоно уу.');
      else await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    });
  }, []);

  useEffect(() => {
    Animated.spring(tabAnim, {
      toValue: mode === 'voice' ? 0 : 1,
      useNativeDriver: false,
      speed: 14,
      bounciness: 4,
    }).start();
  }, [mode]);

  useEffect(() => {
    if (state.isRecording) {
      Animated.spring(btnScale, { toValue: 1.06, useNativeDriver: true, speed: 8 }).start();
      pulseLoop.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulse1, { toValue: 1.55, duration: 1400, useNativeDriver: true }),
            Animated.timing(pulse1, { toValue: 1, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(opacity1, { toValue: 0, duration: 1400, useNativeDriver: true }),
            Animated.timing(opacity1, { toValue: 0.3, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(300),
            Animated.timing(pulse2, { toValue: 1.9, duration: 1400, useNativeDriver: true }),
            Animated.timing(pulse2, { toValue: 1, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(300),
            Animated.timing(opacity2, { toValue: 0, duration: 1400, useNativeDriver: true }),
            Animated.timing(opacity2, { toValue: 0.15, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 12 }).start();
      pulse1.setValue(1); pulse2.setValue(1);
      opacity1.setValue(0.3); opacity2.setValue(0.15);
    }
  }, [state.isRecording]);

  const handleVoicePress = async () => {
    if (state.isRecording) {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) return;
      setPhase('processing');
      setTranscribed(''); setResult(null);
      try {
        const { text } = await transcribeAudio(uri);
        setTranscribed(text);
        const processed = await processText(text);
        setResult(processed);
        await saveEntry({ text, ...processed });
        setPhase('done');
        if (processed.tasks?.length) navigation.navigate('Tasks');
      } catch (err: any) {
        Alert.alert('Алдаа', err?.response?.data?.error ?? err.message ?? 'Алдаа гарлаа');
        setPhase('idle');
      }
    } else {
      setTranscribed(''); setResult(null);
      setPhase('recording');
      await recorder.prepareToRecordAsync();
      recorder.record();
    }
  };

  const handleTextSubmit = async () => {
    if (!manualText.trim()) return;
    setPhase('processing');
    setTranscribed(''); setResult(null);
    try {
      const processed = await processText(manualText.trim());
      setTranscribed(manualText.trim());
      setResult(processed);
      await saveEntry({ text: manualText.trim(), ...processed });
      setPhase('done');
      if (processed.tasks?.length) navigation.navigate('Tasks');
    } catch (err: any) {
      Alert.alert('Алдаа', err?.response?.data?.error ?? err.message ?? 'Алдаа гарлаа');
      setPhase('idle');
    }
  };

  const handleReset = () => {
    setPhase('idle');
    setTranscribed('');
    setResult(null);
    setManualText('');
  };

  const isRecording = state.isRecording;
  const isProcessing = phase === 'processing';
  const btnBg = isRecording ? C.danger : isProcessing ? C.textMuted : C.accent;
  const ringColor = isRecording ? C.danger : C.accent;

  const tabIndicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '50%'],
  });

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={s.header}>
            <Text style={[s.greeting, { color: C.text }]}>Товч</Text>
            <Text style={[s.subtitle, { color: C.textSec }]}>Тэмдэглэл үүсгэх</Text>
          </View>

          {/* Mode tab switcher */}
          <View style={[s.tabWrap, {
            backgroundColor: isDark ? C.surfaceAlt : '#EEF2FF',
            borderColor: isDark ? C.border : C.accentMid,
          }]}>
            <Animated.View
              style={[s.tabIndicator, {
                backgroundColor: isDark ? C.surface : '#fff',
                left: tabIndicatorLeft,
                shadowColor: C.accent,
              }]}
            />
            <TouchableOpacity
              style={s.tabBtn}
              onPress={() => { setMode('voice'); if (phase === 'done') handleReset(); }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="mic"
                size={16}
                color={mode === 'voice' ? C.accent : C.textMuted}
              />
              <Text style={[s.tabLabel, { color: mode === 'voice' ? C.accent : C.textMuted, fontWeight: mode === 'voice' ? '700' : '500' }]}>
                Хоолой
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.tabBtn}
              onPress={() => { setMode('text'); if (phase === 'done') handleReset(); }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={mode === 'text' ? C.accent : C.textMuted}
              />
              <Text style={[s.tabLabel, { color: mode === 'text' ? C.accent : C.textMuted, fontWeight: mode === 'text' ? '700' : '500' }]}>
                Гараар
              </Text>
            </TouchableOpacity>
          </View>

          {/* VOICE MODE */}
          {mode === 'voice' && (
            <View style={s.stage}>
              <View style={s.micContainer}>
                <View style={[s.stageCircle, { backgroundColor: C.accentLight }]} />
                <Animated.View style={[s.ring, {
                  transform: [{ scale: pulse2 }], opacity: opacity2,
                  borderColor: ringColor,
                }]} />
                <Animated.View style={[s.ring, {
                  transform: [{ scale: pulse1 }], opacity: opacity1,
                  borderColor: ringColor,
                }]} />

              <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                <TouchableOpacity
                  style={[s.micBtn, { backgroundColor: btnBg, shadowColor: btnBg }]}
                  onPress={handleVoicePress}
                  disabled={isProcessing}
                  activeOpacity={0.88}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="large" color="#fff" />
                  ) : isRecording ? (
                    <View style={s.stopIcon} />
                  ) : (
                    <Ionicons name="mic" size={44} color="#fff" />
                  )}
                </TouchableOpacity>
              </Animated.View>
              </View>

              <Text style={[s.statusLabel, { color: isRecording ? C.danger : C.textSec }]}>
                {isProcessing ? 'Боловсруулж байна...' : isRecording ? 'Бичиж байна' : 'Дарж эхлүүл'}
              </Text>

              {isRecording && (
                <View style={s.waveRow}>
                  {[20, 34, 28, 44, 36, 24, 40, 30, 22].map((h, i) => (
                    <AnimatedBar key={i} height={h} delay={i * 90} color={C.danger} />
                  ))}
                </View>
              )}

              {!isRecording && !isProcessing && phase === 'idle' && (
                <Text style={[s.hintText, { color: C.textMuted }]}>
                  Та хэлэх зүйлээ хэлээрэй
                </Text>
              )}
            </View>
          )}

          {/* TEXT MODE */}
          {mode === 'text' && (
            <View style={s.textMode}>
              <View style={[s.textInputWrap, {
                backgroundColor: C.surface,
                borderColor: isDark ? C.border : '#D1D5DB',
                shadowOpacity: isDark ? 0.04 : 0.08,
              }]}>
                <View style={s.textInputHeader}>
                  <Ionicons name="create-outline" size={14} color={C.textMuted} />
                  <Text style={[s.textInputLabel, { color: C.textMuted }]}>ТЭМДЭГЛЭЛ</Text>
                </View>
                <TextInput
                  style={[s.textInput, { color: C.text }]}
                  placeholder="Энд бичнэ үү..."
                  placeholderTextColor={C.textMuted}
                  multiline
                  value={manualText}
                  onChangeText={setManualText}
                  editable={!isProcessing && phase !== 'done'}
                  textAlignVertical="top"
                />
                <Text style={[s.charCount, { color: C.textMuted }]}>
                  {manualText.length} тэмдэгт
                </Text>
              </View>

              <TouchableOpacity
                style={[s.submitBtn, {
                  backgroundColor: manualText.trim() && !isProcessing ? C.accent : C.border,
                  shadowColor: C.accent,
                }]}
                onPress={handleTextSubmit}
                disabled={!manualText.trim() || isProcessing || phase === 'done'}
                activeOpacity={0.85}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles-outline" size={18} color="#fff" />
                    <Text style={s.submitBtnText}>AI боловсруулах</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Result cards */}
          {!!transcribed && (
            <View style={[s.card, {
              backgroundColor: C.surface,
              borderColor: isDark ? C.border : '#D1D5DB',
              shadowOpacity: isDark ? 0.04 : 0.08,
            }]}>
              <View style={s.cardHeader}>
                <Ionicons name="text-outline" size={14} color={C.textMuted} />
                <Text style={[s.cardLabel, { color: C.textMuted }]}>
                  {mode === 'voice' ? 'Таних үр дүн' : 'Бичсэн текст'}
                </Text>
              </View>
              <Text style={[s.cardText, { color: C.text }]}>{transcribed}</Text>
            </View>
          )}

          {result?.summary ? (
            <View style={[s.cardHighlight, { backgroundColor: C.accentLight, borderColor: C.accentMid }]}>
              <View style={s.cardHeader}>
                <Ionicons name="sparkles-outline" size={14} color={C.accent} />
                <Text style={[s.cardLabel, { color: C.accent }]}>AI хураангуй</Text>
              </View>
              <Text style={[s.cardText, { color: C.text }]}>{result.summary}</Text>
            </View>
          ) : null}

          {result?.tasks && result.tasks.length > 0 && (
            <View style={[s.card, {
              backgroundColor: C.surface,
              borderColor: isDark ? C.border : '#D1D5DB',
              shadowOpacity: isDark ? 0.04 : 0.08,
            }]}>
              <View style={s.cardHeader}>
                <Ionicons name="checkbox-outline" size={14} color={C.textMuted} />
                <Text style={[s.cardLabel, { color: C.textMuted }]}>Даалгавар · {result.tasks.length}</Text>
              </View>
              {result.tasks.map((t, i) => (
                <View key={i} style={s.taskRow}>
                  <View style={[s.dot, { backgroundColor: C.accent }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.taskName, { color: C.text }]}>{t.title}</Text>
                    {t.due ? <Text style={[s.taskDue, { color: C.textMuted }]}>{t.due}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          )}

          {result?.events && result.events.length > 0 && (
            <View style={[s.card, {
              backgroundColor: C.surface,
              borderColor: isDark ? C.border : '#D1D5DB',
              shadowOpacity: isDark ? 0.04 : 0.08,
            }]}>
              <View style={s.cardHeader}>
                <Ionicons name="calendar-outline" size={14} color={C.textMuted} />
                <Text style={[s.cardLabel, { color: C.textMuted }]}>Цаг товлол · {result.events.length}</Text>
              </View>
              {result.events.map((e, i) => (
                <View key={i} style={s.taskRow}>
                  <View style={[s.dot, { backgroundColor: C.success }]} />
                  <Text style={[s.taskName, { color: C.text }]}>{e.title}</Text>
                </View>
              ))}
            </View>
          )}

          {phase === 'done' && (
            <TouchableOpacity
              style={[s.newBtn, { borderColor: C.accentMid, backgroundColor: C.accentLight }]}
              onPress={handleReset}
            >
              <Ionicons name="add-circle-outline" size={18} color={C.accent} />
              <Text style={[s.newBtnText, { color: C.accent }]}>Шинэ тэмдэглэл</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AnimatedBar({ height, delay, color }: { height: number; delay: number; color: string }) {
  const anim = useRef(new Animated.Value(0.2)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 350, useNativeDriver: true, delay }),
      Animated.timing(anim, { toValue: 0.2, duration: 350, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={{
      width: 4, height, borderRadius: 3,
      backgroundColor: color, transform: [{ scaleY: anim }],
    }} />
  );
}

const BTN = 148;
const RING = BTN;

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20 },

  header: { paddingTop: 16, paddingBottom: 16 },
  greeting: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },

  // Tab switcher
  tabWrap: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    width: '48%',
    bottom: 4,
    borderRadius: 10,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    zIndex: 1,
  },
  tabLabel: { fontSize: 14 },

  // Voice stage
  stage: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, marginVertical: 4 },
  stageCircle: {
    position: 'absolute',
    width: BTN + 60,
    height: BTN + 60,
    borderRadius: (BTN + 60) / 2,
    top: (BTN * 2 - (BTN + 60)) / 2,
    left: (BTN * 2 - (BTN + 60)) / 2,
  },
  micContainer: {
    width: BTN * 2,
    height: BTN * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, borderWidth: 2 },
  micBtn: {
    width: BTN, height: BTN, borderRadius: BTN / 2,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.35, shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 }, elevation: 14,
  },
  stopIcon: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#fff' },
  statusLabel: { marginTop: 20, fontSize: 15, fontWeight: '600', letterSpacing: 0.1 },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 18, height: 44 },
  hintText: { marginTop: 10, fontSize: 13 },

  // Text mode
  textMode: { paddingTop: 16, gap: 14 },
  textInputWrap: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    minHeight: 180,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  textInputHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  textInputLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  textInput: { fontSize: 15, lineHeight: 24, minHeight: 120 },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 8 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 16,
    shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 6, marginBottom: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Result cards
  card: {
    borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardHighlight: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  cardText: { fontSize: 15, lineHeight: 22 },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 6 },
  taskName: { fontSize: 14, lineHeight: 20, flex: 1 },
  taskDue: { fontSize: 12, marginTop: 2 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 4,
  },
  newBtnText: { fontSize: 14, fontWeight: '600' },
});
