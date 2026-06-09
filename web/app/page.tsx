'use client';

import { useEffect, useState } from 'react';
import { fetchTasks, fetchReport, updateTask, deleteTask, BackendTask } from '@/lib/api';
import { Plus, Flame, Target, Zap, Moon, Sunrise, Sun, Sunset, PartyPopper } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import StatsRow from '@/components/dashboard/StatsRow';
import TodaySection, { Task } from '@/components/dashboard/TodaySection';
import SidePanel, { UpcomingTask } from '@/components/dashboard/SidePanel';
import AddReminderModal from '@/components/dashboard/AddReminderModal';

const today = new Date().toISOString().slice(0, 10);

const WEEKDAYS_MN = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
const MONTHS_MN   = ['1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар','7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар'];

function formatDateMN(d: Date) {
  return `${WEEKDAYS_MN[d.getDay()]}, ${MONTHS_MN[d.getMonth()]}ын ${d.getDate()}`;
}

function getGreeting(): { text: string; Icon: LucideIcon; iconColor: string; from: string; via: string; to: string } {
  const h = new Date().getHours();
  if (h < 6)  return { text: 'Шөнийн мэнд',  Icon: Moon,    iconColor: '#a5b4fc', from: '#1e1b4b', via: '#312e81', to: '#1e1b4b' };
  if (h < 12) return { text: 'Өглөөний мэнд', Icon: Sunrise, iconColor: '#fcd34d', from: '#3730a3', via: '#4f46e5', to: '#6d28d9' };
  if (h < 17) return { text: 'Өдрийн мэнд',   Icon: Sun,     iconColor: '#fde68a', from: '#4338ca', via: '#5b21b6', to: '#6d28d9' };
  if (h < 21) return { text: 'Оройн мэнд',    Icon: Sunset,  iconColor: '#fda4af', from: '#4c1d95', via: '#5b21b6', to: '#3730a3' };
  return             { text: 'Шөнийн мэнд',  Icon: Moon,    iconColor: '#a5b4fc', from: '#1e1b4b', via: '#312e81', to: '#1e1b4b' };
}

function toFrontendTask(t: BackendTask): Task {
  return {
    id: t._id,
    title: t.title,
    description: null,
    due: t.due || '',
    time: t.due ? t.due.slice(11, 16) || t.due.slice(0, 10) : '—',
    priority: t.priority === 'high' ? 'High' : 'Medium',
    category: t.category || 'Ерөнхий',
    completed: t.status === 'done',
  };
}

function toUpcomingTask(t: BackendTask): UpcomingTask {
  const date = new Date(t.due);
  const label = isNaN(date.getTime())
    ? t.due
    : date.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return { id: t._id, title: t.title, datetime: label };
}

export default function HomePage() {
  const [raw, setRaw] = useState<BackendTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(true);

  function loadTasks() {
    fetchTasks()
      .then(setRaw)
      .catch(() => setError('Даалгаврыг татахад алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTasks();
    fetchReport(today)
      .then((r) => setInsight(r.summary ?? ''))
      .catch(() => setInsight(''))
      .finally(() => setInsightLoading(false));

    window.addEventListener('tasks-updated', loadTasks);
    return () => window.removeEventListener('tasks-updated', loadTasks);
  }, []);

  async function toggleTask(id: string, completed: boolean) {
    const updated = await updateTask(id, { status: completed ? 'done' : 'pending' });
    setRaw((prev) => prev.map((t) => (t._id === id ? updated : t)));
  }

  async function handleUpdate(id: string, fields: { priority?: 'high'|'medium'|'low'; due?: string; category?: string }) {
    const updated = await updateTask(id, fields);
    setRaw((prev) => prev.map((t) => (t._id === id ? updated : t)));
  }

  async function handleDelete(id: string) {
    await deleteTask(id);
    setRaw((prev) => prev.filter((t) => t._id !== id));
  }

  const todayTasks = raw.filter((t) => !t.due || t.due.startsWith(today)).map(toFrontendTask);
  const upcomingTasks: UpcomingTask[] = raw
    .filter((t) => t.due && t.due > today && t.status !== 'done')
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5)
    .map(toUpcomingTask);
  const statsData  = raw.map((t) => ({ completed: t.status === 'done' }));
  const focusTask  = raw.find((t) => t.status !== 'done' && t.priority === 'high') ?? raw.find((t) => t.status !== 'done');
  const doneCount  = raw.filter((t) => t.status === 'done').length;
  const allDone    = raw.length > 0 && doneCount === raw.length;
  const greeting   = getGreeting();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-gray-400 dark:text-slate-500 text-sm">Ачааллаж байна...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* ── Greeting banner ── */}
        <div className="relative rounded-2xl overflow-hidden p-6 text-white"
          style={{ background: `linear-gradient(135deg, ${greeting.from} 0%, ${greeting.via} 50%, ${greeting.to} 100%)` }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 15% 50%, white 0%, transparent 50%), radial-gradient(circle at 85% 10%, white 0%, transparent 40%)' }} />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <greeting.Icon size={26} style={{ color: greeting.iconColor }} />
                <span className="text-lg font-black tracking-tight">{greeting.text}!</span>
              </div>
              <p className="text-white/70 text-sm">{formatDateMN(new Date())}</p>
              {allDone && (
                <div className="mt-2 flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 w-fit">
                  <PartyPopper size={16} className="text-yellow-300 shrink-0" />
                  <span className="text-xs font-bold">Бүх даалгавар дууслаа!</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center bg-white/10 rounded-xl px-4 py-3">
                <div className="text-2xl font-black">{doneCount}</div>
                <div className="text-[10px] text-white/60 mt-0.5">Дуусгасан</div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all backdrop-blur-sm"
              >
                <Plus size={15} />
                Нэмэх
              </button>
            </div>
          </div>
        </div>

        {/* ── Focus task ── */}
        {focusTask && !allDone && (
          <div className="relative rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-white dark:bg-slate-800/80 p-4 flex items-center gap-4 overflow-hidden">
            <div className="absolute left-0 inset-y-0 w-1 bg-linear-to-b from-indigo-500 to-violet-500 rounded-l-2xl" />
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center shrink-0">
              {focusTask.priority === 'high' ? <Flame size={18} className="text-rose-500" /> : <Target size={18} className="text-indigo-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Zap size={10} /> Өнөөдрийн фокус
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{focusTask.title}</p>
            </div>
            {focusTask.priority === 'high' && (
              <span className="text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 px-2.5 py-1 rounded-full shrink-0">
                Өндөр
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <StatsRow tasks={statsData} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <TodaySection tasks={todayTasks} onToggle={toggleTask} onUpdate={handleUpdate} onDelete={handleDelete} />
          <SidePanel upcoming={upcomingTasks} insight={insight} insightLoading={insightLoading} completedToday={doneCount} />
        </div>
      </div>

      {showModal && (
        <AddReminderModal
          onClose={() => setShowModal(false)}
          onCreated={(task) => setRaw((prev) => [task, ...prev])}
        />
      )}
    </div>
  );
}
