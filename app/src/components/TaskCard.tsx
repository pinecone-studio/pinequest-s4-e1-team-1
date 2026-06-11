import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Task } from "../api";
import {
  PRIO_COLOR,
  PRIO_LABEL,
  CATEGORY_PALETTE,
  FALLBACK_CAT,
} from "./taskConstants";
import { useTheme } from "../theme/ThemeContext";

type Props = { task: Task; onToggle: () => void; onDelete: () => void; onEdit?: () => void; onShare?: () => void };

export default function TaskCard({ task, onToggle, onDelete, onEdit, onShare }: Props) {
  const { colors: C } = useTheme();
  const done = task.status === "done";
  const pColor = PRIO_COLOR[task.priority ?? "medium"];
  const cat = CATEGORY_PALETTE[task.category] ?? FALLBACK_CAT;

  return (
    <View
      style={[s.card, { backgroundColor: C.surface }]}
    >
      <View style={[s.accent, { backgroundColor: pColor }]} />

      <TouchableOpacity
        style={[s.checkbox, { borderColor: C.border }, done && s.checkboxDone]}
        onPress={onToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {done && <Text style={s.checkmark}>✓</Text>}
      </TouchableOpacity>

      <View style={s.body}>
        <Text style={[s.title, { color: C.text }, done && s.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={s.meta}>
          {!!task.category && (
            <View style={[s.catTag, { backgroundColor: cat.bg }]}>
              <Text style={[s.catText, { color: cat.text }]}>
                {task.category}
              </Text>
            </View>
          )}
          <View style={s.prioTag}>
            <View style={[s.prioDot, { backgroundColor: pColor }]} />
            <Text style={[s.prioText, { color: pColor }]}>
              {PRIO_LABEL[task.priority ?? "medium"]}
            </Text>
          </View>
          {!!task.due && (
            <View style={[s.duePill, { backgroundColor: C.surfaceAlt }]}>
              <Text style={[s.dueText, { color: C.textSec }]}> {task.due}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.actions}>
        <TouchableOpacity style={s.actionBtn} onPress={onShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="person-add-outline" size={15} color={C.accent} />
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="pencil-outline" size={15} color={C.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={15} color="#f43f5e" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    marginBottom: 10,
    padding: 14,
    overflow: "hidden",
    shadowColor: "#6C47FF",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  checkboxDone: { backgroundColor: "#6C47FF", borderColor: "#6C47FF" },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: "800" },
  body: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 7,
    lineHeight: 20,
  },
  titleDone: { textDecorationLine: "line-through", color: "#9CA3AF" },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  catTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catText: { fontSize: 11, fontWeight: "700" },
  prioTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  prioDot: { width: 7, height: 7, borderRadius: 3.5 },
  prioText: { fontSize: 11, fontWeight: "600" },
  duePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dueText: { fontSize: 11, fontWeight: "500" },
  actions: { flexDirection: "column", gap: 6, marginLeft: 8, alignItems: "center", justifyContent: "center" },
  actionBtn: { padding: 4 },
});
