import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { fetchReport, ReportPeriod, ReportType } from '../api';
import { styles } from './ReportScreenStyles';

type Report = {
  period: ReportPeriod;
  type: ReportType;
  label: string;
  startDate: string;
  endDate: string;
  entryCount: number;
  taskCount: number;
  completedTaskCount: number;
  pendingTaskCount: number;
  eventCount: number;
  summary: string;
};

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: 'day', label: 'Өдөр' },
  { key: 'week', label: '7 хоног' },
  { key: 'month', label: '1 сар' },
];

const SUMMARY_LABELS: Record<ReportPeriod, Record<ReportType, string>> = {
  day:   { general: 'Таны өнөөдрийн дүгнэлт',    work: 'Таны өнөөдрийн ажлын тайлан' },
  week:  { general: 'Таны 7 хоногийн үр дүн',     work: 'Таны 7 хоногийн ажлын тайлан' },
  month: { general: 'Таны сарын үр дүн',          work: 'Таны сарын ажлын тайлан' },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ReportScreen() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [period, setPeriod] = useState<ReportPeriod>('day');
  const [reportType, setReportType] = useState<ReportType>('general');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const load = async (date: string, p: ReportPeriod, t: ReportType) => {
    setLoading(true);
    setReport(null);
    try {
      setReport(await fetchReport(date, p, t));
    } catch (err: any) {
      Alert.alert('Алдаа', err?.response?.data?.error ?? err.message ?? 'Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const changeDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const dateRangeLabel = report
    ? report.period === 'day'
      ? formatDate(report.endDate)
      : `${formatDate(report.startDate)} – ${formatDate(report.endDate)}`
    : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Тайлан</Text>

      <View style={styles.typeToggle}>
        {(['general', 'work'] as ReportType[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, reportType === t && styles.typeBtnActive]}
            onPress={() => { setReportType(t); setReport(null); }}
          >
            <Text style={[styles.typeBtnText, reportType === t && styles.typeBtnTextActive]}>
              {t === 'general' ? 'Ерөнхий' : 'Ажлын'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tabs}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[styles.tab, period === p.key && styles.tabActive]}
            onPress={() => { setPeriod(p.key); setReport(null); }}
          >
            <Text style={[styles.tabText, period === p.key && styles.tabTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.datePicker}>
        <TouchableOpacity style={styles.arrow} onPress={() => changeDay(-1)}>
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.dateBtn}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </View>
        <TouchableOpacity style={styles.arrow} onPress={() => changeDay(1)}>
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.loadBtn} onPress={() => load(selectedDate, period, reportType)} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loadBtnText}>Тайлан харах</Text>}
      </TouchableOpacity>

      {report && (
        <>
          {dateRangeLabel && <Text style={styles.rangeLabel}>{dateRangeLabel}</Text>}
          <View style={styles.statsRow}>
            <StatCard label="Бүртгэл" value={report.entryCount} color="#4f46e5" />
            <StatCard label="Даалгавар" value={report.taskCount} color="#0891b2" />
            <StatCard label="Гүйцэтгэл" value={report.completedTaskCount} color="#16a34a" />
            <StatCard label="Хүлээгдэж буй" value={report.pendingTaskCount} color="#d97706" />
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{SUMMARY_LABELS[report.period][report.type]}</Text>
            <Text style={styles.cardText}>{report.summary}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}
