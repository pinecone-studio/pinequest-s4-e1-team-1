"use client";

import { useState } from "react";
import { fetchReport } from "@/lib/api";
import { Header } from "@/components/Header";

type Report = {
  date: string;
  entryCount: number;
  taskCount: number;
  eventCount: number;
  summary: string;
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function ReportPage() {
  const [date, setDate] = useState(todayISO());
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setReport(null);
    setLoading(true);
    try {
      const data = await fetchReport(date);
      setReport(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Тайлан татахад алдаа гарлаа.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Өдрийн тайлан</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex gap-3 items-end"
      >
        <div className="flex-1">
          <label
            htmlFor="report-date"
            className="block text-xs font-semibold text-gray-500 mb-1"
          >
            Огноо
          </label>
          <input
            id="report-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          {loading ? "Татаж байна..." : "Харах"}
        </button>
      </form>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {report && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Бичлэг" value={report.entryCount} color="indigo" />
            <StatCard
              label="Даалгавар"
              value={report.taskCount}
              color="green"
            />
            <StatCard
              label="Цаг товлол"
              value={report.eventCount}
              color="blue"
            />
          </div>

          {report.summary && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Хураангуй
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">
                {report.summary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "indigo" | "green" | "blue";
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    green: "bg-green-50 text-green-600 border-green-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
  };
  return (
    <div
      className={`border rounded-xl p-4 flex flex-col items-center ${colors[color]}`}
    >
      <span className="text-3xl font-bold">{value}</span>
      <span className="text-xs font-medium mt-1 opacity-70">{label}</span>
    </div>
  );
}
