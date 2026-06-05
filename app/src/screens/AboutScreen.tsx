import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Feather } from 'expo-vector-icons';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>PQ</Text>
        </View>
        <Text style={styles.appName}>PineQuest</Text>
        <Text style={styles.version}>v1.0.0</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Аппликейшний Тайлбар</Text>
        <Text style={styles.description}>
          PineQuest бол таны өнөөдрийн үйл ажиллагааг хэлээр бичиж авч, текст
          болгон хувиргаж, даалгавар үүсгэх боломжтой ухаалаг тусламч юм.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Үндсэн Функцүүд</Text>
        <View style={styles.featureList}>
          <FeatureItem
            icon="mic"
            title="Дуу Бичих"
            description="Та өөрийн сүүлийн үйл ажиллагаа дуугаар бичиж авч болно"
          />
          <FeatureItem
            icon="type"
            title="Текст Үүсгэх"
            description="Дууг автоматаар текст болгон хувиргадаг"
          />
          <FeatureItem
            icon="check-square"
            title="Даалгавар Удирдах"
            description="Текстээс даалгавар үүсгэж, хийсэн эсэхийг хянана"
          />
          <FeatureItem
            icon="calendar"
            title="Хөлөг Цаг"
            description="Өдрийн бүх үйл ажиллагаа нэг газруудаа хүргүүлэн харна"
          />
          <FeatureItem
            icon="bar-chart-2"
            title="Тайлан Үзүүлэх"
            description="Өдрийн статистик, прогрес болон гүйцэтгэлийн тайлан"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Үндсэн Давхамга</Text>
        <InfoItem
          icon="layers"
          title="Ухаалаг Бичлэг"
          description="AI ашиглан таны үйлсийг автоматаар ангилж, хадгалдаг"
        />
        <InfoItem
          icon="shield"
          title="Нууцлалын Хамгаалалт"
          description="Таны өгөгдөл бүхэлдээ аюулгүй хранилахдаа сохранилдаг"
        />
        <InfoItem
          icon="sync"
          title="Автоматаар Синхронизац"
          description="Таны өгөгдөл бүх төхөөрөмжүүд дээр шинэхэн байдаг"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Түгээмэл Асуултууд</Text>
        <FAQItem
          q="Миний дуу бичлэг нууцлагдаж байна уу?"
          a="Тийм, бүх дуу бичлэг 256-битийн шифрлэлтээр хамгаалагдана"
        />
        <FAQItem
          q="Үйл ажиллагаа эргүүлж авч болох уу?"
          a="Тийм, Даалгавар цэсээс өмнөх үйл ажиллагаа хайж болно"
        />
        <FAQItem
          q="Өффлайнд ашиглаж болох уу?"
          a="Тийм, өффлайн горимд гол функцүүд боломжтой"
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 PineQuest. Бүх эрх хуулиар хамгаалагдана.</Text>
        <Text style={[styles.footerText, styles.subText]}>
          Та бидэнтэй холбоо барихыг хүсвэл temka@pinequest.io хаягаар илгээнэ үү
        </Text>
      </View>
    </ScrollView>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Feather name={icon as any} size={20} color="#4f46e5" />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

function InfoItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.infoItem}>
      <Feather name={icon as any} size={18} color="#4f46e5" style={styles.infoIcon} />
      <View>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoDescription}>{description}</Text>
      </View>
    </View>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={styles.faqQuestion}>
        <Text style={styles.faqQ}>{q}</Text>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#4f46e5"
        />
      </View>
      {expanded && <Text style={styles.faqA}>{a}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 24, paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  appName: { fontSize: 28, fontWeight: '700', color: '#111', marginBottom: 4 },
  version: { fontSize: 14, color: '#9ca3af' },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  featureList: { gap: 12 },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 2 },
  featureDescription: { fontSize: 12, color: '#6b7280' },
  infoItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoIcon: { marginTop: 2 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 2 },
  infoDescription: { fontSize: 12, color: '#6b7280' },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQ: { fontSize: 13, fontWeight: '600', color: '#111', flex: 1 },
  faqA: { fontSize: 12, color: '#6b7280', marginTop: 8, lineHeight: 18 },
  footer: { alignItems: 'center', paddingTop: 24, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  footerText: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
  subText: { marginTop: 8, fontSize: 11, color: '#9ca3af' },
});
