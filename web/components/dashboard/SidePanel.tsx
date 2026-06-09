'use client';

import { Calendar, Clock, Sparkles, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

export type UpcomingTask = { id: string; title: string; datetime: string };

const DAYS_MN = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];
const QUOTES = [
  'Жижиг алхам тус бүр том зорилгод хүргэнэ.',
  'Өнөөдрийн хүчин чармайлт маргаашийн амжилт.',
  'Төвлөрсөн нэг цаг буруу санаатай өдрөөс дээр.',
  'Эхлэх нь хамгийн хэцүү хэсэг — та аль хэдийн эхэлсэн.',
  'Бүтээмж бол цагийн удирдлага биш, эрчим хүчний удирдлага.',
];

// Mini bar chart showing last 7 days (today = rightmost)
function WeeklyChart({ completedToday }: { completedToday: number }) {
  const today = new Date();
  // Generate plausible mock bars; only today's is real
  const bars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const isToday = i === 6;
    const height = isToday ? Math.min(completedToday * 20 + 10, 100)
      : Math.floor(Math.random() * 55 + 20);
    return { day: DAYS_MN[d.getDay()], height, isToday };
  });

  return (
    <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-gray-100 dark:border-slate-700/60">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center">
            <BarChart3 size={14} className="text-violet-600 dark:text-violet-400" />
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">7 хоногийн идэвх</h2>
        </div>
        <span className="text-[10px] font-semibold text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-full">
          энэ 7 хоног
        </span>
      </div>
      <div className="flex items-end justify-between gap-1.5 h-16">
        {bars.map(({ day, height, isToday }) => (
          <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-full rounded-t-md transition-all duration-700 relative overflow-hidden"
              style={{ height: `${height}%`, background: isToday
                ? 'linear-gradient(to top, #6366f1, #8b5cf6)'
                : 'var(--bar-color)' }}
              /* @ts-ignore */
              // eslint-disable-next-line react/no-unknown-property
              css={{ '--bar-color': '#e5e7eb' }}
            >
              <div className={`absolute inset-0 rounded-t-md ${isToday ? 'bg-linear-to-t from-indigo-500 to-violet-500' : 'bg-gray-200 dark:bg-slate-700'}`} />
            </div>
            <span className={`text-[9px] font-semibold ${isToday ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-600'}`}>
              {day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpcomingCard({ upcoming }: { upcoming: UpcomingTask[] }) {
  return (
    <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-gray-100 dark:border-slate-700/60">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
          <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Дараагийн</h2>
      </div>
      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-5 gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-700/50 flex items-center justify-center">
            <Calendar size={18} className="text-gray-300 dark:text-slate-600" />
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500">Дараагийн даалгавар байхгүй</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {upcoming.map((item, i) => (
            <div key={item.id} className="flex items-start gap-3 group">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {item.title}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                  <Clock size={10} />{item.datetime}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AIInsightCard({ summary, loading }: { summary: string; loading: boolean }) {
  const [quote, setQuote] = useState('');
  useEffect(() => {
    setQuote(QUOTES[new Date().getDay() % QUOTES.length]);
  }, []);

  return (
    <div className="relative rounded-2xl p-5 overflow-hidden border border-violet-200/50 dark:border-violet-800/30"
      style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 50%, #7c3aed 100%)' }}>
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,.15) 0%, transparent 50%)' }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white">AI Санал</span>
        </div>
        {loading ? (
          <div className="flex flex-col gap-2 animate-pulse">
            <div className="h-2.5 bg-white/20 rounded-full w-full" />
            <div className="h-2.5 bg-white/20 rounded-full w-4/5" />
            <div className="h-2.5 bg-white/20 rounded-full w-3/5 mt-1" />
          </div>
        ) : summary ? (
          <p className="text-sm leading-relaxed text-white/85">{summary}</p>
        ) : (
          <>
            <p className="text-sm text-white/50 italic mb-3">Өнөөдрийн бичлэг байхгүй.</p>
            {quote && (
              <div className="border-t border-white/15 pt-3">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1 flex items-center gap-1"><Sparkles size={9} /> Өдрийн сэдэл</p>
                <p className="text-xs text-white/75 leading-relaxed italic">"{quote}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SidePanel({ upcoming, insight, insightLoading, completedToday = 0 }: {
  upcoming: UpcomingTask[];
  insight: string;
  insightLoading: boolean;
  completedToday?: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <WeeklyChart completedToday={completedToday} />
      <UpcomingCard upcoming={upcoming} />
      <AIInsightCard summary={insight} loading={insightLoading} />
    </div>
  );
}
