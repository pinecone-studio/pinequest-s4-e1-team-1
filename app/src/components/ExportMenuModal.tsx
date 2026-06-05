import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather } from 'expo-vector-icons';
import { exportPdf, printPdf, emailPdf } from '../utils/reportPdfExport';

type ReportData = Parameters<typeof exportPdf>[0];

type Props = { visible: boolean; onClose: () => void; data: ReportData };

function Row({ icon, label, color, onPress }: {
  icon: keyof typeof Feather.glyphMap; label: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.iconWrap, { backgroundColor: color + '22' }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={s.rowLabel}>{label}</Text>
      <Feather name="chevron-right" size={16} color="#CBD5E0" />
    </TouchableOpacity>
  );
}

export default function ExportMenuModal({ visible, onClose, data }: Props) {
  const handle = (action: () => Promise<void>) => () => { onClose(); action(); };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.handle} />
        <Text style={s.title}>PDF тайлан</Text>
        <Row icon="share-2"  label="Хуваалцах / Татах"  color="#6C47FF" onPress={handle(() => exportPdf(data))} />
        <Row icon="printer"  label="Хэвлэх"              color="#0891b2" onPress={handle(() => printPdf(data))} />
        {Platform.OS === 'ios' && (
          <Row icon="mail" label="Имэйлээр илгээх" color="#16a34a" onPress={handle(() => emailPdf(data))} />
        )}
        <TouchableOpacity style={s.cancel} onPress={onClose} activeOpacity={0.7}>
          <Text style={s.cancelTxt}>Болих</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
  handle: { width: 36, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  title: { fontSize: 16, fontWeight: '800', color: '#1A1A2E', marginBottom: 8, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F7' },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, color: '#1A1A2E', fontWeight: '600' },
  cancel: { marginTop: 16, paddingVertical: 14, alignItems: 'center', backgroundColor: '#F0F0F7', borderRadius: 14 },
  cancelTxt: { fontSize: 15, fontWeight: '700', color: '#6C47FF' },
});
