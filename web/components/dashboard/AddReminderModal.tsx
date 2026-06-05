"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { createTask, BackendTask } from "@/lib/api";

type Props = { onClose: () => void; onCreated: (task: BackendTask) => void };

const categories = ["Ажил", "Хувийн", "Гэр бүл", "Эрүүл мэнд", "Хичээл", "Бусад"];

const priorities = [
  { value: "high",   label: "Өндөр" },
  { value: "medium", label: "Дунд" },
  { value: "low",    label: "Бага" },
] as const;

const inputCls = "w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-slate-100 bg-white dark:bg-slate-700 placeholder-gray-300 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const labelCls = "text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide";

export default function AddReminderModal({ onClose, onCreated }: Props) {
  const [title, setTitle]       = useState("");
  const [date, setDate]         = useState("");
  const [time, setTime]         = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [category, setCategory] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Гарчиг оруулна уу."); return; }
    setLoading(true); setError("");
    try {
      const due = date ? `${date}${time ? `T${time}` : ""}` : "";
      const task = await createTask({ title: title.trim(), due, priority, category: category.trim() });
      onCreated(task);
      onClose();
    } catch {
      setError("Хадгалахад алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden border border-transparent dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">Сануулагч нэмэх</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Гарчиг <span className="text-red-400">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Даалгаврын нэр..." className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Огноо</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Цаг</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Чухал байдал</label>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button key={p.value} type="button" onClick={() => setPriority(p.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    priority === p.value
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                      : "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500"
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Ангилал</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className={`${inputCls} appearance-none`}>
              <option value="">— Сонгох —</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              Болих
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60">
              <Plus size={16} />
              {loading ? "Хадгалж байна..." : "Нэмэх"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
