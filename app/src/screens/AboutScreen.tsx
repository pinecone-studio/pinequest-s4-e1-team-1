import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Feather } from 'expo-vector-icons';
import { useTheme } from '../theme/ThemeContext';

export default function AboutScreen() {
  const { colors: C } = useTheme();

  return (
    <ScrollView style={[s.container, { backgroundColor: C.bg }]} contentContainerStyle={s.content}>
      <View style={s.header}>
        <View style={[s.logo, { backgroundColor: C.accent }]}>
          <Text style={s.logoText}>PQ</Text>
        </View>
        <Text style={[s.appName, { color: C.text }]}>PineQuest</Text>
        <Text style={[s.version, { color: C.textMuted }]}>v1.0.0</Text>
      </View>

      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: C.text }]}>Аппликейшний Тайлбар</Text>
        <Text style={[s.description, { color: C.textSec }]}>
          PineQuest бол таны өнөөдрийн үйл ажиллагааг хэлээр бичиж авч, текст
          болгон хувиргаж, даалгавар үүсгэх боломжтой ухаалаг тусламч юм.
        </Text>
      </View>

      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: C.text }]}>Үндсэн Функцүүд</Text>
        <View style={s.featureList}>
          <FeatureItem icon="mic"          title="Дуу Бичих"        description="Та өөрийн сүүлийн үйл ажиллагаа дуугаар бичиж авч болно" colors={C} />
          <FeatureItem icon="type"         title="Текст Үүсгэх"     description="Дууг автоматаар текст болгон хувиргадаг" colors={C} />
          <FeatureItem icon="check-square" title="Даалгавар Удирдах" description="Текстээс даалгавар үүсгэж, хийсэн эсэхийг хянана" colors={C} />
          <FeatureItem icon="calendar"     title="Хөлөг Цаг"        description="Өдрийн бүх үйл ажиллагаа нэг газруудаа хүргүүлэн харна" colors={C} />
          <FeatureItem icon="bar-chart-2"  title="Тайлан Үзүүлэх"   description="Өдрийн статистик, прогрес болон гүйцэтгэлийн тайлан" colors={C} />
        </View>
      </View>

      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: C.text }]}>Үндсэн Давхамга</Text>
        <InfoItem icon="layers"  title="Ухаалаг Бичлэг"       description="AI ашиглан таны үйлсийг автоматаар ангилж, хадгалдаг" colors={C} />
        <InfoItem icon="shield"  title="Нууцлалын Хамгаалалт" description="Таны өгөгдөл бүхэлдээ аюулгүй хранилахдаа сохранилдаг" colors={C} />
        <InfoItem icon="sync"    title="Автоматаар Синхронизац" description="Таны өгөгдөл бүх төхөөрөмжүүд дээр шинэхэн байдаг" colors={C} />
      </View>

      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: C.text }]}>Түгээмэл Асуултууд</Text>
        <FAQItem q="Миний дуу бичлэг нууцлагдаж байна уу?" a="Тийм, бүх дуу бичлэг 256-битийн шифрлэлтээр хамгаалагдана" colors={C} />
        <FAQItem q="Үйл ажиллагаа эргүүлж авч болох уу?"  a="Тийм, Даалгавар цэсээс өмнөх үйл ажиллагаа хайж болно" colors={C} />
        <FAQItem q="Өффлайнд ашиглаж болох уу?"           a="Тийм, өффлайн горимд гол функцүүд боломжтой" colors={C} />
      </View>

      <View style={[s.footer, { borderTopColor: C.border }]}>
        <Text style={[s.footerText, { color: C.textSec }]}>© 2026 PineQuest. Бүх эрх хуулиар хамгаалагдана.</Text>
        <Text style={[s.footerText, s.subText, { color: C.textMuted }]}>
          Та бидэнтэй холбоо барихыг хүсвэл temka@pinequest.io хаягаар илгээнэ үү
        </Text>
      </View>
    </ScrollView>
  );
}

type ColorsArg = ReturnType<typeof useTheme>['colors'];

function FeatureItem({ icon, title, description, colors: C }: { icon: string; title: string; description: string; colors: ColorsArg }) {
  return (
    <View style={[s.featureItem, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={[s.featureIcon, { backgroundColor: C.accentLight }]}>
        <Feather name={icon as any} size={20} color={C.accent} />
      </View>
      <View style={s.featureContent}>
        <Text style={[s.featureTitle, { color: C.text }]}>{title}</Text>
        <Text style={[s.featureDescription, { color: C.textSec }]}>{description}</Text>
      </View>
    </View>
  );
}

function InfoItem({ icon, title, description, colors: C }: { icon: string; title: string; description: string; colors: ColorsArg }) {
  return (
    <View style={[s.infoItem, { borderBottomColor: C.border }]}>
      <Feather name={icon as any} size={18} color={C.accent} style={s.infoIcon} />
      <View>
        <Text style={[s.infoTitle, { color: C.text }]}>{title}</Text>
        <Text style={[s.infoDescription, { color: C.textSec }]}>{description}</Text>
      </View>
    </View>
  );
}

function FAQItem({ q, a, colors: C }: { q: string; a: string; colors: ColorsArg }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <TouchableOpacity
      style={[s.faqItem, { backgroundColor: C.surface, borderColor: C.border }]}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={s.faqQuestion}>
        <Text style={[s.faqQ, { color: C.text }]}>{q}</Text>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={C.accent} />
      </View>
      {expanded && <Text style={[s.faqA, { color: C.textSec }]}>{a}</Text>}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  appName: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  version: { fontSize: 14 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  description: { fontSize: 14, lineHeight: 22 },
  featureList: { gap: 12 },
  featureItem: { flexDirection: 'row', borderRadius: 12, padding: 12, gap: 12, borderWidth: 1 },
  featureIcon: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  featureDescription: { fontSize: 12 },
  infoItem: { flexDirection: 'row', paddingVertical: 12, gap: 12, borderBottomWidth: 1 },
  infoIcon: { marginTop: 2 },
  infoTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  infoDescription: { fontSize: 12 },
  faqItem: { borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1 },
  faqQuestion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { fontSize: 13, fontWeight: '600', flex: 1 },
  faqA: { fontSize: 12, marginTop: 8, lineHeight: 18 },
  footer: { alignItems: 'center', paddingTop: 24, borderTopWidth: 1 },
  footerText: { fontSize: 12, textAlign: 'center' },
  subText: { marginTop: 8, fontSize: 11 },
});
