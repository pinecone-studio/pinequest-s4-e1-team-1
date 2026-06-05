'use client';

import { useEffect, useState } from 'react';
import { fetchTasks, fetchReport, updateTask, deleteTask, BackendTask } from '@/lib/api';
import { Plus } from 'lucide-react';
import StatsRow from '@/components/dashboard/StatsRow';
import TodaySection, { Task } from '@/components/dashboard/TodaySection';
import SidePanel, { UpcomingTask } from '@/components/dashboard/SidePanel';
import AddReminderModal from '@/components/dashboard/AddReminderModal';

const today = new Date().toISOString().slice(0, 10);

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
  const statsData = raw.map((t) => ({ completed: t.status === 'done' }));

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Хяналтын самбар</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Өнөөдрийн даалгаврын тойм</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} />
            Сануулагч нэмэх
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <StatsRow tasks={statsData} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <TodaySection tasks={todayTasks} onToggle={toggleTask} onUpdate={handleUpdate} onDelete={handleDelete} />
          <SidePanel upcoming={upcomingTasks} insight={insight} insightLoading={insightLoading} />
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
