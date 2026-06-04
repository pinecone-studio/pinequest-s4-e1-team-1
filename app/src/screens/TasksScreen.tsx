import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  Task,
  TaskPriority,
} from "../api";
import FocusCard from "../components/FocusCard";
import TabFilter from "../components/TabFilter";
import TaskList from "../components/TaskList";
import BottomNav from "../components/BottomNav";
import AddTaskModal from "../components/AddTaskModal";
import { Tab, TODAY } from "../components/taskConstants";

const CATS_KEY = "task_categories_v1";
const DEFAULT_CATS = [
  "Хувийн",
  "Ажил",
  "Сурлага",
  "Бусад",
  "Эрүүл мэнд",
  "Хобби",
  "Гэр бүл",
];

function formatDate(d: Date) {
  const days = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
  const months = [
    "1-р сар",
    "2-р сар",
    "3-р сар",
    "4-р сар",
    "5-р сар",
    "6-р сар",
    "7-р сар",
    "8-р сар",
    "9-р сар",
    "10-р сар",
    "11-р сар",
    "12-р сар",
  ];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

export default function TasksScreen({ navigation }: any) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATS);
  const [addModal, setAddModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ tabBarStyle: { display: "none" } });
      return () => navigation.setOptions({ tabBarStyle: undefined });
    }, [navigation]),
  );

  useEffect(() => {
    AsyncStorage.getItem(CATS_KEY).then((v) => {
      if (v) setCategories(JSON.parse(v));
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await fetchTasks());
    } catch (e: any) {
      Alert.alert("Алдаа", e?.response?.data?.error ?? e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const focusTasks = useMemo(() => {
    const order: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
    return [...tasks]
      .filter((t) => t.status !== "done")
      .sort((a, b) => {
        const pd =
          order[a.priority ?? "medium"] - order[b.priority ?? "medium"];
        if (pd) return pd;
        if (!a.due && !b.due) return 0;
        return !a.due ? 1 : !b.due ? -1 : a.due.localeCompare(b.due);
      })
      .slice(0, 3);
  }, [tasks]);

  const displayTasks = useMemo(
    () => ({
      today: tasks.filter(
        (t) => t.status !== "done" && (!t.due || t.due <= TODAY),
      ),
      upcoming: tasks.filter(
        (t) => t.status !== "done" && !!t.due && t.due > TODAY,
      ),
      completed: tasks.filter((t) => t.status === "done"),
    }),
    [tasks],
  );

  const toggleComplete = async (task: Task) => {
    const next = task.status === "done" ? "pending" : "done";
    setTasks((p) =>
      p.map((t) => (t._id === task._id ? { ...t, status: next } : t)),
    );
    try {
      await updateTask(task._id, { status: next });
    } catch {
      setTasks((p) =>
        p.map((t) => (t._id === task._id ? { ...t, status: task.status } : t)),
      );
    }
  };

  const confirmDelete = (task: Task) =>
    Alert.alert("Устгах", `"${task.title}" устгах уу?`, [
      { text: "Болих", style: "cancel" },
      {
        text: "Устгах",
        style: "destructive",
        onPress: async () => {
          setTasks((p) => p.filter((t) => t._id !== task._id));
          try {
            await deleteTask(task._id);
          } catch {
            load();
          }
        },
      },
    ]);

  const handleSave = async (
    title: string,
    due: string,
    priority: TaskPriority,
    category: string,
  ) => {
    const task = await createTask(title, due, priority, category);
    setTasks((p) => [task, ...p]);
    setAddModal(false);
  };

  const tabCounts = {
    today: displayTasks.today.length,
    upcoming: displayTasks.upcoming.length,
    completed: displayTasks.completed.length,
  };

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <View>
            <Text style={s.date}>{formatDate(new Date())}</Text>
            <Text style={s.pageTitle}>Your tasks</Text>
          </View>
        </View>

        <FocusCard tasks={focusTasks} loading={loading} />
        <TabFilter
          activeTab={activeTab}
          counts={tabCounts}
          onSwitch={setActiveTab}
        />
        <TaskList
          tasks={displayTasks[activeTab]}
          loading={loading}
          activeTab={activeTab}
          onToggle={toggleComplete}
          onDelete={confirmDelete}
        />
        <View style={{ height: 110 }} />
      </ScrollView>

      <TouchableOpacity
        style={s.fab}
        onPress={() => setAddModal(true)}
        activeOpacity={0.85}
      >
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>

      <BottomNav navigation={navigation} />

      <AddTaskModal
        visible={addModal}
        categories={categories}
        onClose={() => setAddModal(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F0F0F7" },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  date: { fontSize: 13, color: "#9CA3AF", fontWeight: "500", marginBottom: 2 },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -0.5,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#6C47FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#6C47FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6C47FF",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  fabText: { color: "#fff", fontSize: 28, lineHeight: 32 },
});
