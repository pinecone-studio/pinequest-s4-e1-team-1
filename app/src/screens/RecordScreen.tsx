import { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, Alert, ActivityIndicator, Animated,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useAudioRecorder, useAudioRecorderState,
  requestRecordingPermissionsAsync, setAudioModeAsync,
  IOSOutputFormat, AudioQuality,
} from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { transcribeAudio, processText, saveEntry, parseDatetime, RecurringPattern } from '../api';

const WEEKDAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
const MONTHS   = ['1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар','7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар'];


function formatDate() {
  const d = new Date();
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function parseDue(due: string): { date: string; time: string } {
  if (!due) return { date: '', time: '' };
  if (due.includes('T')) {
    const [date, timePart] = due.split('T');
    return { date, time: timePart.slice(0, 5) };
  }
  return { date: due, time: '' };
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const CHIMEGE_PRESET = {
  extension: '.wav', sampleRate: 16000, numberOfChannels: 1, bitRate: 256000,
  android: { outputFormat: 'mpeg4' as const, audioEncoder: 'aac' as const },
  ios: { outputFormat: IOSOutputFormat.LINEARPCM, audioQuality: AudioQuality.MAX, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
  web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
};

type ProcessResult = {
  tasks: { title: string; due: string; category: string; recurring?: RecurringPattern }[];
  events: { title: string; datetime: string }[];
  summary: string;
};

const CATEGORIES = ['Ажил', 'Хувийн', 'Эрүүл мэнд', 'Гэр бүл', 'Сурлага', 'Хобби', 'Бусад'];

type ClarifyTask = {
  title: string;
  date: string;
  time: string;
  urgent: boolean;
  inputMode: 'pick' | 'voice';
  category: string;
  recurring?: RecurringPattern;
  recurConfirmed?: boolean;
};

function recurringLabel(r: RecurringPattern): string {
  if (r.type === 'weekly_days') {
    return `7 хоног бүр · ${r.days.map(d => WEEKDAYS[d]).join(', ')}`;
  }
  return `Сар бүр · ${r.days.join(', ')}-нд`;
}

function countInstances(r: RecurringPattern): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let n = 0;
  if (r.type === 'weekly_days') {
    for (let i = 1; i <= 30; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      if (r.days.includes(d.getDay())) n++;
    }
  } else {
    for (let m = 0; m < 12; m++) {
      for (const day of r.days) {
        const d = new Date(today.getFullYear(), today.getMonth() + m, day);
        if (d >= today && d.getDate() === day) n++;
      }
    }
  }
  return n;
}

type SaveableTask = { title: string; due: string; priority: string; category: string };

function expandTask(t: ClarifyTask): SaveableTask[] {
  const base = { title: t.title, priority: t.urgent ? 'high' : 'medium', category: t.category };
  const mkDue = (dateStr: string) => t.time ? `${dateStr}T${t.time}:00` : dateStr;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  if (!t.recurring || t.recurConfirmed === false) {
    if (t.recurring?.type === 'weekly_days' && t.recurConfirmed === false) {
      return t.recurring.days.map(wd => {
        const d = new Date(today);
        const until = (wd - today.getDay() + 7) % 7 || 7;
        d.setDate(today.getDate() + until);
        return { ...base, due: mkDue(localDateStr(d)) };
      });
    }
    return [{ ...base, due: t.date ? mkDue(t.date) : '' }];
  }

  const results: SaveableTask[] = [];
  if (t.recurring.type === 'weekly_days') {
    for (let i = 1; i <= 30; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      if (t.recurring.days.includes(d.getDay()))
        results.push({ ...base, due: mkDue(localDateStr(d)) });
    }
  } else {
    for (let m = 0; m < 12; m++) {
      for (const day of t.recurring.days) {
        const d = new Date(today.getFullYear(), today.getMonth() + m, day);
        if (d >= today && d.getDate() === day)
          results.push({ ...base, due: mkDue(localDateStr(d)) });
      }
    }
  }
  return results.length ? results : [{ ...base, due: '' }];
}

type Phase = 'idle' | 'recording' | 'processing' | 'clarifying' | 'saving' | 'done';
type Mode = 'voice' | 'text';

type ChatMsg = {
  id: number;
  role: 'user' | 'ai';
  text: string;
  tasks?: ClarifyTask[];
  saved?: boolean;
};
let _msgId = 0;
const INITIAL_CHAT: ChatMsg[] = [{ id: 0, role: 'ai', text: 'Юу хийхийг тэмдэглэх вэ? Товч байдлаар хэлнэ үү.' }];

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
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [clarifyTasks, setClarifyTasks] = useState<ClarifyTask[]>([]);
  const [taskVoiceIdx, setTaskVoiceIdx] = useState<number | null>(null);
  const [taskVoicePhase, setTaskVoicePhase] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [pickerOpen, setPickerOpen] = useState<{ idx: number; mode: 'date' | 'time' } | null>(null);

  const pulse1 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.7)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    requestRecordingPermissionsAsync().then(async (s) => {
      if (!s.granted) Alert.alert('Микрофон', 'Зөвшөөрөл олгоно уу.');
      else await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    });
    return () => { recorder.stop().catch(() => {}); };
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
            Animated.timing(pulse1, { toValue: 1.85, duration: 1600, useNativeDriver: true }),
            Animated.timing(pulse1, { toValue: 1, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(opacity1, { toValue: 0, duration: 1600, useNativeDriver: true }),
            Animated.timing(opacity1, { toValue: 0.7, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 12 }).start();
      pulse1.setValue(1);
      opacity1.setValue(0.7);
    }
  }, [state.isRecording]);

  const toClarifying = (processed: ProcessResult) => {
    setClarifyTasks(processed.tasks.map(t => {
      const { date, time } = parseDue(t.due);
      return { title: t.title, date, time, urgent: false, inputMode: date ? 'pick' : 'voice', category: t.category || 'Бусад', recurring: t.recurring, recurConfirmed: t.recurring?.confirmed === true ? true : undefined };
    }));
    setPhase('clarifying');
  };

  const handleVoicePress = async () => {
    if (state.isRecording) {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) { setPhase('idle'); return; }
      setPhase('processing');
      setTranscribed(''); setResult(null);
      try {
        const { text } = await transcribeAudio(uri);
        setTranscribed(text);
        const processed = await processText(text);
        setResult(processed);
        if (processed.tasks.length > 0) {
          toClarifying(processed);
        } else {
          await saveEntry({ text, ...processed });
          setPhase('done');
        }
      } catch (err: any) {
        Alert.alert('Алдаа', err?.response?.data?.error ?? err.message ?? 'Алдаа гарлаа');
        setPhase('idle');
        setTranscribed('');
        setResult(null);
      }
    } else {
      setTranscribed(''); setResult(null);
      setPhase('recording');
      try {
        await recorder.prepareToRecordAsync();
        recorder.record();
      } catch (err: any) {
        Alert.alert('Алдаа', err?.message ?? 'Бичлэг эхлүүлж чадсангүй');
        setPhase('idle');
      }
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
      if (processed.tasks.length > 0) {
        toClarifying(processed);
      } else {
        await saveEntry({ text: manualText.trim(), ...processed });
        setPhase('done');
      }
    } catch (err: any) {
      Alert.alert('Алдаа', err?.response?.data?.error ?? err.message ?? 'Алдаа гарлаа');
      setPhase('idle');
      setTranscribed('');
      setResult(null);
    }
  };

  const handleClarifySave = async () => {
    if (!result) return;
    setPhase('saving');
    try {
      const updatedTasks = clarifyTasks.flatMap(expandTask);
      await saveEntry({ text: transcribed, tasks: updatedTasks, events: result.events, summary: result.summary });
      setPhase('done');
    } catch (err: any) {
      Alert.alert('Алдаа', err?.response?.data?.error ?? err.message ?? 'Хадгалахад алдаа гарлаа');
      setPhase('clarifying');
    }
  };

  const handleTaskVoicePress = async (i: number) => {
    if (taskVoiceIdx !== null && taskVoiceIdx !== i) return;
    if (taskVoiceIdx === i && taskVoicePhase === 'recording') {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) { setTaskVoiceIdx(null); setTaskVoicePhase('idle'); return; }
      setTaskVoicePhase('processing');
      try {
        const { text } = await transcribeAudio(uri);
        const { due } = await parseDatetime(text);
        const { date, time } = parseDue(due);
        if (date) {
          updateClarifyTask(i, { date, time, inputMode: 'pick' });
        } else {
          Alert.alert('Огноо танигдсангүй', '"Маргааш 3 цагт" гэх мэтээр дахин оролдоно уу');
        }
      } catch {
        Alert.alert('Алдаа', 'Огноо таниж чадсангүй, дахин оролдоно уу');
      } finally {
        setTaskVoiceIdx(null);
        setTaskVoicePhase('idle');
      }
    } else {
      setTaskVoiceIdx(i);
      setTaskVoicePhase('recording');
      try {
        await recorder.prepareToRecordAsync();
        recorder.record();
      } catch (err: any) {
        Alert.alert('Алдаа', err?.message ?? 'Бичлэг эхлүүлж чадсангүй');
        setTaskVoiceIdx(null);
        setTaskVoicePhase('idle');
      }
    }
  };

  const updateClarifyTask = (i: number, fields: Partial<ClarifyTask>) => {
    setClarifyTasks(prev => prev.map((t, idx) => idx === i ? { ...t, ...fields } : t));
  };

  const getPickerDate = (idx: number): Date => {
    const t = clarifyTasks[idx];
    if (t.date) {
      const d = new Date(t.time ? `${t.date}T${t.time}:00` : t.date);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  const handlePickerChange = (_ev: DateTimePickerChangeEvent, selected: Date) => {
    if (!pickerOpen) return;
    const { idx, mode } = pickerOpen;
    if (mode === 'date') {
      const y = selected.getFullYear();
      const m = String(selected.getMonth() + 1).padStart(2, '0');
      const d = String(selected.getDate()).padStart(2, '0');
      updateClarifyTask(idx, { date: `${y}-${m}-${d}` });
      if (Platform.OS === 'android') setPickerOpen(null);
    } else {
      const h = String(selected.getHours()).padStart(2, '0');
      const min = String(selected.getMinutes()).padStart(2, '0');
      updateClarifyTask(idx, { time: `${h}:${min}` });
      if (Platform.OS === 'android') setPickerOpen(null);
    }
  };

  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    const userMsg: ChatMsg = { id: ++_msgId, role: 'user', text };
    setChatMsgs(prev => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const processed = await processText(text);
      const tasks: ClarifyTask[] = processed.tasks.map(t => {
        const { date, time } = parseDue(t.due);
        return { title: t.title, date, time, urgent: false, inputMode: 'pick', category: t.category || 'Бусад', recurring: t.recurring, recurConfirmed: t.recurring?.confirmed ? true : undefined };
      });
      if (tasks.length > 0) {
        setResult(processed);
        setTranscribed(text);
        setClarifyTasks(tasks);
        setPhase('clarifying');
      } else {
        setChatMsgs(prev => [...prev, { id: ++_msgId, role: 'ai', text: processed.summary || 'Даалгавар олдсонгүй. Тодорхойлон дахин хэлнэ үү.' }]);
      }
    } catch {
      setChatMsgs(prev => [...prev, { id: ++_msgId, role: 'ai', text: 'Алдаа гарлаа. Дахин оролдоно уу.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSave = async (msgId: number, tasks: ClarifyTask[]) => {
    try {
      await saveEntry({ text: '', tasks: tasks.flatMap(expandTask), events: [], summary: '' });
      setChatMsgs(prev => prev.map(m => m.id === msgId ? { ...m, saved: true } : m));
    } catch {
      Alert.alert('Алдаа', 'Хадгалахад алдаа гарлаа');
    }
  };

  const handleReset = () => {
    setPhase('idle');
    setTranscribed('');
    setResult(null);
    setManualText('');
    setClarifyTasks([]);
    setTaskVoiceIdx(null);
    setTaskVoicePhase('idle');
  };

  const isRecording = state.isRecording;
  const isProcessing = phase === 'processing';
  const isClarifying = phase === 'clarifying';
  const isSaving = phase === 'saving';
  const showModeTabs = phase === 'idle' || phase === 'recording' || phase === 'processing';
  const btnBg = isRecording ? C.danger : isProcessing ? C.textMuted : C.accent;

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
            <Text style={[s.greeting, { color: C.text }]}>MonTask</Text>
            <Text style={[s.subtitle, { color: C.textSec }]}>{formatDate()}</Text>
          </View>

          {/* VOICE MODE */}
          {showModeTabs && (
            <View style={s.stage}>
              <View style={s.micContainer}>
                <View style={[s.ambientGlow, { backgroundColor: isRecording ? '#ef444418' : C.accentLight }]} />
                {isRecording && (
                  <Animated.View style={[s.pulseRing, {
                    transform: [{ scale: pulse1 }],
                    opacity: opacity1,
                    borderColor: '#ef4444',
                  }]} />
                )}
                <Animated.View style={[s.micShadow, { transform: [{ scale: btnScale }], shadowColor: btnBg }]}>
                  <TouchableOpacity
                    onPress={handleVoicePress}
                    disabled={isProcessing || (phase === 'recording' && !isRecording)}
                    activeOpacity={0.88}
                    style={s.micBtnTouch}
                  >
                    <LinearGradient
                      colors={
                        isRecording ? ['#ef4444', '#dc2626']
                          : isProcessing ? [C.textMuted, C.textMuted]
                          : ['#7c3aed', '#db2777']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={s.micBtn}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : isRecording ? (
                        <View style={s.pauseIcon}>
                          <View style={s.pauseBar} />
                          <View style={s.pauseBar} />
                        </View>
                      ) : (
                        <Ionicons name="mic" size={52} color="#fff" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              <View style={s.statusRow}>
                {isRecording && <View style={[s.recIndicator, { backgroundColor: C.danger }]} />}
                <Text style={[s.statusLabel, { color: isRecording ? C.danger : isProcessing ? C.textMuted : C.textSec }]}>
                  {isProcessing ? 'Боловсруулж байна...' : isRecording ? 'Бичиж байна' : 'Дарж эхлүүл'}
                </Text>
              </View>

              {isRecording && (
                <View style={s.waveRow}>
                  {(['#a78bfa', '#c084fc', '#e879f9', '#c084fc', '#a78bfa'] as const).map((color, i) => (
                    <AnimatedBar key={i} height={([14, 26, 40, 26, 14] as const)[i]} delay={i * 130} color={color} />
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


          {/* Transcript card */}
          {!!transcribed && phase !== 'idle' && (
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

          {/* AI Summary */}
          {!!result?.summary && phase !== 'idle' && (
            <View style={[s.cardHighlight, { backgroundColor: C.accentLight, borderColor: C.accentMid }]}>
              <View style={s.cardHeader}>
                <Ionicons name="sparkles-outline" size={14} color={C.accent} />
                <Text style={[s.cardLabel, { color: C.accent }]}>AI хураангуй</Text>
              </View>
              <Text style={[s.cardText, { color: C.text }]}>{result.summary}</Text>
            </View>
          )}

          {/* ── CLARIFYING phase ── */}
          {isClarifying && (
            <View style={s.clarifySection}>
              <Text style={[s.clarifyTitle, { color: C.text }]}>Даалгавруудыг тодотгоно уу</Text>
              <Text style={[s.clarifySub, { color: C.textMuted }]}>Огноо, цаг болон яаралтай эсэхийг оруулна уу</Text>

              {clarifyTasks.map((task, i) => {
                const isThisRec  = taskVoiceIdx === i && taskVoicePhase === 'recording';
                const isThisProc = taskVoiceIdx === i && taskVoicePhase === 'processing';
                const otherBusy  = taskVoiceIdx !== null && taskVoiceIdx !== i;

                return (
                  <View key={i} style={[s.clarifyCard, { backgroundColor: C.surface, borderColor: isDark ? C.border : '#e5e7eb' }]}>
                    {/* Number + title */}
                    <View style={s.clarifyTitleRow}>
                      <View style={[s.clarifyBadge, { backgroundColor: C.accentLight }]}>
                        <Text style={[s.clarifyBadgeText, { color: C.accent }]}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 5 }}>
                        <Text style={[s.clarifyTaskTitle, { color: C.text }]} numberOfLines={2}>{task.title}</Text>
                        {task.recurring && task.recurConfirmed === undefined && (
                          <View style={[s.recurConfirmRow, { backgroundColor: '#fffbeb', borderColor: '#fcd34d' }]}>
                            <Ionicons name="repeat-outline" size={13} color="#b45309" />
                            <Text style={[s.recurConfirmText, { color: '#b45309', flex: 1 }]}>7 хоног бүр давтагдах уу?</Text>
                            <TouchableOpacity
                              style={[s.recurBtn, { backgroundColor: '#7c3aed' }]}
                              onPress={() => updateClarifyTask(i, { recurConfirmed: true })}
                            >
                              <Text style={s.recurBtnText}>Тийм · 30 хоног</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[s.recurBtn, { backgroundColor: C.surfaceAlt }]}
                              onPress={() => updateClarifyTask(i, { recurConfirmed: false })}
                            >
                              <Text style={[s.recurBtnText, { color: C.textMuted }]}>Үгүй</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        {task.recurring && task.recurConfirmed === true && (
                          <View style={[s.recurBadge, { backgroundColor: '#f3e8ff', borderColor: '#d8b4fe' }]}>
                            <Ionicons name="repeat-outline" size={11} color="#7c3aed" />
                            <Text style={[s.recurBadgeText, { color: '#7c3aed' }]}>
                              {recurringLabel(task.recurring)}
                            </Text>
                            <Text style={[s.recurBadgeCount, { color: '#7c3aed' }]}>
                              · {countInstances(task.recurring)} удаа
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Recurring confirmed: time-only */}
                    {task.recurring && task.recurConfirmed === true && (
                      <TouchableOpacity
                        style={[s.datePickBtn, { backgroundColor: C.surfaceAlt, borderColor: task.time ? C.accent : C.border }]}
                        onPress={() => setPickerOpen({ idx: i, mode: 'time' })}
                      >
                        <Ionicons name="time-outline" size={14} color={task.time ? C.accent : C.textMuted} />
                        <Text style={[s.datePickText, { color: task.time ? C.text : C.textMuted }]}>
                          {task.time || 'Цаг (нэмэлт)'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Mode toggle + pickers — non-recurring only */}
                    {!task.recurring && (<>
                    <View style={[s.modeToggle, { borderColor: isDark ? C.border : '#e5e7eb' }]}>
                      <TouchableOpacity
                        style={[s.modeBtn, task.inputMode === 'pick' && { backgroundColor: C.accent }]}
                        onPress={() => updateClarifyTask(i, { inputMode: 'pick' })}
                      >
                        <Ionicons name="calendar-outline" size={13} color={task.inputMode === 'pick' ? '#fff' : C.textMuted} />
                        <Text style={[s.modeBtnText, { color: task.inputMode === 'pick' ? '#fff' : C.textMuted }]}>Өдөр сонгох</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.modeBtn, s.modeBtnRight, { borderColor: isDark ? C.border : '#e5e7eb' }, task.inputMode === 'voice' && { backgroundColor: C.accent }]}
                        onPress={() => updateClarifyTask(i, { inputMode: 'voice' })}
                      >
                        <Ionicons name="mic-outline" size={13} color={task.inputMode === 'voice' ? '#fff' : C.textMuted} />
                        <Text style={[s.modeBtnText, { color: task.inputMode === 'voice' ? '#fff' : C.textMuted }]}>Дуугаар хэлэх</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Pick: date + time picker buttons */}
                    {task.inputMode === 'pick' && (
                      <View style={s.dateRow}>
                        <TouchableOpacity
                          style={[s.datePickBtn, { backgroundColor: C.surfaceAlt, borderColor: task.date ? C.accent : C.border }]}
                          onPress={() => setPickerOpen({ idx: i, mode: 'date' })}
                        >
                          <Ionicons name="calendar-outline" size={14} color={task.date ? C.accent : C.textMuted} />
                          <Text style={[s.datePickText, { color: task.date ? C.text : C.textMuted }]}>
                            {task.date || 'Огноо'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.datePickBtn, { backgroundColor: C.surfaceAlt, borderColor: task.time ? C.accent : C.border }]}
                          onPress={() => setPickerOpen({ idx: i, mode: 'time' })}
                        >
                          <Ionicons name="time-outline" size={14} color={task.time ? C.accent : C.textMuted} />
                          <Text style={[s.datePickText, { color: task.time ? C.text : C.textMuted }]}>
                            {task.time || 'Цаг'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Voice: mini mic button for date */}
                    {task.inputMode === 'voice' && (
                      <View style={s.voiceRow}>
                        <View style={s.taskMicWrap}>
                          {isThisRec && (
                            <Animated.View style={[s.taskPulseRing, {
                              position: 'absolute',
                              backgroundColor: '#ef444440',
                              borderRadius: 40,
                              width: 80, height: 80,
                              top: -8, left: -8,
                            }]} />
                          )}
                          <TouchableOpacity
                            style={[s.taskMicBtn, {
                              backgroundColor: isThisRec ? '#ef4444' : isThisProc ? C.textMuted : C.accent,
                              shadowColor: isThisRec ? '#ef4444' : C.accent,
                              shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
                              elevation: 6,
                            }]}
                            onPress={() => handleTaskVoicePress(i)}
                            disabled={isThisProc || otherBusy}
                            activeOpacity={0.8}
                          >
                            {isThisProc ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : isThisRec ? (
                              <View style={s.stopSquare} />
                            ) : (
                              <Ionicons name="mic" size={24} color="#fff" />
                            )}
                          </TouchableOpacity>
                        </View>
                        <Text style={[s.voiceHint, { color: C.textMuted }]}>
                          {isThisProc
                            ? 'Огноо таних...'
                            : isThisRec
                            ? '"Маргааш 3 цагт" гэж хэлж зогсооно уу'
                            : 'Дарж огноо, цагаа хэлнэ үү'}
                        </Text>
                      </View>
                    )}
                    </>)}

                    {/* Category picker */}
                    <Text style={[s.fieldLabel, { color: C.textMuted, marginTop: 8 }]}>АНГИЛАЛ</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', gap: 7 }}>
                        {CATEGORIES.map(cat => (
                          <TouchableOpacity
                            key={cat}
                            style={[s.catChip, {
                              backgroundColor: task.category === cat ? C.accentLight : C.surfaceAlt,
                              borderColor: task.category === cat ? C.accent : C.border,
                            }]}
                            onPress={() => updateClarifyTask(i, { category: cat })}
                          >
                            <Text style={[s.catChipText, { color: task.category === cat ? C.accent : C.textMuted, fontWeight: task.category === cat ? '700' : '500' }]}>
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Urgency toggle — always shown */}
                    <View style={[s.urgentLabel, { marginTop: 0 }]}>
                      <Ionicons name="flame" size={12} color={C.textMuted} />
                      <Text style={[s.fieldLabel, { color: C.textMuted, marginBottom: 0 }]}>Яаралтай уу?</Text>
                    </View>
                    <View style={s.urgentRow}>
                      <TouchableOpacity
                        style={[s.urgentBtn, { backgroundColor: task.urgent ? '#f43f5e' : C.surfaceAlt }]}
                        onPress={() => updateClarifyTask(i, { urgent: true })}
                      >
                        <Text style={[s.urgentBtnText, { color: task.urgent ? '#fff' : C.textMuted }]}>
                          Тийм, яаралтай
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.urgentBtn, { backgroundColor: !task.urgent ? C.accent : C.surfaceAlt }]}
                        onPress={() => updateClarifyTask(i, { urgent: false })}
                      >
                        <Text style={[s.urgentBtnText, { color: !task.urgent ? '#fff' : C.textMuted }]}>
                          Тийм биш
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              <TouchableOpacity
                style={[s.saveClarifyBtn, { backgroundColor: C.accent, shadowColor: C.accent }]}
                onPress={handleClarifySave}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={s.saveClarifyBtnText}>Хадгалах</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── SAVING ── */}
          {isSaving && (
            <View style={s.savingSection}>
              <ActivityIndicator size="large" color={C.accent} />
              <Text style={[s.savingText, { color: C.textMuted }]}>Хадгалж байна...</Text>
            </View>
          )}

          {/* ── DONE: result cards ── */}
          {phase === 'done' && result?.tasks && result.tasks.length > 0 && (
            <View style={[s.card, {
              backgroundColor: C.surface,
              borderColor: isDark ? C.border : '#D1D5DB',
              shadowOpacity: isDark ? 0.04 : 0.08,
            }]}>
              <View style={s.cardHeader}>
                <Ionicons name="checkbox-outline" size={14} color={C.textMuted} />
                <Text style={[s.cardLabel, { color: C.textMuted }]}>
                  Даалгавар · {clarifyTasks.length || result.tasks.length}
                </Text>
              </View>
              {(clarifyTasks.length ? clarifyTasks : result.tasks).map((t, i) => (
                <View key={i} style={s.taskRow}>
                  <View style={[s.dot, { backgroundColor: C.accent }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.taskName, { color: C.text }]}>{t.title}</Text>
                    {'urgent' in t
                      ? t.date ? <Text style={[s.taskDue, { color: C.textMuted }]}>{t.date}{t.time ? ` ${t.time}` : ''}</Text> : null
                      : t.due ? <Text style={[s.taskDue, { color: C.textMuted }]}>{t.due}</Text> : null
                    }
                  </View>
                </View>
              ))}
            </View>
          )}

          {phase === 'done' && result?.events && result.events.length > 0 && (
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
            <View style={s.doneActions}>
              <TouchableOpacity
                style={[s.tasksBtn, { backgroundColor: C.accent }]}
                onPress={() => navigation.navigate('Tasks')}
              >
                <Ionicons name="checkbox-outline" size={18} color="#fff" />
                <Text style={s.tasksBtnText}>Даалгавар харах</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.newBtn, { borderColor: C.accentMid, backgroundColor: C.accentLight }]}
                onPress={handleReset}
              >
                <Ionicons name="add-circle-outline" size={18} color={C.accent} />
                <Text style={[s.newBtnText, { color: C.accent }]}>Шинэ тэмдэглэл</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>

        {/* DateTimePicker — iOS modal, Android dialog */}
        {pickerOpen && (
          Platform.OS === 'ios' ? (
            <Modal transparent animationType="slide">
              <View style={s.pickerOverlay}>
                <View style={[s.pickerSheet, { backgroundColor: C.surface }]}>
                  <View style={s.pickerHeader}>
                    <Text style={[s.pickerTitle, { color: C.text }]}>
                      {pickerOpen.mode === 'date' ? 'Огноо сонгох' : 'Цаг сонгох'}
                    </Text>
                    <TouchableOpacity onPress={() => setPickerOpen(null)}>
                      <Text style={[s.pickerDone, { color: C.accent }]}>Болсон</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={getPickerDate(pickerOpen.idx)}
                    mode={pickerOpen.mode}
                    display="spinner"
                    locale="mn-MN"
                    minuteInterval={5}
                    onValueChange={handlePickerChange}
                    style={{ width: '100%' }}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={getPickerDate(pickerOpen.idx)}
              mode={pickerOpen.mode}
              display="default"
              onValueChange={handlePickerChange}
            />
          )
        )}
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

const BTN = 140;

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20 },

  header: { paddingTop: 16, paddingBottom: 16 },
  greeting: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },

  // Tab switcher
  tabWrap: {
    flexDirection: 'row', borderRadius: 14, borderWidth: 1,
    padding: 4, marginBottom: 8, position: 'relative', overflow: 'hidden',
  },
  tabIndicator: {
    position: 'absolute', top: 4, width: '48%', bottom: 4, borderRadius: 10,
    shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, zIndex: 1,
  },
  tabLabel: { fontSize: 14 },

  // Voice stage
  stage: { alignItems: 'center', paddingVertical: 28, marginVertical: 4 },
  micContainer: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center' },
  ambientGlow: { position: 'absolute', width: 230, height: 230, borderRadius: 115 },
  pulseRing: {
    position: 'absolute', width: BTN + 32, height: BTN + 32,
    borderRadius: (BTN + 32) / 2, borderWidth: 1.5,
  },
  micShadow: {
    borderRadius: BTN / 2, shadowOpacity: 0.42, shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 }, elevation: 16,
  },
  micBtnTouch: { borderRadius: BTN / 2, overflow: 'hidden' },
  micBtn: { width: BTN, height: BTN, alignItems: 'center', justifyContent: 'center' },
  pauseIcon: { flexDirection: 'row', gap: 9, alignItems: 'center' },
  pauseBar: { width: 5, height: 26, borderRadius: 3, backgroundColor: '#fff' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  recIndicator: { width: 7, height: 7, borderRadius: 3.5 },
  statusLabel: { fontSize: 14, fontWeight: '600', letterSpacing: 0.1 },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 16, height: 40 },
  hintText: { marginTop: 10, fontSize: 13 },

  // Chat mode
  chatWrap: { paddingTop: 8, gap: 10 },
  chatRow: { flexDirection: 'row' },
  chatRowLeft: { justifyContent: 'flex-start' },
  chatRowRight: { justifyContent: 'flex-end' },
  aiBubble: { maxWidth: '86%', borderRadius: 18, borderTopLeftRadius: 4, padding: 12, gap: 4 },
  aiBubbleHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  aiBubbleLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  aiBubbleText: { fontSize: 14, lineHeight: 20 },
  userBubble: { maxWidth: '78%', borderRadius: 18, borderTopRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
  userBubbleText: { fontSize: 14, color: '#fff', lineHeight: 20 },
  chatTaskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingTop: 8, borderTopWidth: 1, marginTop: 4 },
  chatTaskDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5, flexShrink: 0 },
  chatTaskTitle: { fontSize: 13, fontWeight: '600' },
  chatTaskDue: { fontSize: 11, marginTop: 2 },
  chatSaveBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, marginTop: 10, alignSelf: 'flex-start' },
  chatSaveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  chatSavedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  chatSavedText: { fontSize: 12, fontWeight: '600', color: '#10b981' },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginTop: 4 },
  chatInput: { flex: 1, fontSize: 14, lineHeight: 20, maxHeight: 80, paddingTop: 2 },
  chatSendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Text mode (kept for handleTextSubmit compatibility)
  textMode: { paddingTop: 16, gap: 14 },
  textInputWrap: {
    borderRadius: 18, borderWidth: 1, padding: 16, minHeight: 180,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
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

  // Clarification
  clarifySection: { marginBottom: 12 },
  clarifyTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  clarifySub: { fontSize: 13, marginBottom: 14 },
  clarifyCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  clarifyTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  clarifyBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  clarifyBadgeText: { fontSize: 12, fontWeight: '800' },
  clarifyTaskTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20, flex: 1 },
  modeToggle: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 12,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 9,
  },
  modeBtnRight: { borderLeftWidth: 1 },
  modeBtnText: { fontSize: 12, fontWeight: '600' },
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '600', marginBottom: 5 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  taskMicWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  taskPulseRing: {},
  taskMicBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  stopSquare: { width: 16, height: 16, borderRadius: 3, backgroundColor: '#fff' },
  voiceHint: { fontSize: 12, flex: 1, lineHeight: 18 },
  catChip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6 },
  catChipText: { fontSize: 12 },
  urgentLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  urgentRow: { flexDirection: 'row', gap: 8, marginTop: 0 },
  urgentBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  urgentBtnText: { fontSize: 13, fontWeight: '600' },
  saveClarifyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
    shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  saveClarifyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Saving
  savingSection: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  savingText: { fontSize: 14 },

  // Done actions
  doneActions: { gap: 10, marginBottom: 4 },
  tasksBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  tasksBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
  },
  newBtnText: { fontSize: 14, fontWeight: '600' },

  // Date picker buttons
  datePickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
  },
  datePickText: { fontSize: 13, fontWeight: '500' },

  // iOS picker modal
  pickerOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 8,
  },
  pickerTitle: { fontSize: 16, fontWeight: '700' },
  pickerDone: { fontSize: 15, fontWeight: '700' },
  recurBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  recurBadgeText:  { fontSize: 11, fontWeight: '600' },
  recurBadgeCount: { fontSize: 11, fontWeight: '400', opacity: 0.7 },
  recurConfirmRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, flexWrap: 'wrap' },
  recurConfirmText:{ fontSize: 12, fontWeight: '600' },
  recurBtn:        { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  recurBtnText:    { fontSize: 11, fontWeight: '700', color: '#fff' },
});
