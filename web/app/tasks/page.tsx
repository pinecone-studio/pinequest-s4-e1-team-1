'use client';

import { useEffect, useState } from 'react';
import { fetchTasks } from '@/lib/api';

type Task = {
  _id: string;
  title: string;
  due: string;
  status: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Хүлээгдэж байна',
  done: 'Дууссан',
  in_progress: 'Хийгдэж байна',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : 'Даалгавар татахад алдаа гарлаа.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Даалгаврууд</h1>

      {loading && (
        <div className="flex justify-center py-16">
          <svg
            className="w-8 h-8 text-indigo-500 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p>Даалгавар байхгүй байна</p>
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <ul className="flex flex-col gap-3">
          {tasks.map((task) => (
            <li
              key={task._id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-medium text-sm leading-snug">
                  {task.title}
                </p>
                {task.due && (
                  <p className="text-xs text-gray-400 mt-1">{task.due}</p>
                )}
              </div>
              <span
                className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${
                  STATUS_COLOR[task.status] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {STATUS_LABEL[task.status] ?? task.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
