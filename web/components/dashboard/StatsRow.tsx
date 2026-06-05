import { CheckCircle2, Clock, ListTodo, TrendingUp } from "lucide-react";

type Task = { completed: boolean };

export default function StatsRow({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const rate = total ? Math.round((completed / total) * 100) : 0;

  const stats = [
    {
      label: "Нийт даалгавар",
      value: total,
      icon: ListTodo,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Дууссан",
      value: completed,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Хүлээгдэж буй",
      value: pending,
      icon: Clock,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: "Гүйцэтгэлийн хувь",
      value: `${rate}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4"
        >
          <div className={`${bg} ${color} p-3 rounded-lg shrink-0`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
