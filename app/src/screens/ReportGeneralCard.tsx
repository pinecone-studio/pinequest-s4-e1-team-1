import { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
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

const { width: SW } = Dimensions.get('window');
const STORY_W = SW - 48;
const STORY_H = STORY_W * 1.6;

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function motivationalText(pct: number): string {
  if (pct >= 100) return 'Өнөөдрийн бүх зорилгоо\nбиелүүллээ. Гайхалтай!';
  if (pct >= 80)  return 'Маш өндөр гүйцэтгэлтэй\nөдөр боллоо. Үргэлжлүүл!';
  if (pct >= 60)  return 'Хагасаас илүүг дийлсэн.\nЗохион байгуулалт шилдэг!';
  if (pct >= 40)  return 'Алхам тутмаар зорилгодоо\nойртож байна. Зөв зам!';
  if (pct > 0)    return 'Эхлэл тавив. Жижиг алхмаас\nтом зам эхэлдэг!';
  return 'Өнөөдрөөс тэмдэглэл\nхөтлөж эхэллээ.';
}

function pctIcon(pct: number): keyof typeof Ionicons.glyphMap {
  if (pct >= 100) return 'trophy';
  if (pct >= 75) return 'flame';
  if (pct >= 50) return 'flash';
  return 'trending-up';
}

function Stat({ label, value, color, bgColor, labelColor }: { label: string; value: number; color: string; bgColor: string; labelColor: string }) {
  return (
    <View style={[s.stat, { backgroundColor: bgColor }]}>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={[s.statLbl, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

function AchievementSection({ pct, completed, total, C }: { pct: number; completed: number; total: number; C: any }) {
  return (
    <View style={[s.achieveCard, { backgroundColor: C.surface }]}>
      <View style={s.achieveHeader}>
        <Ionicons name={pctIcon(pct)} size={18} color="#7c3aed" />
        <Text style={[s.achieveTitle, { color: C.text }]}>Амжилтын үзүүлэлт</Text>
      </View>
      <Text style={s.achievePct}>{pct}%</Text>
      <View style={[s.trackBg, { backgroundColor: C.border }]}>
        <LinearGradient
          colors={['#7c3aed', '#db2777']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[s.trackFill, { width: `${Math.min(pct, 100)}%` }]}
        />
      </View>
      <Text style={[s.achieveSub, { color: C.textMuted }]}>
        {total > 0 ? `${completed} / ${total} даалгавар гүйцэтгэсэн` : 'Даалгавар байхгүй'}
      </Text>
    </View>
  );
}

export default function ReportGeneralCard(p: Props) {
  const { colors: C } = useTheme();
  const [storyVisible, setStoryVisible] = useState(false);
  const [sharing, setSharing] = useState(false);
  const storyRef = useRef<View>(null);

  const pct = p.taskCount > 0 ? Math.round(p.completedTaskCount / p.taskCount * 100) : 0;
  const range = p.period === 'day' ? fmt(p.endDate) : `${fmt(p.startDate)} – ${fmt(p.endDate)}`;

  const handleShare = async () => {
    setSharing(true);
    try {
      const uri = await captureRef(storyRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Story хуваалцах' });
    } catch {
      Alert.alert('Алдаа', 'Хуваалцахад алдаа гарлаа.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View>
      <Text style={[s.range, { color: C.textMuted }]}>{range}</Text>

      <View style={s.grid}>
        <Stat label="Бүртгэл"    value={p.entryCount}         color="#6C47FF" bgColor={C.surface} labelColor={C.textMuted} />
        <Stat label="Даалгавар"  value={p.taskCount}          color="#0891b2" bgColor={C.surface} labelColor={C.textMuted} />
        <Stat label="Гүйцэтгэл" value={p.completedTaskCount} color="#16a34a" bgColor={C.surface} labelColor={C.textMuted} />
        <Stat label="Үлдсэн"     value={p.pendingTaskCount}   color="#d97706" bgColor={C.surface} labelColor={C.textMuted} />
      </View>

      <AchievementSection pct={pct} completed={p.completedTaskCount} total={p.taskCount} C={C} />

      <LinearGradient colors={['#5B3FE0', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
        <View style={s.circle1} />
        <View style={s.circle2} />
        <Text style={s.cardLbl}>{LABEL[p.period] ?? 'Дүгнэлт'}</Text>
        <Text style={s.cardTxt}>{p.summary}</Text>
      </LinearGradient>

      <TouchableOpacity style={s.storyBtn} onPress={() => setStoryVisible(true)} activeOpacity={0.85}>
        <LinearGradient colors={['#7c3aed', '#db2777']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.storyBtnGrad}>
          <Ionicons name="logo-instagram" size={18} color="#fff" />
          <Text style={s.storyBtnText}>Story хуваалцах</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={storyVisible} transparent animationType="fade" onRequestClose={() => setStoryVisible(false)}>
        <View style={s.overlay}>
          <View ref={storyRef} style={[s.storyCard, { width: STORY_W, height: STORY_H }]}>
            <LinearGradient colors={['#0f0a1e', '#1a0b2e', '#2d1b4e']} style={StyleSheet.absoluteFill} />
            <View style={s.storyBlob1} />
            <View style={s.storyBlob2} />

            <View style={s.storyInner}>
              <View style={s.storyTopRow}>
                <Text style={s.storyAppName}>MonTask</Text>
                <Text style={s.storyDate}>{fmt(p.endDate)}</Text>
              </View>

              <View style={s.storyCenter}>
                <Text style={s.storyPctLabel}>ГҮЙЦЭТГЭЛ</Text>
                <Text style={s.storyPct}>{pct}%</Text>
                <View style={s.storyTrack}>
                  <LinearGradient
                    colors={['#a78bfa', '#db2777']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[s.storyTrackFill, { width: `${Math.min(pct, 100)}%` }]}
                  />
                </View>
                <Text style={s.storyTaskSub}>{p.completedTaskCount} / {p.taskCount} даалгавар</Text>
              </View>

              <View style={s.storyStatsRow}>
                <View style={s.storyStat}>
                  <Text style={s.storyStatVal}>{p.entryCount}</Text>
                  <Text style={s.storyStatLbl}>Бүртгэл</Text>
                </View>
                <View style={s.storyDivider} />
                <View style={s.storyStat}>
                  <Text style={s.storyStatVal}>{p.completedTaskCount}</Text>
                  <Text style={s.storyStatLbl}>Гүйцэтгэл</Text>
                </View>
                <View style={s.storyDivider} />
                <View style={s.storyStat}>
                  <Text style={s.storyStatVal}>{p.pendingTaskCount}</Text>
                  <Text style={s.storyStatLbl}>Үлдсэн</Text>
                </View>
              </View>

              <View style={s.storySummaryBox}>
                <Text style={s.storySummary}>{motivationalText(pct)}</Text>
              </View>
            </View>
          </View>

          <View style={s.modalBtns}>
            <TouchableOpacity style={s.shareBtn} onPress={handleShare} disabled={sharing} activeOpacity={0.85}>
              {sharing
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="share-social-outline" size={18} color="#fff" />
                    <Text style={s.shareBtnText}>Хуваалцах</Text>
                  </>
              }
            </TouchableOpacity>
            <TouchableOpacity style={s.closeBtn} onPress={() => setStoryVisible(false)} activeOpacity={0.8}>
              <Text style={s.closeBtnText}>Хаах</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  // Achievement section
  achieveCard: {
    borderRadius: 20, padding: 20, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  achieveHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  achieveTitle: { fontSize: 14, fontWeight: '700' },
  achievePct: { fontSize: 52, fontWeight: '900', color: '#7c3aed', letterSpacing: -2, marginBottom: 10 },
  trackBg: { height: 8, borderRadius: 4, marginBottom: 10, overflow: 'hidden' },
  trackFill: { height: 8, borderRadius: 4 },
  achieveSub: { fontSize: 13, fontWeight: '500' },

  // Story button
  storyBtn: { marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  storyBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  storyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Modal overlay
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', gap: 20 },

  // Story card
  storyCard: { borderRadius: 24, overflow: 'hidden' },
  storyBlob1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, top: -60, right: -60, backgroundColor: 'rgba(124,58,237,0.25)' },
  storyBlob2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, bottom: 40, left: -50, backgroundColor: 'rgba(219,39,119,0.2)' },
  storyInner: { flex: 1, padding: 28, justifyContent: 'space-between' },
  storyTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storyAppName: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  storyDate: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  storyCenter: { alignItems: 'flex-start' },
  storyPctLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, marginBottom: 4 },
  storyPct: { fontSize: 80, fontWeight: '900', color: '#fff', letterSpacing: -4, lineHeight: 88 },
  storyTrack: { width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 12, marginBottom: 8, overflow: 'hidden' },
  storyTrackFill: { height: 6, borderRadius: 3 },
  storyTaskSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  storyStatsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 },
  storyStat: { flex: 1, alignItems: 'center' },
  storyStatVal: { fontSize: 24, fontWeight: '800', color: '#fff' },
  storyStatLbl: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontWeight: '500' },
  storyDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.12)' },
  storySummaryBox: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 },
  storySummary: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 20, fontWeight: '400' },
  storyFooter: { fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontWeight: '600', letterSpacing: 0.5 },

  // Modal buttons
  modalBtns: { flexDirection: 'row', gap: 12 },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 14 },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  closeBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)' },
  closeBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
