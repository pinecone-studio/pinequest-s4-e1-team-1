import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { fetchReport } from '../api';

type Report = {
  date: string;
  entryCount: number;
  taskCount: number;
  eventCount: number;
  summary: string;
};

export default function ReportScreen() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );

  const load = async (date: string) => {
    setLoading(true);
    setReport(null);
    try {
      const data = await fetchReport(date);
      setReport(data);
    } catch (err: any) {
      Alert.alert('Алдаа', err?.response?.data?.error ?? err.message ?? 'Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const changeDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    const next = d.toISOString().split('T')[0];
    setSelectedDate(next);
    load(next);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Өдрийн тайлан</Text>

      <View style={styles.datePicker}>
        <TouchableOpacity style={styles.arrow} onPress={() => changeDay(-1)}>
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateBtn} onPress={() => load(selectedDate)}>
          <Text style={styles.dateText}>{selectedDate}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.arrow} onPress={() => changeDay(1)}>
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.loadBtn} onPress={() => load(selectedDate)} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loadBtnText}>Тайлан харах</Text>
        )}
      </TouchableOpacity>

      {report && (
        <>
          <View style={styles.statsRow}>
            <StatCard label="Бүртгэл" value={report.entryCount} />
            <StatCard label="Даалгавар" value={report.taskCount} />
            <StatCard label="Үйл явдал" value={report.eventCount} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Хураангуй</Text>
            <Text style={styles.cardText}>{report.summary}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#f9fafb', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 24, marginTop: 16, color: '#111' },
  datePicker: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  arrow: { padding: 12 },
  arrowText: { fontSize: 28, color: '#4f46e5' },
  dateBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  dateText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  loadBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 24,
    minWidth: 160,
    alignItems: 'center',
  },
  loadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16, width: '100%' },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statValue: { fontSize: 28, fontWeight: '700', color: '#4f46e5' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  cardText: { fontSize: 15, color: '#111', lineHeight: 22 },
});
