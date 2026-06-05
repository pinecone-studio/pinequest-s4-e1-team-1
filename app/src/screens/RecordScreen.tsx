import { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Animated,
} from 'react-native';
import {
  useAudioRecorder, useAudioRecorderState,
  requestRecordingPermissionsAsync, setAudioModeAsync,
  IOSOutputFormat, AudioQuality,
} from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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


export default function RecordScreen() {
  const { colors } = useTheme();
  const C = colors;
  const recorder = useAudioRecorder(CHIMEGE_PRESET);
  const state = useAudioRecorderState(recorder);
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcribed, setTranscribed] = useState('');
  const [result, setResult] = useState<ProcessResult | null>(null);

  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.3)).current;
  const opacity2 = useRef(new Animated.Value(0.15)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    requestRecordingPermissionsAsync().then(async (s) => {
      if (!s.granted) Alert.alert('Микрофон', 'Зөвшөөрөл олгоно уу.');
      else await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    });
  }, []);

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

  const handlePress = async () => {
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

  const isRecording = state.isRecording;
  const isProcessing = phase === 'processing';

  const btnBg = isRecording ? C.danger : isProcessing ? C.textMuted : C.accent;
  const ringColor = isRecording ? C.danger : C.accent;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={[s.greeting, { color: C.text }]}>Товч</Text>
          <Text style={[s.subtitle, { color: C.textSec }]}>Ярьж тэмдэглэ</Text>
        </View>

        {/* Mic stage */}
        <View style={s.stage}>
          {/* Pulse rings */}
          <Animated.View style={[s.ring, {
            transform: [{ scale: pulse2 }], opacity: opacity2,
            borderColor: ringColor,
          }]} />
          <Animated.View style={[s.ring, {
            transform: [{ scale: pulse1 }], opacity: opacity1,
            borderColor: ringColor,
          }]} />

          {/* Button */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[s.micBtn, { backgroundColor: btnBg, shadowColor: btnBg }]}
              onPress={handlePress}
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

          {/* Status */}
          <Text style={[s.statusLabel, { color: isRecording ? C.danger : C.textSec }]}>
            {isProcessing ? 'Боловсруулж байна...' : isRecording ? 'Бичиж байна' : 'Дарж эхлүүл'}
          </Text>

          {/* Wave bars */}
          {isRecording && (
            <View style={s.waveRow}>
              {[20, 34, 28, 44, 36, 24, 40, 30, 22].map((h, i) => (
                <AnimatedBar key={i} height={h} delay={i * 90} color={C.danger} />
              ))}
            </View>
          )}
        </View>

        {/* Result cards */}
        {!!transcribed && (
          <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={s.cardHeader}>
              <Ionicons name="text-outline" size={14} color={C.textMuted} />
              <Text style={[s.cardLabel, { color: C.textMuted }]}>Таних үр дүн</Text>
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
          <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
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
          <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
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
            onPress={() => { setPhase('idle'); setTranscribed(''); setResult(null); }}
          >
            <Ionicons name="add-circle-outline" size={18} color={C.accent} />
            <Text style={[s.newBtnText, { color: C.accent }]}>Шинэ бичлэг</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
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

const BTN = 164;
const RING = BTN;

// Static layout styles (no colors)
const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  header: { paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },
  cardHighlight: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  stage: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, marginVertical: 8 },
  ring: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, borderWidth: 2 },
  micBtn: { width: BTN, height: BTN, borderRadius: BTN / 2, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.3, shadowRadius: 28, shadowOffset: { width: 0, height: 10 }, elevation: 14 },
  stopIcon: { width: 30, height: 30, borderRadius: 6, backgroundColor: '#fff' },
  statusLabel: { marginTop: 20, fontSize: 15, fontWeight: '500', letterSpacing: 0.1 },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 18, height: 44 },
  card: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  cardText: { fontSize: 15, lineHeight: 22 },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 6 },
  taskName: { fontSize: 14, lineHeight: 20, flex: 1 },
  taskDue: { fontSize: 12, marginTop: 2 },
  newBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 4 },
  newBtnText: { fontSize: 14, fontWeight: '600' },
});
