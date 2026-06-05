import { Calendar, Clock, Sparkles } from "lucide-react";

export type UpcomingTask = {
  id: string;
  title: string;
  datetime: string;
};

function UpcomingCard({ upcoming }: { upcoming: UpcomingTask[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} className="text-indigo-600" />
        <h2 className="font-bold text-gray-900">Дараагийн</h2>
      </div>
      <div className="flex flex-col gap-3">
        {upcoming.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {item.title}
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <Clock size={10} />
                {item.datetime}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIInsightCard({ summary, loading }: { summary: string; loading: boolean }) {
  return (
    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={18} />
        <span className="text-sm font-semibold opacity-90">AI Санал</span>
      </div>
      {loading ? (
        <div className="flex flex-col gap-2 animate-pulse">
          <div className="h-3 bg-white/20 rounded-full w-full" />
          <div className="h-3 bg-white/20 rounded-full w-4/5" />
          <div className="h-3 bg-white/20 rounded-full w-3/5 mt-1" />
        </div>
      ) : summary ? (
        <p className="text-sm leading-relaxed opacity-90">{summary}</p>
      ) : (
        <p className="text-sm opacity-60">Өнөөдөр бичлэг байхгүй байна.</p>
      )}
    </div>
  );
}

export default function SidePanel({
  upcoming,
  insight,
  insightLoading,
}: {
  upcoming: UpcomingTask[];
  insight: string;
  insightLoading: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <UpcomingCard upcoming={upcoming} />
      <AIInsightCard summary={insight} loading={insightLoading} />
    </div>
  );
}
