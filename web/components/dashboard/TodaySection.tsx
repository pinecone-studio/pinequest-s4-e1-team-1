'use client';

import { useState } from "react";
import { CheckCircle2, Circle, Clock, Flag, Trash2 } from "lucide-react";

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  time: string;
  due: string;
  priority: "High" | "Medium";
  category: string;
  completed: boolean;
};

type UpdateFields = { priority?: 'high' | 'medium' | 'low'; due?: string; category?: string };
type EditField = 'priority' | 'due' | 'category' | null;

const priorityStyles: Record<Task["priority"], string> = {
  High:   "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  Medium: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400",
};
const priorityLabels: Record<Task["priority"], string> = { High: "Өндөр", Medium: "Дунд" };

const CATEGORIES = ['Ажил', 'Хувийн', 'Гэр бүл', 'Эрүүл мэнд', 'Хичээл', 'Уулзалт', 'Хөгжүүлэлт', 'Бусад'];

function TaskCard({ task, onToggle, onUpdate, onDelete }: {
  task: Task;
  onToggle?: (id: string, completed: boolean) => void;
  onUpdate?: (id: string, fields: UpdateFields) => void;
  onDelete?: (id: string) => void;
}) {
  const [editing, setEditing] = useState<EditField>(null);
  const [dueVal, setDueVal]   = useState(task.due?.slice(0, 16) || '');

  function toggle(f: EditField) { setEditing(prev => prev === f ? null : f); }

  return (
    <div className={`flex gap-3 p-4 rounded-xl border transition-colors ${
      task.completed
        ? "border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50"
        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
    }`}>
      <button onClick={() => onToggle?.(task.id, !task.completed)} className="shrink-0 mt-0.5 cursor-pointer">
        {task.completed
          ? <CheckCircle2 size={20} className="text-green-500" />
          : <Circle size={20} className="text-gray-300 dark:text-slate-600 hover:text-indigo-400 transition-colors" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.completed ? "line-through text-gray-400 dark:text-slate-500" : "text-gray-800 dark:text-slate-100"}`}>
          {task.title}
        </p>
        {task.description && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{task.description}</p>}

        <div className="flex flex-wrap gap-2 mt-2">
          {/* Time */}
          <button onClick={() => toggle('due')}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
            <Clock size={11} />{task.time || new Date().toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })}
          </button>

          {/* Priority */}
          <button onClick={() => toggle('priority')}
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity ${priorityStyles[task.priority]}`}>
            <Flag size={11} />{priorityLabels[task.priority]}
          </button>

          {/* Category */}
          <button onClick={() => toggle('category')}
            className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity">
            {task.category || 'Бусад'}
          </button>
        </div>

        {/* Priority editor */}
        {editing === 'priority' && (
          <div className="flex gap-1.5 mt-2">
            {([['high','Өндөр'], ['medium','Дунд'], ['low','Бага']] as const).map(([val, lbl]) => (
              <button key={val} onClick={() => { onUpdate?.(task.id, { priority: val }); setEditing(null); }}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  (val === 'high' && task.priority === 'High') || (val === 'medium' && task.priority === 'Medium')
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                    : 'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-300'
                }`}>
                {lbl}
              </button>
            ))}
          </div>
        )}

        {/* Due editor */}
        {editing === 'due' && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <input type="datetime-local" value={dueVal} onChange={e => setDueVal(e.target.value)}
              className="text-xs border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            <button onClick={() => { onUpdate?.(task.id, { due: dueVal }); setEditing(null); }}
              className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-lg hover:bg-indigo-700 transition-colors">Хадгалах</button>
            <button onClick={() => setEditing(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">Болих</button>
          </div>
        )}

        {/* Category editor */}
        {editing === 'category' && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => { onUpdate?.(task.id, { category: c }); setEditing(null); }}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  task.category === c
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                    : 'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-300'
                }`}>
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete */}
      <button onClick={() => onDelete?.(task.id)}
        className="shrink-0 mt-0.5 p-1 rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export default function TodaySection({ tasks, onToggle, onUpdate, onDelete }: {
  tasks: Task[];
  onToggle?: (id: string, completed: boolean) => void;
  onUpdate?: (id: string, fields: UpdateFields) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-transparent dark:border-slate-700">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-gray-900 dark:text-white text-lg">Өнөөдөр</h2>
        <span className="text-xs font-medium bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full">
          {tasks.length} төлөвлөгдсөн
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
