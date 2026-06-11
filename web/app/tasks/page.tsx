"use client";

import { useEffect, useState } from "react";
import { Search, Plus, X } from "lucide-react";
import { fetchTasks, updateTask, deleteTask, shareTask, getFriends, BackendTask, Friend } from "@/lib/api";
import TaskCard from "@/components/tasks/TaskCard";
import AddReminderModal from "@/components/dashboard/AddReminderModal";

type FilterTab = "all" | "todo" | "completed";

const PRIORITY_SCORE: Record<string, number> = { high: 3, medium: 1, low: 0 };

function urgencyScore(due: string | undefined): number {
  if (!due) return -1;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(due.slice(0, 10)); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0)  return 5;  // overdue
  if (diff === 0) return 4; // today
  if (diff === 1) return 3; // tomorrow
  if (diff <= 7)  return 2; // this week
  return 1;                 // future
}

function smartSort(tasks: BackendTask[]): BackendTask[] {
  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    const scoreA = urgencyScore(a.due) * 4 + (PRIORITY_SCORE[a.priority] ?? 1);
    const scoreB = urgencyScore(b.due) * 4 + (PRIORITY_SCORE[b.priority] ?? 1);
    if (scoreA !== scoreB) return scoreB - scoreA;
    if (!a.due && !b.due) return 0;
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due.localeCompare(b.due);
  });
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Бүгд" },
  { key: "todo", label: "Хийх" },
  { key: "completed", label: "Дууссан" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showModal, setShowModal] = useState(false);
  const [shareTarget, setShareTarget] = useState<BackendTask | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch(() => setError("Даалгавар татахад алдаа гарлаа."))
      .finally(() => setLoading(false));
  }, []);

  async function toggleTask(id: string, done: boolean) {
    const updated = await updateTask(id, { status: done ? "done" : "pending" });
    setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
  }

  async function handleUpdate(id: string, fields: Partial<Pick<BackendTask, 'priority' | 'due' | 'category'>>) {
    const updated = await updateTask(id, fields);
    setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
  }

  async function handleDelete(id: string) {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  }

  async function openShare(task: BackendTask) {
    setShareTarget(task);
    setShareError("");
    setFriendsLoading(true);
    try {
      setFriends(await getFriends());
    } catch {
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  }

  async function handleShareTo(friend: Friend) {
    if (!shareTarget) return;
    try {
      await shareTask(shareTarget._id, friend.uid);
      setShareTarget(null);
    } catch (e: any) {
      setShareError(e?.response?.data?.error ?? "Алдаа гарлаа");
    }
  }

  const filtered = smartSort(
    tasks
      .filter((t) => {
        if (filter === "todo") return t.status === "pending";
        if (filter === "completed") return t.status === "done";
        return true;
      })
      .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
  );

  const counts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === "pending").length,
    completed: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-200">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Даалгаврууд</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Хайх, шүүх, зохион байгуулах.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-full transition-colors shadow-sm"
          >
            <Plus size={16} />
            Шинэ
          </button>
        </div>

        <div className="flex gap-3 w-full">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Даалгавар хайх..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-100 placeholder-gray-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
          </div>

          <div className="flex gap-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-1 shadow-sm w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === tab.key
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  filter === tab.key ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-400"
                }`}>
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">{error}</div>
        )}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
              <Search size={22} className="text-gray-300 dark:text-slate-600" />
            </div>
            <p className="text-sm text-gray-400 dark:text-slate-500">Даалгавар олдсонгүй</p>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col gap-3">
            {filtered.map((task) => (
              <TaskCard key={task._id} task={task} onToggle={toggleTask} onUpdate={handleUpdate} onDelete={handleDelete} onShare={openShare} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddReminderModal
          onClose={() => setShowModal(false)}
          onCreated={(task) => setTasks((prev) => [task, ...prev])}
        />
      )}

      {shareTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShareTarget(null)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6 shadow-xl z-10">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Найздаа илгээх</h3>
              <button onClick={() => setShareTarget(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-400 dark:text-slate-500 mb-4 truncate">"{shareTarget.title}"</p>
            {shareError && <p className="text-xs text-red-500 mb-3">{shareError}</p>}
            {friendsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : friends.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">Найз байхгүй байна</p>
            ) : (
              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                {friends.map(f => (
                  <button key={f.uid} onClick={() => handleShareTo(f)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors text-left">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{f.username[0].toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-slate-100">{f.username}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
