import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

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
  day: 'Өнөөдрийн дүгнэлт',
  week: '7 хоногийн дүгнэлт',
  month: 'Сарын дүгнэлт',
};

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function Stat({ label, value, color, bgColor, labelColor }: { label: string; value: number; color: string; bgColor: string; labelColor: string }) {
  return (
    <View style={[s.stat, { backgroundColor: bgColor }]}>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={[s.statLbl, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

export default function ReportGeneralCard(p: Props) {
  const { colors: C } = useTheme();
  const range = p.period === 'day' ? fmt(p.endDate) : `${fmt(p.startDate)} – ${fmt(p.endDate)}`;
  return (
    <View>
      <Text style={[s.range, { color: C.textMuted }]}>{range}</Text>
      <View style={s.grid}>
        <Stat label="Бүртгэл"    value={p.entryCount}         color="#6C47FF" bgColor={C.surface} labelColor={C.textMuted} />
        <Stat label="Даалгавар"  value={p.taskCount}          color="#0891b2" bgColor={C.surface} labelColor={C.textMuted} />
        <Stat label="Гүйцэтгэл" value={p.completedTaskCount} color="#16a34a" bgColor={C.surface} labelColor={C.textMuted} />
        <Stat label="Үлдсэн"     value={p.pendingTaskCount}   color="#d97706" bgColor={C.surface} labelColor={C.textMuted} />
      </View>
      <LinearGradient colors={['#5B3FE0', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
        <View style={s.circle1} />
        <View style={s.circle2} />
        <Text style={s.cardLbl}>{LABEL[p.period] ?? 'Дүгнэлт'}</Text>
        <Text style={s.cardTxt}>{p.summary}</Text>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  range: { fontSize: 13, fontWeight: '500', marginBottom: 14, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  stat: {
    flex: 1, minWidth: '45%', borderRadius: 16,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statVal: { fontSize: 28, fontWeight: '800' },
  statLbl: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  card: { borderRadius: 20, padding: 20, minHeight: 120, overflow: 'hidden' },
  circle1: { position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' },
  circle2: { position: 'absolute', right: 40, bottom: -40, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.06)' },
  cardLbl: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.6, marginBottom: 10, textTransform: 'uppercase' },
  cardTxt: { fontSize: 14, color: '#fff', lineHeight: 22, fontWeight: '500' },
});
