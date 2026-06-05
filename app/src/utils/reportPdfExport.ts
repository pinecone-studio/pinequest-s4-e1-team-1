import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { Alert } from 'react-native';
import { buildReportHtml } from './reportPdfTemplate';

type ReportData = Parameters<typeof buildReportHtml>[0];

async function generatePdf(data: ReportData): Promise<string> {
  const html = buildReportHtml(data);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export async function exportPdf(data: ReportData) {
  try {
    const uri = await generatePdf(data);
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Тайланг хуваалцах', UTI: 'com.adobe.pdf' });
    } else {
      Alert.alert('Амжилттай', `PDF хадгалагдлаа: ${uri}`);
    }
  } catch (err: any) {
    Alert.alert('Алдаа', err.message ?? 'PDF үүсгэхэд алдаа гарлаа');
  }
}

export async function printPdf(data: ReportData) {
  try {
    const html = buildReportHtml(data);
    await Print.printAsync({ html });
  } catch (err: any) {
    Alert.alert('Алдаа', err.message ?? 'Хэвлэхэд алдаа гарлаа');
  }
}

export async function emailPdf(data: ReportData) {
  try {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Имэйл боломжгүй', 'Энэ төхөөрөмж дээр имэйл тохируулагдаагүй байна.');
      return;
    }
    const uri = await generatePdf(data);
    await MailComposer.composeAsync({
      subject: `PineQuest Гүйцэтгэлийн Тайлан — ${data.label}`,
      body: 'Хавсаргасан файлд ажлын гүйцэтгэлийн тайлан байна.\n\nPineQuest',
      attachments: [uri],
    });
  } catch (err: any) {
    Alert.alert('Алдаа', err.message ?? 'Имэйл илгээхэд алдаа гарлаа');
  }
}

