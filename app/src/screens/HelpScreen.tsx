import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Feather } from "expo-vector-icons";
import { useTheme } from "../theme/ThemeContext";

export default function HelpScreen() {
  const { colors: C } = useTheme();

  const handleEmailPress = () => {
    Linking.openURL("mailto:turboldnamuun@gmail.com?subject=Туслалцаа");
  };

  return (
    <ScrollView
      style={[s.container, { backgroundColor: C.bg }]}
      contentContainerStyle={s.content}
    >
      <View style={s.header}>
        <View style={[s.headerIcon, { backgroundColor: C.accentLight }]}>
          <Feather name="help-circle" size={32} color={C.accent} />
        </View>
        <Text style={[s.headerTitle, { color: C.text }]}>
          Туслалцаа & Дэмжлэг
        </Text>
        <Text style={[s.headerSubtitle, { color: C.textMuted }]}>
          Бид үргэлж тусалд байх нь сайн сэтгэлээр хүлээн зөвшөөрдөг
        </Text>
      </View>

      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: C.text }]}>
          Түгээмэл асуултууд
        </Text>
        <FAQItem
          q="Дуу бичлэг хэрхэн ажилладаг вэ?"
          a="Микрофон товчийг дарж, та өөрийн үйл ажиллагаа дуугаар бичиж авч болно. Апп автоматаар дууг текст болгон хувиргадаг."
          colors={C}
        />
        <FAQItem
          q="Даалгаврыг хэрхэн үүсгэх вэ?"
          a="Дуу эсвэл текст бичсэнийхээ дараа, 'Даалгавар үүсгэх' товчийг дарна. Систем танд даалгавар үүсгэхэд тусална."
          colors={C}
        />
        <FAQItem
          q="Миний өгөгдөл нууцлагдаж байна уу?"
          a="Тийм! Бүх таны өгөгдөл 256-битийн шифрлэлтээр хамгаалагдана. Зөвхөн та л хэвтээ баригдсан үйл ажиллагаадаа хүрч чадна."
          colors={C}
        />
        <FAQItem
          q="Программ сул ажилладаг бол яах вэ?"
          a="Апп-ийг дахин эхлүүлээд үзнэ үү. Хэрэв асуудал үргэлжилвэл, манай дэмжлэгийн баг руу мэйл илгээнэ үү."
          colors={C}
        />
        <FAQItem
          q="Гүйцэтгэлийн тайланг хэрхэн харах вэ?"
          a="Доод цэсний 'Тайлан' хэсгээс өдөр, 7 хоног, сарын гүйцэтгэлийн дүн шинжилгээг харж болно."
          colors={C}
        />
      </View>

      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: C.text }]}>
          Асуудлыг сэргээх
        </Text>
        <TroubleshootItem
          icon="alert-circle"
          title="Микрофон ажилламгүй"
          description="Ап дээрх микрофон эрхийг шалгана уу. Тохиргоо > Эрхүүд > Микрофон"
          colors={C}
        />
        <TroubleshootItem
          icon="wifi-off"
          title="Интернет холбоо байхгүй"
          description="Дуу бичих функц нь интернет холбоо шаардаж байна. Вай-фай эсвэл мобайл өгөгдлөд холбогдохыг оролдоно уу."
          colors={C}
        />
        <TroubleshootItem
          icon="refresh-cw"
          title="Өгөгдөл синхронизац хүндэрэлтэй"
          description="Апп-ийг дахин эхлүүлээд, үргэлжлүүлэхийг оролдоно уу. Хэрэв асуудал үргэлжилвэл, дэмжлэгтэй холбоо барина уу."
          colors={C}
        />
      </View>

      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: C.text }]}>
          Биднийг холбоо барина уу
        </Text>
        <ContactCard
          icon="mail"
          title="И-мэйл"
          description="turboldnamuun@gmail.com"
          onPress={handleEmailPress}
          colors={C}
        />
      </View>

      <View style={[s.footer, { borderTopColor: C.border }]}>
        <Text style={[s.footerText, { color: C.textSec }]}>
          Танд туслахын байхаар сайн сэтгэлээр хүлээн зөвшөөрдөг.
        </Text>
      </View>
    </ScrollView>
  );
}

type ColorsArg = ReturnType<typeof useTheme>["colors"];

function FAQItem({
  q,
  a,
  colors: C,
}: {
  q: string;
  a: string;
  colors: ColorsArg;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <TouchableOpacity
      style={[s.faqItem, { backgroundColor: C.surface, borderColor: C.border }]}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={s.faqQuestion}>
        <Text style={[s.faqQ, { color: C.text }]}>{q}</Text>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={C.accent}
        />
      </View>
      {expanded && <Text style={[s.faqA, { color: C.textSec }]}>{a}</Text>}
    </TouchableOpacity>
  );
}

function TroubleshootItem({
  icon,
  title,
  description,
  colors: C,
}: {
  icon: string;
  title: string;
  description: string;
  colors: ColorsArg;
}) {
  return (
    <View
      style={[
        s.troubleshootItem,
        { backgroundColor: C.surface, borderColor: C.border },
      ]}
    >
      <View style={[s.troubleshootIcon, { backgroundColor: C.accentLight }]}>
        <Feather name={icon as any} size={20} color={C.accent} />
      </View>
      <View style={s.troubleshootContent}>
        <Text style={[s.troubleshootTitle, { color: C.text }]}>{title}</Text>
        <Text style={[s.troubleshootDescription, { color: C.textSec }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

function ContactCard({
  icon,
  title,
  description,
  onPress,
  colors: C,
}: {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  colors: ColorsArg;
}) {
  return (
    <TouchableOpacity
      style={[
        s.contactCard,
        { backgroundColor: C.surface, borderColor: C.accent },
      ]}
      onPress={onPress}
    >
      <View style={[s.contactIcon, { backgroundColor: C.accentLight }]}>
        <Feather name={icon as any} size={20} color={C.accent} />
      </View>
      <View style={s.contactContent}>
        <Text style={[s.contactTitle, { color: C.text }]}>{title}</Text>
        <Text style={[s.contactDescription, { color: C.accent }]}>
          {description}
        </Text>
      </View>
      <Feather name="arrow-right" size={18} color={C.accent} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 32 },
  header: { alignItems: "center", marginBottom: 32 },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  faqItem: { borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1 },
  faqQuestion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQ: { fontSize: 13, fontWeight: "600", flex: 1 },
  faqA: { fontSize: 12, marginTop: 8, lineHeight: 18 },
  troubleshootItem: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
  },
  troubleshootIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  troubleshootContent: { flex: 1 },
  troubleshootTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  troubleshootDescription: { fontSize: 12, lineHeight: 18 },
  contactCard: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    alignItems: "center",
    gap: 12,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  contactContent: { flex: 1 },
  contactTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  contactDescription: { fontSize: 13, fontWeight: "500" },
  footer: { alignItems: "center", paddingTop: 24, borderTopWidth: 1 },
  footerText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
});
