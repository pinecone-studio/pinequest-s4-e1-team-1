import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const load = useCallback(async (date: string, p: ReportPeriod, t: ReportType) => {
    setLoading(true);
    setReport(null);
    try {
      setReport(await fetchReport(date, p, t));
    } catch (err: any) {
      Alert.alert('Алдаа', err?.response?.data?.error ?? err.message ?? 'Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      load(today, period, reportType);
    }, [])
  );

  const changeDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    const newDate = d.toISOString().split('T')[0];
    setSelectedDate(newDate);
    load(newDate, period, reportType);
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={['top']}>
    <ScrollView contentContainerStyle={s.content}>
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
            onPress={() => { setReportType(t); load(selectedDate, period, t); }}
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
            onPress={() => { setPeriod(p.key); load(selectedDate, p.key, reportType); }}
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

      {report && (() => {
        const signal = report.workloadSignal;
        const bgColor   = signal === 'overload' ? '#fff1f2' : signal === 'ok' ? '#f0fdf4' : '#eef2ff';
        const bdColor   = signal === 'overload' ? '#fecdd3' : signal === 'ok' ? '#bbf7d0' : '#c7d2fe';
        const txtColor  = signal === 'overload' ? '#be123c'  : signal === 'ok' ? '#15803d' : '#4338ca';
        const iconName  = signal === 'overload' ? 'warning-outline' : signal === 'ok' ? 'checkmark-circle-outline' : 'trending-up-outline';
        const labelTxt  = signal === 'overload' ? 'Хэт ачаалалтай' : signal === 'ok' ? 'Тэнцвэртэй' : 'Бага ачаалал';
        return (
          <View style={[s.workloadBanner, { backgroundColor: bgColor, borderColor: bdColor }]}>
            <Ionicons name={iconName as any} size={18} color={txtColor} style={{ marginTop: 1 }} />
            <View style={s.workloadBody}>
              <Text style={[s.workloadLabel, { color: txtColor }]}>{labelTxt}</Text>
              <Text style={[s.workloadAdvice, { color: txtColor }]}>{report.workloadAdvice}</Text>
            </View>
          </View>
        );
      })()}

      {report && (
        reportType === 'work'
          ? <ReportWorkCard {...report} />
          : <ReportGeneralCard {...report} />
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
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

  workloadBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  workloadBody:   { flex: 1, gap: 2 },
  workloadLabel:  { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.7 },
  workloadAdvice: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
});
