"use client";

import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
import { fetchTasks, updateTask, BackendTask } from "@/lib/api";
import TaskCard from "@/components/tasks/TaskCard";
import AddReminderModal from "@/components/dashboard/AddReminderModal";

type FilterTab = "all" | "todo" | "completed";

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

  const filtered = tasks
    .filter((t) => {
      if (filter === "todo") return t.status === "pending";
      if (filter === "completed") return t.status === "done";
      return true;
    })
    .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

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
              <TaskCard key={task._id} task={task} onToggle={toggleTask} />
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
    </div>
  );
}
