import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import TaskCard from './TaskCard';
import { Task } from '../api';
import { Tab } from './taskConstants';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  tasks:     Task[];
  loading:   boolean;
  activeTab: Tab;
  onToggle:  (task: Task) => void;
  onDelete:  (task: Task) => void;
};

const EMPTY_MSG: Record<Tab, string> = {
  today:     'Өнөөдрийн даалгавар байхгүй',
  upcoming:  'Удахгүй дуусах даалгавар байхгүй',
  completed: 'Дууссан даалгавар байхгүй',
};

const EMPTY_ICON: Record<Tab, string> = {
  today: '✅', upcoming: '📅', completed: '🎉',
};

export default function TaskList({ tasks, loading, activeTab, onToggle, onDelete }: Props) {
  const { colors: C } = useTheme();

  if (loading && tasks.length === 0) {
    return <ActivityIndicator size="large" color={C.accent} style={{ marginTop: 40 }} />;
  }

  if (tasks.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyIcon}>{EMPTY_ICON[activeTab]}</Text>
        <Text style={[s.emptyText, { color: C.textMuted }]}>{EMPTY_MSG[activeTab]}</Text>
      </View>
    );
  }

  return (
    <>
      {tasks.map(task => (
        <TaskCard
          key={task._id}
          task={task}
          onToggle={() => onToggle(task)}
          onDelete={() => onDelete(task)}
        />
      ))}
    </>
  );
}

const s = StyleSheet.create({
  empty:     { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, fontWeight: '500' },
});
