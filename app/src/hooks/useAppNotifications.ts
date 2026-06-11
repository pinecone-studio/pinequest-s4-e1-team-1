import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { savePushToken, getNotifications, markNotificationsRead } from '../api';
import { auth } from '../firebase';

export function useAppNotifications() {
  const seenIds = useRef<Set<string>>(new Set());

  // Register push token once user is logged in
  useEffect(() => {
    async function register() {
      if (!auth.currentUser) return;
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
          });
        }

        const tokenData = await Notifications.getExpoPushTokenAsync();
        await savePushToken(tokenData.data).catch(() => {});
      } catch {
        // simulator дээр push token байхгүй — silent fail
      }
    }
    register();
  }, []);

  // Poll for new notifications every 10 seconds
  useEffect(() => {
    async function poll() {
      if (!auth.currentUser) return;
      try {
        const notes = await getNotifications();
        const unseen = notes.filter(n => !seenIds.current.has(n._id));
        if (unseen.length === 0) return;

        for (const n of unseen) {
          seenIds.current.add(n._id);
          const title = n.type === 'friend_request' ? 'Найзын хүсэлт' : 'Шинэ ажил ирлээ';
          const body = n.type === 'friend_request'
            ? `${n.fromUsername} найзын хүсэлт илгээлээ`
            : `${n.fromUsername}: "${n.taskTitle}"`;
          await Notifications.scheduleNotificationAsync({
            content: { title, body, sound: 'default', data: { local: true } },
            trigger: null,
          });
        }
        await markNotificationsRead().catch(() => {});
      } catch {
        // silent fail
      }
    }

    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, []);
}
