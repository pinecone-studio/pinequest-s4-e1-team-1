import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Task } from "../api";
import { PRIO_COLOR } from "./taskConstants";

type Props = { tasks: Task[]; loading: boolean };

export default function FocusCard({ tasks, loading }: Props) {
  return (
    <LinearGradient
      colors={["#5B3FE0", "#8B5CF6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.card}
    >
      <View style={s.circle1} />
      <View style={s.circle2} />

      <View style={s.top}>
        <View>
          <Text style={s.title}>Өнөөдрийн гол зүйлс</Text>
          <Text style={s.sub}>AI picked for you</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 12 }} />
      ) : tasks.length === 0 ? (
        <Text style={s.empty}>Идэвхтэй даалгавар байхгүй</Text>
      ) : (
        tasks.map((task) => (
          <View key={task._id} style={s.item}>
            <View
              style={[
                s.dot,
                { backgroundColor: PRIO_COLOR[task.priority ?? "medium"] },
              ]}
            />
            <Text style={s.itemText} numberOfLines={1}>
              {task.title}
            </Text>
            {task.priority === "high" && (
              <View style={s.urgent}>
                <Text style={s.urgentText}>Яаралтай</Text>
              </View>
            )}
          </View>
        ))
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    minHeight: 140,
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  circle2: {
    position: "absolute",
    right: 40,
    bottom: -40,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 2 },
  sub: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  badge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  item: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  itemText: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "600" },
  urgent: {
    backgroundColor: "rgba(239,68,68,0.85)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginLeft: 6,
  },
  urgentText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  empty: { color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 8 },
});
