'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchTasks, BackendTask } from '@/lib/api';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import DayPanel from '@/components/calendar/DayPanel';

const MN_MONTHS = [
  '1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар',
  '7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар',
];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const now = new Date();
  const [tasks, setTasks]               = useState<BackendTask[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedDate, setSelectedDate] = useState(toISO(now));
  const [year, setYear]                 = useState(now.getFullYear());
  const [month, setMonth]               = useState(now.getMonth());

  useEffect(() => {
    fetchTasks().then(setTasks).finally(() => setLoading(false));
  }, []);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Календарь</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Бүх даалгаврыг нэг дороос харах.</p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full px-4 py-2 shadow-sm">
            <button onClick={prevMonth} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 transition-colors p-0.5">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-gray-800 dark:text-slate-100 min-w-[110px] text-center">
              {MN_MONTHS[month]} {year}
            </span>
            <button onClick={nextMonth} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 transition-colors p-0.5">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 h-96 animate-pulse" />
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 h-96 animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            <CalendarGrid tasks={tasks} selectedDate={selectedDate} year={year} month={month} onSelectDate={setSelectedDate} />
            <DayPanel tasks={tasks} date={selectedDate} />
          </div>
        )}

      </div>
    </div>
  );
}
