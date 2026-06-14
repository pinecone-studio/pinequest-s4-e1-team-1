'use client';

import { useRef, useState } from 'react';
import { Trophy, Flame, Zap, TrendingUp, Share2 } from 'lucide-react';
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

function motivationalText(pct: number): string {
  if (pct >= 100) return 'Өнөөдрийн бүх зорилгоо биелүүллээ. Гайхалтай!';
  if (pct >= 80)  return 'Маш өндөр гүйцэтгэлтэй өдөр боллоо. Үргэлжлүүл!';
  if (pct >= 60)  return 'Хагасаас илүүг дийлсэн. Зохион байгуулалт шилдэг!';
  if (pct >= 40)  return 'Алхам тутмаар зорилгодоо ойртож байна. Зөв зам!';
  if (pct > 0)    return 'Эхлэл тавив. Жижиг алхмаас том зам эхэлдэг!';
  return 'Өнөөдрөөс тэмдэглэл хөтлөж эхэллээ.';
}

function PctIcon({ pct, size = 18 }: { pct: number; size?: number }) {
  if (pct >= 100) return <Trophy size={size} className="text-yellow-500" />;
  if (pct >= 75)  return <Flame size={size} className="text-orange-500" />;
  if (pct >= 50)  return <Zap size={size} className="text-indigo-500" />;
  return <TrendingUp size={size} className="text-indigo-400" />;
}

export default function GeneralCard(p: ReportData) {
  const [storyOpen, setStoryOpen] = useState(false);
  const [sharing, setSharing]     = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);

  const raw   = p as unknown as Record<string, string>;
  const end   = p.endDate   || raw.date || '';
  const start = p.startDate || end;
  const range = !p.period || p.period === 'day' ? (end ? fmt(end) : '—') : `${fmt(start)} – ${fmt(end)}`;
  const pct   = p.taskCount > 0 ? Math.round((p.completedTaskCount / p.taskCount) * 100) : 0;

  const stats = [
    { label: 'Бүртгэл',    value: p.entryCount          ?? 0, color: '#6C47FF' },
    { label: 'Даалгавар',  value: p.taskCount            ?? 0, color: '#0891b2' },
    { label: 'Гүйцэтгэл', value: p.completedTaskCount   ?? 0, color: '#16a34a' },
    { label: 'Үлдсэн',    value: p.pendingTaskCount     ?? 0, color: '#d97706' },
  ];

  async function handleShare() {
    setSharing(true);
    const text = [
      `📊 MonTask тайлан`,
      range,
      ``,
      `Гүйцэтгэл: ${pct}%`,
      `${p.completedTaskCount}/${p.taskCount} даалгавар`,
      ``,
      motivationalText(pct),
      p.summary ? `\nAI дүгнэлт: ${p.summary}` : '',
    ].join('\n');
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'MonTask тайлан', text });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Хуулагдлаа!');
      }
    } catch { /* dismissed */ }
    finally { setSharing(false); }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm text-gray-400 dark:text-slate-500 font-medium">{range}</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col items-center">
            <span className="text-3xl font-extrabold" style={{ color }}>{value}</span>
            <span className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Achievement section — matches app's AchievementSection */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <PctIcon pct={pct} size={18} />
          <span className="text-sm font-bold text-gray-900 dark:text-white">Амжилтын үзүүлэлт</span>
        </div>
        <p className="text-5xl font-black text-violet-600 dark:text-violet-400 leading-none tracking-tight mb-3">
          {pct}%
        </p>
        <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(pct, 100)}%`, background: 'linear-gradient(90deg,#7c3aed,#db2777)' }}
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
          {p.taskCount > 0
            ? `${p.completedTaskCount} / ${p.taskCount} даалгавар гүйцэтгэсэн`
            : 'Даалгавар байхгүй'}
        </p>
      </div>

      {/* AI summary */}
      <div className="relative rounded-2xl p-6 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#5B3FE0,#8B5CF6)' }}>
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/7" />
        <div className="absolute right-10 -bottom-10 w-24 h-24 rounded-full bg-white/5" />
        <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-3 relative">
          {PERIOD_LABEL[p.period] ?? 'Дүгнэлт'}
        </p>
        <p className="text-sm text-white leading-relaxed font-medium relative z-10">
          {p.summary || 'Дүгнэлт байхгүй байна.'}
        </p>
      </div>

      {/* Story button — Instagram icon, matches app */}
      <button
        onClick={() => setStoryOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white text-sm overflow-hidden"
        style={{ background: 'linear-gradient(90deg,#7c3aed,#db2777)' }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
        </svg>
        Story хуваалцах
      </button>

      {/* Story modal — matches app's story card */}
      {storyOpen && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex flex-col items-center justify-center gap-5 p-4"
          onClick={() => setStoryOpen(false)}
        >
          {/* Story card */}
          <div
            ref={storyRef}
            className="relative rounded-3xl overflow-hidden flex flex-col justify-between p-7"
            style={{ width: 320, height: 512, background: 'linear-gradient(160deg,#0f0a1e,#1a0b2e,#2d1b4e)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute w-56 h-56 rounded-full top-[-60px] right-[-60px]"
              style={{ background: 'rgba(124,58,237,0.25)' }} />
            <div className="absolute w-44 h-44 rounded-full bottom-10 left-[-50px]"
              style={{ background: 'rgba(219,39,119,0.2)' }} />

            {/* Top */}
            <div className="relative flex items-center justify-between">
              <span className="text-xl font-black text-white tracking-tight">MonTask</span>
              <span className="text-xs text-white/50 font-medium">{fmt(end)}</span>
            </div>

            {/* Center: pct */}
            <div className="relative">
              <p className="text-xs font-bold text-white/45 uppercase tracking-widest mb-1">ГҮЙЦЭТГЭЛ</p>
              <p className="text-8xl font-black text-white leading-none tracking-tighter">
                {pct}<span className="text-4xl">%</span>
              </p>
              <div className="w-full h-1.5 rounded-full mt-3 mb-2 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.12)' }}>
                <div className="h-full rounded-full"
                  style={{ width: `${Math.min(pct, 100)}%`, background: 'linear-gradient(90deg,#a78bfa,#db2777)' }} />
              </div>
              <p className="text-xs text-white/55 font-medium">{p.completedTaskCount} / {p.taskCount} даалгавар</p>
            </div>

            {/* Stats row */}
            <div className="relative flex items-center rounded-2xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              {[
                { label: 'Бүртгэл',    val: p.entryCount },
                { label: 'Гүйцэтгэл', val: p.completedTaskCount },
                { label: 'Үлдсэн',    val: p.pendingTaskCount },
              ].map(({ label, val }, i, arr) => (
                <div key={label} className="flex-1 flex flex-col items-center">
                  <span className="text-2xl font-extrabold text-white">{val}</span>
                  <span className="text-[10px] text-white/50 mt-0.5">{label}</span>
                  {i < arr.length - 1 && (
                    <div className="absolute h-8 w-px my-auto top-0 bottom-0"
                      style={{ right: `${(i + 1) * 33.3}%`, background: 'rgba(255,255,255,0.12)' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="relative rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <p className="text-sm text-white/70 leading-relaxed">{motivationalText(pct)}</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 w-80" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleShare}
              disabled={sharing}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-sm bg-violet-600 hover:bg-violet-700 transition-colors"
            >
              <Share2 size={16} /> {sharing ? '...' : 'Хуваалцах'}
            </button>
            <button
              onClick={() => setStoryOpen(false)}
              className="px-6 py-3.5 rounded-2xl font-semibold text-white text-sm"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              Хаах
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
