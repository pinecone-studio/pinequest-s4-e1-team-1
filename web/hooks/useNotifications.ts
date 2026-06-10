'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchTasks, getFriendRequests } from '@/lib/api';

export type AppNotification =
  | { type: 'task'; id: string; title: string; minutesLeft: number; priority: 'high' | 'medium' | 'low' }
  | { type: 'friend_request'; id: string; title: string; requestId: string; fromUsername: string };

function getThreshold(priority: string) {
  return priority === 'high' ? 24 * 60 : 60;
}

export function formatTimeLeft(minutesLeft: number) {
  if (minutesLeft === 0) return 'Одоо дуусч байна!';
  if (minutesLeft >= 60) {
    const h = Math.round(minutesLeft / 60);
    return h >= 24 ? '1 өдрийн дараа' : `${h} цагийн дараа`;
  }
  return `${minutesLeft} минутын дараа`;
}

const STORAGE_KEY = 'dismissed-notifications';

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissed(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() =>
    typeof window !== 'undefined' ? loadDismissed() : new Set()
  );
  const browserNotified = useRef<Set<string>>(new Set());

  const check = useCallback(async () => {
    try {
      const [tasks, friendReqs] = await Promise.all([
        fetchTasks(),
        getFriendRequests().catch(() => []),
      ]);

      const now = new Date();

      const taskNotifs: AppNotification[] = tasks
        .filter(t => t.status !== 'done' && t.due?.includes('T'))
        .map(t => {
          const minutesLeft = Math.round((new Date(t.due).getTime() - now.getTime()) / 60000);
          return { type: 'task' as const, id: t._id, title: t.title, minutesLeft, priority: t.priority };
        })
        .filter(n => n.minutesLeft >= 0 && n.minutesLeft <= getThreshold(n.priority));

      const friendNotifs: AppNotification[] = friendReqs.map(r => ({
        type: 'friend_request' as const,
        id: `fr_${r.id}`,
        title: `@${r.username} найзын хүсэлт илгээлээ`,
        requestId: r.id,
        fromUsername: r.username,
      }));

      const all = [...taskNotifs, ...friendNotifs];

      all.forEach(n => {
        if (!browserNotified.current.has(n.id)) {
          browserNotified.current.add(n.id);
          if (typeof window !== 'undefined' && Notification.permission === 'granted') {
            const body = n.type === 'task' ? formatTimeLeft(n.minutesLeft) : 'Найзын хүсэлт';
            new Notification(n.type === 'task' ? `⏰ ${n.title}` : `👋 ${n.title}`, {
              body,
              icon: '/favicon.ico',
            });
          }
        }
      });

      setNotifications(all.filter(n => !dismissed.has(n.id)));
    } catch {
      // silent fail
    }
  }, [dismissed]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [check]);

  function dismiss(id: string) {
    setDismissed(prev => {
      const next = new Set([...prev, id]);
      saveDismissed(next);
      return next;
    });
  }

  function dismissAll() {
    setDismissed(prev => {
      const next = new Set([...prev, ...notifications.map(n => n.id)]);
      saveDismissed(next);
      return next;
    });
  }

  return { notifications, dismiss, dismissAll };
}
