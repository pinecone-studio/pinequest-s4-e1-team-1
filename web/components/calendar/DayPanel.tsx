'use client';

import { useState } from 'react';
import { Clock, Flag, Share2, Loader2, CheckCircle2 } from 'lucide-react';
import { BackendTask, Friend, getFriends, shareTask } from '@/lib/api';

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

  const [showFriendList, setShowFriendList] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [sharedTo, setSharedTo] = useState('');

  async function handleShareClick() {
    if (showFriendList) { setShowFriendList(false); return; }
    setShowFriendList(true);
    setSharedTo('');
    setLoadingFriends(true);
    try {
      setFriends(await getFriends());
    } finally {
      setLoadingFriends(false);
    }
  }

  async function handleShare(friend: Friend) {
    setSharing(true);
    try {
      await Promise.all(dayTasks.map(t => shareTask(t._id, friend.uid)));
      setSharedTo(friend.username);
      setShowFriendList(false);
    } catch {
      // silent — toast will catch
    } finally {
      setSharing(false);
    }
  }

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
        <>
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

          <div className="border-t border-gray-100 dark:border-slate-700 pt-3 flex flex-col gap-2">
            {sharedTo ? (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 size={15} />
                <span>{sharedTo}-д илгээлээ ✓</span>
              </div>
            ) : (
              <button
                onClick={handleShareClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
              >
                <Share2 size={14} />
                Найздаа илгээх ({dayTasks.length})
              </button>
            )}

            {showFriendList && (
              <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                {loadingFriends ? (
                  <div className="flex justify-center py-4">
                    <Loader2 size={18} className="animate-spin text-indigo-400" />
                  </div>
                ) : friends.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 dark:text-slate-500 py-3">Найз байхгүй байна</p>
                ) : (
                  friends.map(f => (
                    <button
                      key={f.uid}
                      onClick={() => handleShare(f)}
                      disabled={sharing}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300 shrink-0">
                        {f.username[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{f.username}</span>
                      {sharing && <Loader2 size={14} className="animate-spin text-indigo-400 ml-auto" />}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
