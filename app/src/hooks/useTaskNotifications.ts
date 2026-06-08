import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { fetchTasks } from '../api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getThresholdMinutes(priority: string): number {
  return priority === 'high' ? 24 * 60 : 60;
}

function formatTimeLeft(minutesLeft: number): string {
  if (minutesLeft === 0) return 'Одоо дуусч байна!';
  if (minutesLeft >= 60) {
    const h = Math.round(minutesLeft / 60);
    return h >= 24 ? '1 өдрийн дараа' : `${h} цагийн дараа`;
  }
  return `${minutesLeft} минутын дараа`;
}

export function useTaskNotifications() {
  const notified = useRef<Set<string>>(new Set());

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  useEffect(() => {
    async function check() {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return;

      try {
        const tasks = await fetchTasks();
        const now = new Date();

        tasks
          .filter((t) => t.status !== 'done' && t.due)
          .forEach((t) => {
            const dueDate = new Date(t.due);
            if (isNaN(dueDate.getTime())) return;
            const minutesLeft = Math.round(
              (dueDate.getTime() - now.getTime()) / 60000
            );
            if (
              minutesLeft >= 0 &&
              minutesLeft <= getThresholdMinutes(t.priority) &&
              !notified.current.has(t._id)
            ) {
              notified.current.add(t._id);
              Notifications.scheduleNotificationAsync({
                content: {
                  title: `⏰ ${t.title}`,
                  body: formatTimeLeft(minutesLeft),
                },
                trigger: null,
              });
            }
          });
      } catch {
        // silent fail
      }
    }

    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);
}
