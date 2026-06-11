import { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { fetchTasks, getFriends, shareTask, Task, Friend } from "../api";
import { useTheme } from "../theme/ThemeContext";
import { Colors } from "../theme/colors";

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

const CELL_H = (SW - 32) / 7 + 20;

function CalendarGrid({
  year,
  month,
  selected,
  byDate,
  onSelect,
  C,
}: {
  year: number;
  month: number;
  selected: string;
  byDate: Record<string, Task[]>;
  onSelect: (d: string) => void;
  C: Colors;
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
            <Text style={[g.headerText, { color: C.textMuted }]}>{d}</Text>
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
                    isToday &&
                      !isSel && { borderWidth: 2, borderColor: C.accent },
                    isSel && { backgroundColor: C.accent },
                  ]}
                >
                  <Text
                    style={[
                      g.num,
                      { color: C.text },
                      isToday &&
                        !isSel && { color: C.accent, fontWeight: "800" },
                      isSel && { color: "#fff", fontWeight: "800" },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                <View style={g.dotRow}>
                  {count > 0 && count <= 3 ? (
                    Array.from({ length: count }, (_, i) => (
                      <View
                        key={i}
                        style={[g.dot, { backgroundColor: C.accent }]}
                      />
                    ))
                  ) : count > 3 ? (
                    <View style={[g.countPill, { backgroundColor: C.accentLight }]}>
                      <Text style={[g.countText, { color: C.accent }]}>{count}</Text>
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
  headerText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  cell: { flex: 1, alignItems: "center", paddingTop: 4, height: CELL_H },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  num: { fontSize: 14, fontWeight: "500" },
  dotRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 3,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  countPill: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: "center" },
  countText: { fontSize: 10, fontWeight: "800", lineHeight: 14 },
});

function TaskRow({ task, C }: { task: Task; C: Colors }) {
  const color = PRIO_COLOR[task.priority ?? "medium"];
  return (
    <View
      style={[tr.wrap, { backgroundColor: C.surface, shadowColor: C.shadow }]}
    >
      <View style={[tr.bar, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text
          style={[
            tr.title,
            { color: C.text },
            task.status === "done" && tr.done,
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
        <View style={tr.meta}>
          {task.category ? (
            <View style={[tr.catChip, { backgroundColor: C.accentLight }]}>
              <Text style={[tr.catText, { color: C.accent }]}>
                {task.category}
              </Text>
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
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bar: { width: 4, borderRadius: 2, alignSelf: "stretch", minHeight: 36 },
  title: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  done: { textDecorationLine: "line-through", opacity: 0.4 },
  meta: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  catChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  catText: { fontSize: 11, fontWeight: "600" },
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

export default function CalendarScreen() {
  const { colors: C } = useTheme();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(todayStr());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModal, setShareModal] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sharing, setSharing] = useState(false);

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

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const byDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const tk of tasks) {
      const raw = tk.due?.slice(0, 10) ?? "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) continue;
      (map[raw] ??= []).push(tk);
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

  useEffect(() => {
    if (!shareModal) return;
    setLoadingFriends(true);
    getFriends().then(setFriends).catch(() => {}).finally(() => setLoadingFriends(false));
  }, [shareModal]);

  const handleShare = async (friend: Friend) => {
    setSharing(true);
    try {
      await Promise.all(selectedTasks.map(t => shareTask(t._id, friend.uid)));
      setShareModal(false);
      Alert.alert('Илгээсэн!', `${selectedTasks.length} даалгаврыг ${friend.username}-д илгээлээ`);
    } catch {
      Alert.alert('Алдаа', 'Илгээхэд алдаа гарлаа');
    } finally {
      setSharing(false);
    }
  };

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
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Text style={[s.subTitle, { color: C.textMuted }]}>{year} · Хуанли</Text>
          <Text style={[s.pageTitle, { color: C.text }]}>{MONTHS[month]}</Text>
        </View>

        <View style={s.monthNav}>
          <TouchableOpacity
            style={[s.arrowBtn, { backgroundColor: C.accentLight }]}
            onPress={prevMonth}
          >
            <Text style={[s.arrow, { color: C.accent }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[s.monthLabel, { color: C.text }]}>{MONTHS[month]}</Text>
          <TouchableOpacity
            style={[s.arrowBtn, { backgroundColor: C.accentLight }]}
            onPress={nextMonth}
          >
            <Text style={[s.arrow, { color: C.accent }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            s.calCard,
            { backgroundColor: C.surface, shadowColor: C.shadow },
          ]}
        >
          {loading ? (
            <ActivityIndicator
              color={C.accent}
              style={{ marginVertical: 50 }}
            />
          ) : (
            <CalendarGrid
              year={year}
              month={month}
              selected={selected}
              byDate={byDate}
              onSelect={setSelected}
              C={C}
            />
          )}
        </View>

        <View style={s.dayHeader}>
          <View>
            <Text style={[s.dayDate, { color: C.text }]}>
              {formatLabel(selected)}
            </Text>
            <Text style={[s.dayCount, { color: C.textMuted }]}>
              {selectedTasks.length > 0
                ? `${selectedTasks.length} даалгавар`
                : "Даалгавар байхгүй"}
            </Text>
          </View>
          {selectedTasks.length > 0 && (
            <TouchableOpacity
              style={[s.shareBtn, { backgroundColor: C.accentLight }]}
              onPress={() => setShareModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={15} color={C.accent} />
              <Text style={[s.shareBtnText, { color: C.accent }]}>Найздаа</Text>
            </TouchableOpacity>
          )}
        </View>

        <Modal visible={shareModal} transparent animationType="slide" onRequestClose={() => setShareModal(false)}>
          <View style={s.modalOverlay}>
            <View style={[s.modalSheet, { backgroundColor: C.surface }]}>
              <View style={s.modalHeader}>
                <Text style={[s.modalTitle, { color: C.text }]}>Найздаа илгээх</Text>
                <TouchableOpacity onPress={() => setShareModal(false)}>
                  <Ionicons name="close" size={22} color={C.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={[s.modalSub, { color: C.textMuted }]}>
                {formatLabel(selected)}-ийн {selectedTasks.length} даалгаврыг илгээх
              </Text>
              {loadingFriends ? (
                <ActivityIndicator color={C.accent} style={{ marginVertical: 24 }} />
              ) : friends.length === 0 ? (
                <Text style={[s.modalEmpty, { color: C.textMuted }]}>Найз байхгүй байна</Text>
              ) : (
                <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                  {friends.map(f => (
                    <TouchableOpacity
                      key={f.uid}
                      style={[s.friendRow, { borderColor: C.border }]}
                      onPress={() => handleShare(f)}
                      disabled={sharing}
                      activeOpacity={0.7}
                    >
                      <View style={[s.friendAvatar, { backgroundColor: C.accentLight }]}>
                        <Text style={[s.friendAvatarText, { color: C.accent }]}>
                          {f.username[0].toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[s.friendName, { color: C.text }]}>{f.username}</Text>
                      {sharing && <ActivityIndicator size="small" color={C.accent} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {selectedTasks.length === 0 ? (
          <View style={s.empty}>
            <View style={[s.emptyIconWrap, { backgroundColor: C.accentLight }]}>
              <Ionicons name="calendar-outline" size={26} color={C.accent} />
            </View>
            <Text style={[s.emptyText, { color: C.textSec }]}>
              Энэ өдөр даалгавар байхгүй
            </Text>
          </View>
        ) : (
          selectedTasks.map((task) => (
            <TaskRow key={task._id} task={task} C={C} />
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 100 },
  header: { marginBottom: 8 },
  subTitle: { fontSize: 13, fontWeight: "500", marginBottom: 2 },
  pageTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
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
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: { fontSize: 22, fontWeight: "600", lineHeight: 26 },
  monthLabel: { fontSize: 17, fontWeight: "800" },
  calCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    marginBottom: 16,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  dayDate: { fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  dayCount: { fontSize: 13, fontWeight: "500", marginTop: 2 },
  countBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  countBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  empty: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 15, fontWeight: "600" },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  shareBtnText: { fontSize: 13, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalSub: { fontSize: 13, marginBottom: 20 },
  modalEmpty: { textAlign: "center", paddingVertical: 24, fontSize: 14 },
  friendRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  friendAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  friendAvatarText: { fontSize: 15, fontWeight: "800" },
  friendName: { flex: 1, fontSize: 15, fontWeight: "600" },
});
