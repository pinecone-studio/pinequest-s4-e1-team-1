'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchTasks } from '@/lib/api';

export type AppNotification = {
  id: string;
  title: string;
  minutesLeft: number;
  priority: 'high' | 'medium' | 'low';
};

function getThreshold(priority: string) {
  return priority === 'high' ? 24 * 60 : 60; // high=1 өдөр, бусад=1 цаг (минутаар)
}

function formatTimeLeft(minutesLeft: number) {
  if (minutesLeft === 0) return 'Одоо дуусч байна!';
  if (minutesLeft >= 60) {
    const h = Math.round(minutesLeft / 60);
    return h >= 24 ? '1 өдрийн дараа' : `${h} цагийн дараа`;
  }
  return `${minutesLeft} минутын дараа`;
}

export { formatTimeLeft };

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissed, setDismissed]         = useState<Set<string>>(new Set());
  const browserNotified                   = useRef<Set<string>>(new Set());

  const check = useCallback(async () => {
    try {
      const tasks = await fetchTasks();
      const now   = new Date();

      const upcoming: AppNotification[] = tasks
        .filter((t) => t.status !== 'done' && t.due?.includes('T'))
        .map((t) => {
          const minutesLeft = Math.round((new Date(t.due).getTime() - now.getTime()) / 60000);
          return { id: t._id, title: t.title, minutesLeft, priority: t.priority };
        })
        .filter((n) => n.minutesLeft >= 0 && n.minutesLeft <= getThreshold(n.priority));

      upcoming.forEach((n) => {
        if (!browserNotified.current.has(n.id)) {
          browserNotified.current.add(n.id);
          if (typeof window !== 'undefined' && Notification.permission === 'granted') {
            new Notification(`⏰ ${n.title}`, {
              body: formatTimeLeft(n.minutesLeft),
              icon: '/favicon.ico',
            });
          }
        }
      });

      setNotifications(upcoming.filter((n) => !dismissed.has(n.id)));
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
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [check]);

  function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  function dismissAll() {
    setDismissed((prev) => new Set([...prev, ...notifications.map((n) => n.id)]));
  }

  return { notifications, dismiss, dismissAll };
}
