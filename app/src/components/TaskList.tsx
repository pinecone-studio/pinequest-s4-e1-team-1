import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  onEdit?:   (task: Task) => void;
};

const EMPTY_MSG: Record<Tab, string> = {
  today:     'Өнөөдрийн даалгавар байхгүй',
  upcoming:  'Удахгүй дуусах даалгавар байхгүй',
  completed: 'Дууссан даалгавар байхгүй',
};

const EMPTY_ICON: Record<Tab, keyof typeof Ionicons.glyphMap> = {
  today:     'checkmark-circle-outline',
  upcoming:  'calendar-outline',
  completed: 'ribbon-outline',
};

export default function TaskList({ tasks, loading, activeTab, onToggle, onDelete, onEdit }: Props) {
  const { colors: C } = useTheme();

  if (loading && tasks.length === 0) {
    return <ActivityIndicator size="large" color={C.accent} style={{ marginTop: 40 }} />;
  }

  if (tasks.length === 0) {
    return (
      <View style={s.empty}>
        <View style={[s.emptyIconWrap, { backgroundColor: C.accentLight }]}>
          <Ionicons name={EMPTY_ICON[activeTab]} size={28} color={C.accent} />
        </View>
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
          onEdit={() => onEdit?.(task)}
        />
      ))}
    </>
  );
}

const s = StyleSheet.create({
  empty:        { alignItems: 'center', paddingTop: 56, paddingBottom: 20, gap: 12 },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyText:    { fontSize: 14, fontWeight: '500' },
});
