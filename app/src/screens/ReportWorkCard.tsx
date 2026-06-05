// react is used implicitly via JSX transform
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  period: string;
  startDate: string;
  endDate: string;
  entryCount: number;
  taskCount: number;
  completedTaskCount: number;
  pendingTaskCount: number;
  eventCount: number;
  summary: string;
};

const LABEL: Record<string, string> = {
  day: 'Өнөөдрийн ажлын тайлан',
  week: '7 хоногийн ажлын тайлан',
  month: 'Сарын ажлын тайлан',
};

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <View style={s.progressCard}>
      <View style={s.progressRow}>
        <Text style={s.progressLbl}>Гүйцэтгэлийн хувь</Text>
        <Text style={s.progressPct}>{pct}%</Text>
      </View>
      <View style={s.bar}>
        <View style={[s.fill, { width: `${pct}%` as any }]} />
      </View>
    </View>
  );
}

export default function ReportWorkCard(p: Props) {
  const range = p.period === 'day' ? fmt(p.endDate) : `${fmt(p.startDate)} – ${fmt(p.endDate)}`;
  const total = p.completedTaskCount + p.pendingTaskCount;
  return (
    <View>
      <Text style={s.range}>{range}</Text>
      <ProgressBar done={p.completedTaskCount} total={total} />
      <View style={s.grid}>
        <Stat label="Нийт"       value={total}                color="#6C47FF" />
        <Stat label="Гүйцэтгэл" value={p.completedTaskCount} color="#16a34a" />
        <Stat label="Үлдсэн"    value={p.pendingTaskCount}   color="#d97706" />
        <Stat label="Бүртгэл"   value={p.entryCount}         color="#0891b2" />
      </View>
      <LinearGradient colors={['#5B3FE0', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
        <View style={s.circle1} />
        <View style={s.circle2} />
        <Text style={s.cardLbl}>{LABEL[p.period] ?? 'Ажлын тайлан'}</Text>
        <Text style={s.cardTxt}>{p.summary}</Text>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  range: { fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginBottom: 14, textAlign: 'center' },
  progressCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLbl: { fontSize: 13, fontWeight: '600', color: '#374151' },
  progressPct: { fontSize: 15, fontWeight: '800', color: '#6C47FF' },
  bar: { height: 8, backgroundColor: '#E8E8F0', borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: '#6C47FF', borderRadius: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  stat: {
    flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 16,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statVal: { fontSize: 28, fontWeight: '800' },
  statLbl: { fontSize: 12, color: '#9CA3AF', marginTop: 4, fontWeight: '500' },
  card: { borderRadius: 20, padding: 20, minHeight: 120, overflow: 'hidden' },
  circle1: { position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' },
  circle2: { position: 'absolute', right: 40, bottom: -40, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.06)' },
  cardLbl: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.6, marginBottom: 10, textTransform: 'uppercase' },
  cardTxt: { fontSize: 14, color: '#fff', lineHeight: 22, fontWeight: '500' },
});
