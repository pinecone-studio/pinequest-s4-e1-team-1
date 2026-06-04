import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchTasks } from '../api';

type Task = { _id: string; title: string; due: string; status: string };

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err: any) {
      Alert.alert('Алдаа', err?.response?.data?.error ?? err.message ?? 'Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item._id}
      contentContainerStyle={tasks.length === 0 ? styles.center : styles.list}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListEmptyComponent={
        <Text style={styles.empty}>Даалгавар байхгүй байна</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={[styles.badge, item.status === 'done' ? styles.badgeDone : styles.badgePending]}>
              <Text style={[styles.badgeText, item.status === 'done' ? styles.badgeDoneText : styles.badgePendingText]}>
                {item.status === 'done' ? 'Дууссан' : 'Хүлээгдэж байна'}
              </Text>
            </View>
          </View>
          {!!item.due && <Text style={styles.due}>Дуусах: {item.due}</Text>}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  list: { padding: 16, backgroundColor: '#f9fafb' },
  empty: { color: '#9ca3af', fontSize: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 15, fontWeight: '600', color: '#111', flex: 1, marginRight: 8 },
  due: { marginTop: 6, fontSize: 12, color: '#6b7280' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgePending: { backgroundColor: '#fef9c3' },
  badgeDone: { backgroundColor: '#dcfce7' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgePendingText: { color: '#854d0e' },
  badgeDoneText: { color: '#166534' },
});
