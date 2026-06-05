import { CheckCircle2, Circle, Clock, Flag } from 'lucide-react';
import { BackendTask } from '@/lib/api';

const priorityConfig: Record<string, { label: string; className: string }> = {
  high:   { label: 'Өндөр', className: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' },
  medium: { label: 'Дунд',  className: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' },
  low:    { label: 'Бага',  className: 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400' },
};

const categoryColors: Record<string, string> = {
  'Ажил':        'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
  'Хувийн':      'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  'Эрүүл мэнд': 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
  'Уулзалт':     'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  'Хөгжүүлэлт': 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
  'Дизайн':      'bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
  'Судалгаа':    'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400',
};

function formatDue(due: string) {
  const d = new Date(due);
  if (isNaN(d.getTime())) return due;
  const datePart = d.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
  const timePart = due.includes('T') ? ' ' + d.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }) : '';
  return datePart + timePart;
}

export default function TaskCard({ task, onToggle }: { task: BackendTask; onToggle: (id: string, done: boolean) => void }) {
  const done         = task.status === 'done';
  const priority     = priorityConfig[task.priority] ?? priorityConfig.medium;
  const categoryClass = categoryColors[task.category] ?? 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400';

  return (
    <div className={`rounded-xl border p-4 flex gap-3 shadow-sm transition-colors ${
      done
        ? 'border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50'
        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
    }`}>
      <button onClick={() => onToggle(task._id, !done)} className="shrink-0 mt-0.5">
        {done ? (
          <CheckCircle2 size={20} className="text-green-500" />
        ) : (
          <Circle size={20} className="text-gray-300 dark:text-slate-600 hover:text-indigo-400 transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${
          done ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-800 dark:text-slate-100'
        }`}>
          {task.title}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {task.due && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
              <Clock size={11} />{formatDue(task.due)}
            </span>
          )}
          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${priority.className}`}>
            <Flag size={11} />{priority.label}
          </span>
          {task.category && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${categoryClass}`}>{task.category}</span>
          )}
        </div>
      </div>
    </div>
  );
}
