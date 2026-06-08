import { FileText, BarChart2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ReportData } from '@/lib/api';
import PdfButton from './PdfButton';

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function KpiRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{label}</p>
        <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
      <span className="text-base font-extrabold min-w-[28px] text-right" style={{ color }}>{value}</span>
    </div>
  );
}

function Section({ icon: Icon, title, text, accent }: { icon: typeof FileText; title: string; text?: string; accent: string }) {
  if (!text) return null;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border-l-4" style={{ borderLeftColor: accent }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color: accent }} />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>{title}</span>
      </div>
      <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{text}</p>
    </div>
  );
}

export default function WorkCard(p: ReportData) {
  const raw   = p as unknown as Record<string, string>;
  const end   = p.endDate   || raw.date || '';
  const start = p.startDate || end;
  const range = !p.period || p.period === 'day' ? (end ? fmt(end) : '—') : `${fmt(start)} – ${fmt(end)}`;
  const total = (p.completedTaskCount ?? 0) + (p.pendingTaskCount ?? 0);
  const pct   = total > 0 ? Math.round((p.completedTaskCount / total) * 100) : 0;

  const kpis = [
    { label: 'Нийт',      val: total,               color: '#6C47FF' },
    { label: 'Гүйцэтгэл', val: p.completedTaskCount, color: '#16a34a' },
    { label: 'Үлдсэн',   val: p.pendingTaskCount,   color: '#d97706' },
    { label: 'Бүртгэл',  val: p.entryCount,          color: '#0891b2' },
  ];

  if (!total && !p.executiveSummary) {
    return <p className="text-center text-sm text-gray-400 dark:text-slate-500 py-8">Ажлын даалгавар олдсонгүй.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-[#5B3FE0] to-[#8B5CF6] rounded-2xl p-6 overflow-hidden">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/[0.07]" />
        <div className="absolute -left-5 -bottom-8 w-28 h-28 rounded-full bg-white/[0.05]" />
        <div className="flex items-center justify-between relative z-10 mb-1">
          <p className="text-xs font-extrabold text-white/80 uppercase tracking-widest">ГҮЙЦЭТГЭЛИЙН ТАЙЛАН</p>
          <PdfButton data={p} />
        </div>
        <p className="text-xs text-white/50 mb-4 relative z-10">{range}</p>
        <div className="flex items-baseline gap-2 mb-3 relative z-10">
          <span className="text-5xl font-black text-white">{pct}%</span>
          <span className="text-sm text-white/60 font-medium">нийт гүйцэтгэл</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden relative z-10">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* KPI grid */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
        <p className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wide mb-4">Гол үзүүлэлтүүд (KPI)</p>
        <div className="grid grid-cols-4 gap-2">
          {kpis.map(({ label, val, color }) => (
            <div key={label} className="flex flex-col items-center bg-gray-50 dark:bg-slate-700/50 rounded-xl py-3">
              <span className="text-xl font-extrabold" style={{ color }}>{val}</span>
              <span className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Priority breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col gap-3">
        <p className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wide">Ач холбогдлоор</p>
        <KpiRow label="Өндөр" value={p.highCount   ?? 0} total={total} color="#ef4444" />
        <KpiRow label="Дунд"  value={p.mediumCount ?? 0} total={total} color="#f59e0b" />
        <KpiRow label="Бага"  value={p.lowCount    ?? 0} total={total} color="#6b7280" />
      </div>

      <Section icon={FileText}      title="Товч дүгнэлт" text={p.executiveSummary} accent="#6C47FF" />
      <Section icon={BarChart2}     title="Шинжилгээ"    text={p.insights}         accent="#0891b2" />
      <Section icon={AlertTriangle} title="Эрсдэл"       text={p.risks}            accent="#ef4444" />
      <Section icon={CheckCircle2}  title="Зөвлөмж"      text={p.recommendations}  accent="#16a34a" />

      <p className="text-center text-xs text-gray-300 dark:text-slate-600 py-2">
        PineQuest · Автомат тайлан · {fmt(p.endDate)}
      </p>
    </div>
  );
}
