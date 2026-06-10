'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, Circle, Clock, Flag, Pencil, Trash2 } from 'lucide-react';
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
  'Гэр бүл':     'bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
  'Хичээл':      'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  'Уулзалт':     'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400',
  'Хөгжүүлэлт': 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
};

const CATEGORIES = ['Ажил', 'Хувийн', 'Гэр бүл', 'Эрүүл мэнд', 'Хичээл', 'Уулзалт', 'Хөгжүүлэлт', 'Бусад'];

function formatDue(due: string) {
  const d = new Date(due);
  if (isNaN(d.getTime())) return due;
  return d.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' }) +
    (due.includes('T') ? ' ' + d.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' }) : '');
}

type EditField = 'priority' | 'due' | 'category' | null;

export default function TaskCard({ task, onToggle, onUpdate, onDelete }: {
  task: BackendTask;
  onToggle: (id: string, done: boolean) => void;
  onUpdate: (id: string, fields: Partial<Pick<BackendTask, 'priority' | 'due' | 'category'>> & { title?: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing]           = useState<EditField>(null);
  const [dueVal, setDueVal]             = useState(task.due?.slice(0, 16) || '');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal]         = useState(task.title);
  const titleRef                        = useRef<HTMLInputElement>(null);
  const done = task.status === 'done';

  function startTitleEdit() {
    setTitleVal(task.title);
    setEditingTitle(true);
    setTimeout(() => titleRef.current?.select(), 50);
  }
  function saveTitleEdit() {
    const trimmed = titleVal.trim();
    if (trimmed && trimmed !== task.title) onUpdate(task._id, { title: trimmed });
    setEditingTitle(false);
  }
  const priority = priorityConfig[task.priority] ?? priorityConfig.medium;
  const catClass = categoryColors[task.category] ?? 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400';

  function toggle(field: EditField) { setEditing(prev => prev === field ? null : field); }

  function saveDue() {
    onUpdate(task._id, { due: dueVal });
    setEditing(null);
  }

  return (
    <div className={`rounded-xl border p-4 flex gap-3 shadow-sm transition-colors ${
      done ? 'border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50'
           : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
    }`}>
      {/* Checkbox */}
      <button onClick={() => onToggle(task._id, !done)} className="shrink-0 mt-0.5">
        {done
          ? <CheckCircle2 size={20} className="text-green-500" />
          : <Circle size={20} className="text-gray-300 dark:text-slate-600 hover:text-indigo-400 transition-colors" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editingTitle ? (
          <input
            ref={titleRef}
            value={titleVal}
            onChange={e => setTitleVal(e.target.value)}
            onBlur={saveTitleEdit}
            onKeyDown={e => { if (e.key === 'Enter') saveTitleEdit(); if (e.key === 'Escape') setEditingTitle(false); }}
            className="w-full text-sm font-medium bg-transparent border-b border-indigo-400 outline-none text-gray-800 dark:text-slate-100 pb-0.5"
            autoFocus
          />
        ) : (
          <p className={`text-sm font-medium leading-snug ${done ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-800 dark:text-slate-100'}`}>
            {task.title}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-2">
          {/* Due — зөвхөн хийгдээгүй task-д */}
          {!done && (
            <button onClick={() => toggle('due')}
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
              <Clock size={11} />
              {task.due ? formatDue(task.due) : new Date().toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })}
            </button>
          )}

          {/* Priority */}
          <button onClick={() => toggle('priority')}
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity ${priority.className}`}>
            <Flag size={11} />{priority.label}
          </button>

          {/* Category */}
          <button onClick={() => toggle('category')}
            className={`text-xs px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity ${catClass}`}>
            {task.category || 'Бусад'}
          </button>
        </div>

        {/* Inline editors */}
        {editing === 'priority' && (
          <div className="flex gap-1.5 mt-2">
            {(['high', 'medium', 'low'] as const).map(p => (
              <button key={p} onClick={() => { onUpdate(task._id, { priority: p }); setEditing(null); }}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  task.priority === p
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                    : 'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-300'
                }`}>
                {priorityConfig[p].label}
              </button>
            ))}
          </div>
        )}

        {editing === 'due' && (
          <div className="flex items-center gap-2 mt-2">
            <input type="datetime-local" value={dueVal} onChange={e => setDueVal(e.target.value)}
              className="text-xs border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            <button onClick={saveDue} className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-lg hover:bg-indigo-700 transition-colors">Хадгалах</button>
            <button onClick={() => setEditing(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">Болих</button>
          </div>
        )}

        {editing === 'category' && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => { onUpdate(task._id, { category: c }); setEditing(null); }}
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

      {/* Edit + Delete */}
      <div className="flex flex-row gap-0.5 shrink-0 mt-0.5">
        <button onClick={startTitleEdit}
          className="p-1 rounded-lg text-gray-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(task._id)}
          className="p-1 rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
