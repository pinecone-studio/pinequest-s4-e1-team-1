"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, FileBarChart, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import {
  fetchTasks,
  fetchReport,
  BackendTask,
  ReportData,
  ReportPeriod,
  ReportType,
} from "@/lib/api";
import GeneralCard from "@/components/insights/GeneralCard";
import WorkCard from "@/components/insights/WorkCard";

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: "day", label: "Өдөр" },
  { key: "week", label: "7 хоног" },
  { key: "month", label: "1 сар" },
];

function toISO(d: Date) {
  return d.toISOString().split("T")[0];
}
function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

type WorkloadSignal = 'overload' | 'ok' | 'underload';

function getWorkloadSignal(taskCount: number, period: ReportPeriod): { workloadSignal: WorkloadSignal; workloadAdvice: string } {
  const [overloadAt, okAt] =
    period === 'day'   ? [8, 3]  :
    period === 'week'  ? [40, 14] :
                         [150, 45];
  if (taskCount >= overloadAt) {
    return { workloadSignal: 'overload', workloadAdvice: 'Хэт их ачаалалтай байна — burnout болох эрсдэлтэй. Нэн чухал зүйлдээ анхаараарай.' };
  } else if (taskCount >= okAt) {
    return { workloadSignal: 'ok', workloadAdvice: 'Маш сайн байлаа! Ачаалал тэнцвэртэй байна.' };
  } else {
    return { workloadSignal: 'underload', workloadAdvice: 'Даалгавар бага байна. Шинэ зорилго нэмж идэвхжүүлж болно.' };
  }
}

const WORKLOAD_CONFIG: Record<WorkloadSignal, { bg: string; border: string; text: string; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  overload:  { bg: 'bg-rose-50 dark:bg-rose-950/40',   border: 'border-rose-200 dark:border-rose-800',   text: 'text-rose-700 dark:text-rose-300',   label: 'Хэт ачаалалтай', Icon: AlertTriangle },
  ok:        { bg: 'bg-green-50 dark:bg-green-950/40', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300', label: 'Тэнцвэртэй',     Icon: CheckCircle2 },
  underload: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-400', label: 'Бага ачаалал', Icon: TrendingUp },
};

function periodStart(date: string, period: ReportPeriod): string {
  const d = new Date(date);
  if (period === "week") d.setDate(d.getDate() - 6);
  if (period === "month") d.setDate(d.getDate() - 29);
  return toISO(d);
}

function filterTasks(
  tasks: BackendTask[],
  date: string,
  period: ReportPeriod,
  type: ReportType,
): BackendTask[] {
  const start = periodStart(date, period);
  return tasks.filter((t) => {
    const due = t.due?.slice(0, 10) ?? "";
    const inPeriod = due >= start && due <= date;
    if (!inPeriod) return false;
    if (type === "work") return t.category === "Ажил";
    return true;
  });
}

function buildReport(
  filtered: BackendTask[],
  date: string,
  period: ReportPeriod,
  type: ReportType,
  ai?: Partial<ReportData>,
): ReportData {
  const start = periodStart(date, period);
  const done = filtered.filter((t) => t.status === "done").length;
  const { workloadSignal, workloadAdvice } = getWorkloadSignal(filtered.length, period);
  return {
    period,
    type,
    label: period === "day" ? date : `${start} – ${date}`,
    startDate: start,
    endDate: date,
    entryCount: 0,
    taskCount: filtered.length,
    completedTaskCount: done,
    pendingTaskCount: filtered.length - done,
    highCount: filtered.filter((t) => t.priority === "high").length,
    mediumCount: filtered.filter((t) => t.priority === "medium").length,
    lowCount: filtered.filter((t) => t.priority === "low").length,
    eventCount: 0,
    summary: ai?.summary ?? "",
    executiveSummary: ai?.executiveSummary ?? "",
    insights: ai?.insights ?? "",
    risks: ai?.risks ?? "",
    recommendations: ai?.recommendations ?? "",
    workloadSignal,
    workloadAdvice,
  };
}

export default function InsightsPage() {
  const [allTasks, setAllTasks] = useState<BackendTask[]>([]);
  const [period, setPeriod] = useState<ReportPeriod>("day");
  const [type, setType] = useState<ReportType>("general");
  const [date, setDate] = useState(toISO(new Date()));
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTasks()
      .then(setAllTasks)
      .catch(() => {});
  }, []);

  function changeDay(delta: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(toISO(d));
    setReport(null);
  }

  async function load() {
    setLoading(true);
    setError("");
    setReport(null);

    const filtered = filterTasks(allTasks, date, period, type);

    // Stats тэр даруй харуулна (client-side)
    const base = buildReport(filtered, date, period, type);
    setReport(base);
    setLoading(false);

    // AI summary backend-аас авна (async)
    if (filtered.length > 0) {
      setAiLoading(true);
      try {
        const ai = await fetchReport(date, period, type);
        setReport(buildReport(filtered, date, period, type, ai));
      } catch {
        // AI алдаа гарвал stats хэвээр үлдэнэ
      } finally {
        setAiLoading(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-200">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Тайлан
        </h1>

        {/* Type toggle */}
        <div className="flex bg-gray-200 dark:bg-slate-700 rounded-xl p-1 gap-1">
          {(["general", "work"] as ReportType[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setType(t);
                setReport(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                type === t
                  ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-400 dark:text-slate-500"
              }`}
            >
              {t === "general" ? "Хувийн" : "Ажлын"}
            </button>
          ))}
        </div>

        {/* Period tabs */}
        <div className="flex bg-gray-200 dark:bg-slate-700 rounded-xl p-1 gap-1">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setPeriod(key);
                setReport(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                period === key
                  ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-400 dark:text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date picker */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => changeDay(-1)}
            className="p-2 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-6 py-2.5 shadow-sm min-w-37.5 text-center">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {fmt(date)}
            </span>
          </div>
          <button
            onClick={() => changeDay(1)}
            className="p-2 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Button */}
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <FileBarChart size={18} /> Тайлан харах
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* AI loading hint */}
        {aiLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500 justify-center animate-pulse">
            <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
            AI дүгнэлт боловсруулж байна...
          </div>
        )}

        {/* Workload banner */}
        {report && !loading && report.workloadSignal && (() => {
          const cfg = WORKLOAD_CONFIG[report.workloadSignal];
          const { Icon } = cfg;
          return (
            <div className={`flex items-start gap-3 ${cfg.bg} border ${cfg.border} rounded-2xl px-4 py-3.5`}>
              <Icon size={18} className={`${cfg.text} shrink-0 mt-0.5`} />
              <div className="flex flex-col gap-0.5">
                <span className={`text-xs font-bold uppercase tracking-wide ${cfg.text} opacity-70`}>{cfg.label}</span>
                <p className={`text-sm font-medium ${cfg.text}`}>{report.workloadAdvice}</p>
              </div>
            </div>
          );
        })()}

        {/* Report cards */}
        {report &&
          !loading &&
          (type === "work" ? (
            <WorkCard {...report} />
          ) : (
            <GeneralCard {...report} />
          ))}
      </div>
    </div>
  );
}
