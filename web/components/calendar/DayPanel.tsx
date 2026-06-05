import { Clock, Flag } from 'lucide-react';
import { BackendTask } from '@/lib/api';

const MN_WEEKDAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];

const PRIORITY_LABEL: Record<string, string> = { high: 'Өндөр', medium: 'Дунд', low: 'Бага' };

const PRIORITY_BADGE: Record<string, string> = {
  high:   'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  medium: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  low:    'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
};

const CATEGORY_BADGE: Record<string, string> = {
  'Ажил':        'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
  'Хувийн':      'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  'Эрүүл мэнд': 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
  'Уулзалт':     'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  'Хөгжүүлэлт': 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
  'Дизайн':      'bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
};

function formatHeading(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${MN_WEEKDAYS[date.getDay()]}, ${m}-р сарын ${d}`;
}

function formatTime(due: string) {
  if (!due.includes('T')) return null;
  return due.slice(11, 16);
}

export default function DayPanel({ tasks, date }: { tasks: BackendTask[]; date: string }) {
  const dayTasks = tasks.filter((t) => t.due?.slice(0, 10) === date);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 flex flex-col gap-5">
      <div>
        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Сонгогдсон</p>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{formatHeading(date)}</h2>
      </div>

      {dayTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
            <Clock size={20} className="text-gray-300 dark:text-slate-600" />
          </div>
          <p className="text-sm text-gray-400 dark:text-slate-500">Энэ өдөр даалгавар байхгүй</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {dayTasks.map((task) => {
            const time     = formatTime(task.due);
            const badge    = PRIORITY_BADGE[task.priority] ?? 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400';
            const catClass = CATEGORY_BADGE[task.category] ?? 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400';
            return (
              <div key={task._id} className="flex flex-col gap-2 p-3 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium leading-snug ${
                    task.status === 'done' ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-800 dark:text-slate-100'
                  }`}>{task.title}</p>
                  {time && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 shrink-0">
                      <Clock size={11} />{time}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${badge}`}>
                    <Flag size={10} />{PRIORITY_LABEL[task.priority] ?? task.priority}
                  </span>
                  {task.category && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${catClass}`}>{task.category}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
