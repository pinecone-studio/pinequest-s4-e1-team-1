import { ReportData } from '@/lib/api';

const PERIOD_LABEL: Record<string, string> = {
  day: 'Өнөөдрийн дүгнэлт',
  week: '7 хоногийн дүгнэлт',
  month: 'Сарын дүгнэлт',
};

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function GeneralCard(p: ReportData) {
  const raw   = p as unknown as Record<string, string>;
  const end   = p.endDate   || raw.date || '';
  const start = p.startDate || end;
  const range = !p.period || p.period === 'day' ? (end ? fmt(end) : '—') : `${fmt(start)} – ${fmt(end)}`;

  const stats = [
    { label: 'Бүртгэл',    value: p.entryCount          ?? 0, color: 'text-indigo-600' },
    { label: 'Даалгавар',  value: p.taskCount            ?? 0, color: 'text-cyan-600'   },
    { label: 'Гүйцэтгэл', value: p.completedTaskCount   ?? 0, color: 'text-green-600'  },
    { label: 'Үлдсэн',    value: p.pendingTaskCount     ?? 0, color: 'text-amber-600'  },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm text-gray-400 dark:text-slate-500 font-medium">{range}</p>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col items-center">
            <span className={`text-3xl font-extrabold ${color}`}>{value}</span>
            <span className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium">{label}</span>
          </div>
        ))}
      </div>

      <div className="relative bg-gradient-to-br from-[#5B3FE0] to-[#8B5CF6] rounded-2xl p-6 overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/[0.07]" />
        <div className="absolute right-10 -bottom-10 w-24 h-24 rounded-full bg-white/[0.05]" />
        <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-3">
          {PERIOD_LABEL[p.period] ?? 'Дүгнэлт'}
        </p>
        <p className="text-sm text-white leading-relaxed font-medium relative z-10">
          {p.summary || 'Дүгнэлт байхгүй байна.'}
        </p>
      </div>
    </div>
  );
}
