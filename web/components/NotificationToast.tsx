'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { getNotifications, markNotificationsRead, AppNotification } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function NotificationToast() {
  const { user } = useAuth();
  const seenIds = useRef<Set<string>>(new Set());
  const [toasts, setToasts] = useState<(AppNotification & { key: number })[]>([]);
  const keyRef = useRef(0);

  useEffect(() => {
    if (!user) return;

    async function poll() {
      try {
        const notes = await getNotifications();
        const unseen = notes.filter(n => !seenIds.current.has(n._id));
        if (unseen.length === 0) return;
        unseen.forEach(n => seenIds.current.add(n._id));
        setToasts(prev => [
          ...prev,
          ...unseen.map(n => ({ ...n, key: ++keyRef.current })),
        ]);
        await markNotificationsRead().catch(() => {});
      } catch {
        // silent
      }
    }

    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, [user]);

  function dismiss(key: number) {
    setToasts(prev => prev.filter(t => t.key !== key));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.key} className="flex items-start gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 shadow-lg animate-slide-up">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-sm">{t.type === 'friend_request' ? '👋' : '📋'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {t.type === 'friend_request' ? 'Найзын хүсэлт' : 'Шинэ ажил ирлээ'}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {t.type === 'friend_request'
                ? `${t.fromUsername} найзын хүсэлт илгээлээ`
                : `${t.fromUsername}: "${t.taskTitle}"`}
            </p>
          </div>
          <button onClick={() => dismiss(t.key)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors shrink-0">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
