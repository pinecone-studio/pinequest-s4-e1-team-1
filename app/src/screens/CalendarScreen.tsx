import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { fetchTasks, Task } from "../api";
import BottomNav from "../components/BottomNav";

const { width: SW } = Dimensions.get("window");

const MONTHS = [
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
const WEEKDAYS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];
const PRIO_COLOR: Record<string, string> = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#10B981",
};
const PRIO_LABEL: Record<string, string> = {
  high: "Өндөр",
  medium: "Дунд",
  low: "Бага",
};

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function todayStr() {
  const n = new Date();
  return toDateStr(n.getFullYear(), n.getMonth(), n.getDate());
}
function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function startOffset(y: number, m: number) {
  return (new Date(y, m, 1).getDay() + 6) % 7;
}
function formatLabel(dateStr: string) {
  const p = dateStr.split("-");
  return `${parseInt(p[1])}-р сарын ${parseInt(p[2])}`;
}

const CELL_H = (SW - 32) / 7 + 14;

function CalendarGrid({
  year,
  month,
  selected,
  byDate,
  onSelect,
}: {
  year: number;
  month: number;
  selected: string;
  byDate: Record<string, Task[]>;
  onSelect: (d: string) => void;
}) {
  const today = todayStr();
  const cells: (number | null)[] = [
    ...Array(startOffset(year, month)).fill(null),
    ...Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={g.grid}>
      <View style={g.row}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={g.headerCell}>
            <Text style={g.headerText}>{d}</Text>
          </View>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, ri) => (
        <View key={ri} style={g.row}>
          {cells.slice(ri * 7, ri * 7 + 7).map((day, ci) => {
            if (!day) return <View key={ci} style={g.cell} />;
            const dateStr = toDateStr(year, month, day);
            const isToday = dateStr === today;
            const isSel = dateStr === selected;
            const count = byDate[dateStr]?.length ?? 0;
            return (
              <TouchableOpacity
                key={ci}
                style={g.cell}
                onPress={() => onSelect(dateStr)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    g.circle,
                    isToday && !isSel && g.todayCircle,
                    isSel && g.selCircle,
                  ]}
                >
                  <Text
                    style={[
                      g.num,
                      isToday && !isSel && g.todayNum,
                      isSel && g.selNum,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                <View style={g.dotRow}>
                  {count > 0 && count <= 3 ? (
                    Array.from({ length: count }, (_, i) => (
                      <View key={i} style={g.dot} />
                    ))
                  ) : count > 3 ? (
                    <View style={g.badge}>
                      <Text style={g.badgeText}>{count}</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const g = StyleSheet.create({
  grid: { width: "100%" },
  row: { flexDirection: "row" },
  headerCell: { flex: 1, alignItems: "center", paddingVertical: 10 },
  headerText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.5,
  },
  cell: { flex: 1, alignItems: "center", paddingTop: 4, height: CELL_H },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  todayCircle: { borderWidth: 2, borderColor: "#6C47FF" },
  selCircle: { backgroundColor: "#6C47FF" },
  num: { fontSize: 14, color: "#1A1A2E", fontWeight: "500" },
  todayNum: { color: "#6C47FF", fontWeight: "800" },
  selNum: { color: "#fff", fontWeight: "800" },
  dotRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 4,
    height: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#6C47FF" },
  badge: { backgroundColor: "#6C47FF", borderRadius: 6, paddingHorizontal: 5 },
  badgeText: { fontSize: 8, color: "#fff", fontWeight: "800" },
});

function TaskRow({ task }: { task: Task }) {
  const color = PRIO_COLOR[task.priority ?? "medium"];
  return (
    <View style={tr.wrap}>
      <View style={[tr.bar, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text
          style={[tr.title, task.status === "done" && tr.done]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
        <View style={tr.meta}>
          {task.category ? (
            <View style={tr.catChip}>
              <Text style={tr.catText}>{task.category}</Text>
            </View>
          ) : null}
          <View style={[tr.prioChip, { backgroundColor: color + "18" }]}>
            <View style={[tr.prioDot, { backgroundColor: color }]} />
            <Text style={[tr.prioText, { color }]}>
              {PRIO_LABEL[task.priority ?? "medium"]}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const tr = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bar: { width: 4, borderRadius: 2, alignSelf: "stretch", minHeight: 36 },
  title: { fontSize: 14, fontWeight: "600", color: "#1A1A2E", marginBottom: 6 },
  done: { textDecorationLine: "line-through", color: "#9CA3AF" },
  meta: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  catChip: {
    backgroundColor: "#F3F0FF",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  catText: { fontSize: 11, color: "#6C47FF", fontWeight: "600" },
  prioChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  prioDot: { width: 6, height: 6, borderRadius: 3 },
  prioText: { fontSize: 11, fontWeight: "600" },
});

export default function CalendarScreen({ navigation }: any) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(todayStr());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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
      navigation.setOptions({ tabBarStyle: { display: "none" } });
      load();
      return () => navigation.setOptions({ tabBarStyle: undefined });
    }, [load, navigation]),
  );

  const byDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const tk of tasks) {
      if (tk.due) (map[tk.due] ??= []).push(tk);
    }
    return map;
  }, [tasks]);

  const selectedTasks = useMemo(() => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return [...(byDate[selected] ?? [])].sort(
      (a, b) =>
        (order[a.priority ?? "medium"] ?? 1) -
        (order[b.priority ?? "medium"] ?? 1),
    );
  }, [byDate, selected]);

  const prevMonth = () =>
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });

  const nextMonth = () =>
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* Тогтмол: header + calendar */}
      <View style={s.top}>
        <View style={s.header}>
          <Text style={s.subTitle}>{year}</Text>
          <Text style={s.pageTitle}>Календарь</Text>
        </View>

        <View style={s.monthNav}>
          <TouchableOpacity style={s.arrowBtn} onPress={prevMonth}>
            <Text style={s.arrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.monthLabel}>{MONTHS[month]}</Text>
          <TouchableOpacity style={s.arrowBtn} onPress={nextMonth}>
            <Text style={s.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={s.calCard}>
          {loading ? (
            <ActivityIndicator color="#6C47FF" style={{ marginVertical: 50 }} />
          ) : (
            <CalendarGrid
              year={year}
              month={month}
              selected={selected}
              byDate={byDate}
              onSelect={setSelected}
            />
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.taskList}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
      >
        <View style={s.dayHeader}>
          <View>
            <Text style={s.dayDate}>{formatLabel(selected)}</Text>
            <Text style={s.dayCount}>
              {selectedTasks.length > 0
                ? `${selectedTasks.length} даалгавар`
                : "Даалгавар байхгүй"}
            </Text>
          </View>
          {selectedTasks.length > 0 && (
            <View style={s.countBadge}>
              <Text style={s.countBadgeText}>{selectedTasks.length}</Text>
            </View>
          )}
        </View>

        {selectedTasks.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📅</Text>
            <Text style={s.emptyText}>Энэ өдөр даалгавар байхгүй</Text>
          </View>
        ) : (
          selectedTasks.map((task) => <TaskRow key={task._id} task={task} />)
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNav navigation={navigation} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F0F0F7" },
  top: { paddingHorizontal: 16, paddingTop: 8 },
  header: { marginBottom: 14 },
  subTitle: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
    marginBottom: 2,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -0.5,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: { fontSize: 22, color: "#6C47FF", fontWeight: "600", lineHeight: 26 },
  monthLabel: { fontSize: 17, fontWeight: "800", color: "#1A1A2E" },
  calCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  taskList: { paddingHorizontal: 16, paddingTop: 4, flexGrow: 1 },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  dayDate: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -0.3,
  },
  dayCount: { fontSize: 13, color: "#9CA3AF", fontWeight: "500", marginTop: 2 },
  countBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6C47FF",
    justifyContent: "center",
    alignItems: "center",
  },
  countBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyEmoji: { fontSize: 44 },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#6B7280" },
});
