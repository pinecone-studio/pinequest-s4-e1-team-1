'use client';
import { FileDown } from 'lucide-react';
import { ReportData } from '@/lib/api';
import { exportPdf } from '@/lib/reportPdf';

export default function PdfButton({ data }: { data: ReportData }) {
  return (
    <button
      onClick={() => exportPdf(data)}
      className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-bold px-3 py-1.5 rounded-lg"
    >
      <FileDown size={13} /> PDF
    </button>
  );
}
