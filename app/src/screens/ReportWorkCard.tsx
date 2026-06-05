import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from 'expo-vector-icons';
import { useState } from 'react';
import ExportMenuModal from '../components/ExportMenuModal';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  label: string; period: string; startDate: string; endDate: string;
  taskCount: number; completedTaskCount: number; pendingTaskCount: number;
  highCount: number; mediumCount: number; lowCount: number;
  entryCount: number;
  executiveSummary: string; insights: string; risks: string; recommendations: string;
};

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function KpiRow({ label, value, total, color, bgColor, labelColor }: { label: string; value: number; total: number; color: string; bgColor: string; labelColor: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={s.kpiRow}>
      <View style={s.kpiLeft}>
        <Text style={[s.kpiLabel, { color: labelColor }]}>{label}</Text>
        <View style={[s.kpiBar, { backgroundColor: bgColor }]}>
          <View style={[s.kpiFill, { width: `${pct}%` as any, backgroundColor: color }]} />
        </View>
      </View>
      <Text style={[s.kpiVal, { color }]}>{value}</Text>
    </View>
  );
}

function Section({ icon, title, text, accent, bgColor, textColor }: { icon: keyof typeof Feather.glyphMap; title: string; text: string; accent: string; bgColor: string; textColor: string }) {
  if (!text) return null;
  return (
    <View style={[s.section, { backgroundColor: bgColor, borderLeftColor: accent }]}>
      <View style={s.sectionHeader}>
        <Feather name={icon} size={14} color={accent} />
        <Text style={[s.sectionTitle, { color: accent }]}>{title}</Text>
      </View>
      <Text style={[s.sectionTxt, { color: textColor }]}>{text}</Text>
    </View>
  );
}

export default function ReportWorkCard(p: Props) {
  const { colors: C } = useTheme();
  const [exportVisible, setExportVisible] = useState(false);
  const range = p.period === 'day' ? fmt(p.endDate) : `${fmt(p.startDate)} – ${fmt(p.endDate)}`;
  const total = p.completedTaskCount + p.pendingTaskCount;
  const pct = total > 0 ? Math.round((p.completedTaskCount / total) * 100) : 0;
  const hasData = total > 0 || !!p.executiveSummary;

  return (
    <View>
      {/* Header */}
      <LinearGradient colors={['#5B3FE0', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <View style={s.circle1} /><View style={s.circle2} />
        <View style={s.headerTop}>
          <Text style={s.headerTitle}>ГҮЙЦЭТГЭЛИЙН ТАЙЛАН</Text>
          <TouchableOpacity style={s.exportBtn} onPress={() => setExportVisible(true)}>
            <Feather name="share" size={13} color="#fff" /><Text style={s.exportBtnTxt}> PDF</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.headerRange}>{range}</Text>
        <View style={s.pctRow}>
          <Text style={s.pctNum}>{pct}%</Text>
          <Text style={s.pctLbl}>нийт гүйцэтгэл</Text>
        </View>
        <View style={s.headerBar}><View style={[s.headerFill, { width: `${pct}%` as any }]} /></View>
      </LinearGradient>

      {!hasData && <Text style={[s.empty, { color: C.textMuted }]}>Ажлын даалгавар олдсонгүй.</Text>}

      {hasData && <>
        {/* KPI grid */}
        <View style={[s.card, { backgroundColor: C.surface }]}>
          <Text style={[s.cardTitle, { color: C.text }]}>Гол үзүүлэлтүүд (KPI)</Text>
          <View style={s.statRow}>
            {[
              { label: 'Нийт', val: total, color: '#6C47FF' },
              { label: 'Гүйцэтгэл', val: p.completedTaskCount, color: '#16a34a' },
              { label: 'Үлдсэн', val: p.pendingTaskCount, color: '#d97706' },
              { label: 'Бүртгэл', val: p.entryCount, color: '#0891b2' },
            ].map(i => (
              <View key={i.label} style={[s.stat, { backgroundColor: C.surfaceAlt }]}>
                <Text style={[s.statVal, { color: i.color }]}>{i.val}</Text>
                <Text style={[s.statLbl, { color: C.textMuted }]}>{i.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Priority breakdown */}
        <View style={[s.card, { backgroundColor: C.surface }]}>
          <Text style={[s.cardTitle, { color: C.text }]}>Ач холбогдлоор</Text>
          <KpiRow label="Өндөр" value={p.highCount}   total={total} color="#ef4444" bgColor={C.surfaceAlt} labelColor={C.textSec} />
          <KpiRow label="Дунд"  value={p.mediumCount} total={total} color="#f59e0b" bgColor={C.surfaceAlt} labelColor={C.textSec} />
          <KpiRow label="Бага"  value={p.lowCount}    total={total} color="#6b7280" bgColor={C.surfaceAlt} labelColor={C.textSec} />
        </View>

        {/* Executive sections */}
        <Section icon="file-text"      title="Товч дүгнэлт" text={p.executiveSummary} accent="#6C47FF" bgColor={C.surface} textColor={C.textSec} />
        <Section icon="bar-chart-2"    title="Шинжилгээ"    text={p.insights}         accent="#0891b2" bgColor={C.surface} textColor={C.textSec} />
        <Section icon="alert-triangle" title="Эрсдэл"       text={p.risks}            accent="#ef4444" bgColor={C.surface} textColor={C.textSec} />
        <Section icon="check-circle"   title="Зөвлөмж"      text={p.recommendations}  accent="#16a34a" bgColor={C.surface} textColor={C.textSec} />

        {/* Footer */}
        <View style={s.footer}>
          <Text style={[s.footerTxt, { color: C.textMuted }]}>PineQuest · Автомат тайлан · {fmt(p.endDate)}</Text>
        </View>
      </>}
      <ExportMenuModal visible={exportVisible} onClose={() => setExportVisible(false)} data={p} />
    </View>
  );
}

const s = StyleSheet.create({
  header: { borderRadius: 20, padding: 20, marginBottom: 14, overflow: 'hidden' },
  circle1: { position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.07)' },
  circle2: { position: 'absolute', left: -20, bottom: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerTitle: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.85)', letterSpacing: 1 },
  exportBtn: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },
  exportBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  headerRange: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 14 },
  pctRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  pctNum: { fontSize: 40, fontWeight: '900', color: '#fff' },
  pctLbl: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  headerBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  headerFill: { height: 6, backgroundColor: '#fff', borderRadius: 3 },

  empty: { textAlign: 'center', fontSize: 14, marginTop: 20 },

  card: { borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTitle: { fontSize: 13, fontWeight: '700', marginBottom: 14, letterSpacing: 0.2 },

  statRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 12 },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLbl: { fontSize: 11, marginTop: 2, fontWeight: '500' },

  kpiRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  kpiLeft: { flex: 1 },
  kpiLabel: { fontSize: 12, fontWeight: '600', marginBottom: 5 },
  kpiBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  kpiFill: { height: 6, borderRadius: 3 },
  kpiVal: { fontSize: 16, fontWeight: '800', minWidth: 28, textAlign: 'right' },

  section: { borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700' },
  sectionTxt: { fontSize: 14, lineHeight: 22 },

  footer: { alignItems: 'center', paddingVertical: 16 },
  footerTxt: { fontSize: 11 },
});
