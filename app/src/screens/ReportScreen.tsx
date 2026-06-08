import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { fetchReport, ReportPeriod, ReportType } from '../api';
import ReportGeneralCard from './ReportGeneralCard';
import ReportWorkCard from './ReportWorkCard';
import { useTheme } from '../theme/ThemeContext';

type Report = Awaited<ReturnType<typeof fetchReport>>;

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: 'day', label: 'Өдөр' },
  { key: 'week', label: '7 хоног' },
  { key: 'month', label: '1 сар' },
];

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function ReportScreen() {
  const { colors: C } = useTheme();
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

  return (
    <ScrollView style={[s.root, { backgroundColor: C.bg }]} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Text style={[s.pageTitle, { color: C.text }]}>Тайлан</Text>
        <Text style={[s.pageSub, { color: C.textMuted }]}>Гүйцэтгэлийн шинжилгээ</Text>
      </View>

      {/* Type toggle */}
      <View style={[s.toggle, { backgroundColor: C.surfaceAlt }]}>
        {(['general', 'work'] as ReportType[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[s.toggleBtn, reportType === t && [s.toggleBtnActive, { backgroundColor: C.surface }]]}
            onPress={() => { setReportType(t); setReport(null); }}
            activeOpacity={0.7}
          >
            <Text style={[s.toggleTxt, { color: C.textMuted }, reportType === t && { color: C.text, fontWeight: '700' }]}>
              {t === 'general' ? 'Хувийн' : 'Ажлын'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Period tabs */}
      <View style={[s.tabs, { backgroundColor: C.surfaceAlt }]}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[s.tab, period === p.key && [s.tabActive, { backgroundColor: C.surface }]]}
            onPress={() => { setPeriod(p.key); setReport(null); }}
            activeOpacity={0.7}
          >
            <Text style={[s.tabTxt, { color: C.textMuted }, period === p.key && { color: C.text, fontWeight: '700' }]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date picker */}
      <View style={s.datePicker}>
        <TouchableOpacity style={s.arrow} onPress={() => changeDay(-1)}>
          <Text style={[s.arrowTxt, { color: C.accent }]}>‹</Text>
        </TouchableOpacity>
        <View style={[s.dateBox, { backgroundColor: C.surface }]}>
          <Text style={[s.dateTxt, { color: C.text }]}>{fmt(selectedDate)}</Text>
        </View>
        <TouchableOpacity style={s.arrow} onPress={() => changeDay(1)}>
          <Text style={[s.arrowTxt, { color: C.accent }]}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[s.btn, { backgroundColor: C.accent, shadowColor: C.accent }]}
        onPress={() => load(selectedDate, period, reportType)}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Тайлан харах</Text>}
      </TouchableOpacity>

      {report && (
        reportType === 'work'
          ? <ReportWorkCard {...report} />
          : <ReportGeneralCard {...report} />
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  header:    { marginBottom: 20, marginTop: 8 },
  pageTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  pageSub:   { fontSize: 13, marginTop: 3 },

  toggle: { flexDirection: 'row', borderRadius: 14, padding: 3, marginBottom: 12, height: 44 },
  toggleBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 11 },
  toggleBtnActive: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  toggleTxt: { fontSize: 13, fontWeight: '600' },

  tabs: { flexDirection: 'row', borderRadius: 14, padding: 3, marginBottom: 16, height: 44 },
  tab: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 11 },
  tabActive: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tabTxt: { fontSize: 13, fontWeight: '600' },

  datePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  arrow: { padding: 12 },
  arrowTxt: { fontSize: 28 },
  dateBox: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12, marginHorizontal: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  dateTxt: { fontSize: 15, fontWeight: '700' },

  btn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 20, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
