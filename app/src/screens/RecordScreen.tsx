import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  RecordingPresets,
} from 'expo-audio';
import { transcribeAudio, processText, saveEntry } from '../api';

type ProcessResult = {
  tasks: { title: string; due: string }[];
  events: { title: string; datetime: string }[];
  summary: string;
};

export default function RecordScreen() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const [loading, setLoading] = useState(false);
  const [transcribed, setTranscribed] = useState('');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    requestRecordingPermissionsAsync().then((status) => {
      setPermissionGranted(status.granted);
      if (!status.granted) {
        Alert.alert('Зөвшөөрөл хэрэгтэй', 'Микрофоны зөвшөөрөл өгнө үү.');
      }
    });
  }, []);

  const handlePress = async () => {
    if (!permissionGranted) {
      Alert.alert('Зөвшөөрөл хэрэгтэй', 'Тохиргоо руу ороод микрофоны зөвшөөрөл олгоно уу.');
      return;
    }

    if (state.isRecording) {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) return;

      setLoading(true);
      setTranscribed('');
      setResult(null);

      try {
        const { text } = await transcribeAudio(uri);
        setTranscribed(text);

        const processed = await processText(text);
        setResult(processed);

        await saveEntry({ text, ...processed });
      } catch (err: any) {
        Alert.alert('Алдаа', err?.response?.data?.error ?? err.message ?? 'Алдаа гарлаа');
      } finally {
        setLoading(false);
      }
    } else {
      setTranscribed('');
      setResult(null);
      await recorder.prepareToRecordAsync();
      recorder.record();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Дуу бичих</Text>

      <TouchableOpacity
        style={[styles.micButton, state.isRecording && styles.micButtonActive]}
        onPress={handlePress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <Text style={styles.micIcon}>{state.isRecording ? '⏹' : '🎙'}</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>
        {loading
          ? 'Боловсруулж байна...'
          : state.isRecording
          ? 'Бичиж байна... дахин дарж зогсоо'
          : 'Дарж бичлэг эхлүүлнэ'}
      </Text>

      {!!transcribed && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Таних үр дүн:</Text>
          <Text style={styles.cardText}>{transcribed}</Text>
        </View>
      )}

      {result && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Хураангуй:</Text>
            <Text style={styles.cardText}>{result.summary}</Text>
          </View>

          {result.tasks.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Даалгаврууд:</Text>
              {result.tasks.map((t, i) => (
                <Text key={i} style={styles.listItem}>
                  • {t.title} {t.due ? `(${t.due})` : ''}
                </Text>
              ))}
            </View>
          )}

          {result.events.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Үйл явдлууд:</Text>
              {result.events.map((e, i) => (
                <Text key={i} style={styles.listItem}>
                  • {e.title}
                </Text>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 40,
    marginTop: 16,
    color: '#111',
  },
  micButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },
  micIcon: {
    fontSize: 52,
  },
  hint: {
    marginTop: 20,
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardText: {
    fontSize: 15,
    color: '#111',
    lineHeight: 22,
  },
  listItem: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
    lineHeight: 20,
  },
});
