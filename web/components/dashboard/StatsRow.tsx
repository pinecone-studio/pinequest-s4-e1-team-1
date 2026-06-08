import { CheckCircle2, Clock, ListTodo } from "lucide-react";

type Task = { completed: boolean };

function RingProgress({ rate }: { rate: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (rate / 100) * circ;

  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" strokeWidth="4"
          className="stroke-purple-100 dark:stroke-purple-950/60" />
        <circle cx="24" cy="24" r={r} fill="none" strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          className="stroke-purple-500 dark:stroke-purple-400 transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-black text-purple-600 dark:text-purple-400">{rate}%</span>
      </div>
    </div>
  );
}

export default function StatsRow({ tasks }: { tasks: Task[] }) {
  const total     = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending   = total - completed;
  const rate      = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

      {/* Нийт */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 border border-gray-100 dark:border-slate-700/60 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg shrink-0">
            <ListTodo size={16} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{total}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Нийт даалгавар</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
          <div className="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-500 opacity-70 w-full" />
        </div>
      </div>

      {/* Дууссан */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 border border-gray-100 dark:border-slate-700/60 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{completed}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Дууссан</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-emerald-500 to-teal-500 opacity-70 transition-all duration-700"
            style={{ width: total ? `${(completed / total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* Хүлээгдэж буй */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 border border-gray-100 dark:border-slate-700/60 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-orange-50 dark:bg-orange-950/60 text-orange-500 dark:text-orange-400 p-2 rounded-lg shrink-0">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{pending}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Хүлээгдэж буй</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-orange-400 to-amber-500 opacity-70 transition-all duration-700"
            style={{ width: total ? `${(pending / total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* Гүйцэтгэл — circular ring */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 border border-gray-100 dark:border-slate-700/60 flex items-center gap-3">
        <RingProgress rate={rate} />
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">Гүйцэтгэл</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
            {completed} / {total} даалгавар
          </p>
          <div className="mt-2 flex items-center gap-1">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${rate >= 50 ? 'bg-emerald-500' : 'bg-orange-400'}`} />
            <span className={`text-[10px] font-semibold ${rate >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500 dark:text-orange-400'}`}>
              {rate >= 80 ? 'Маш сайн' : rate >= 50 ? 'Дунд зэрэг' : 'Анхааруулга'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
