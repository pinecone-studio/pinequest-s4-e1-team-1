import { CheckCircle2, Circle, Clock, Flag } from "lucide-react";

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  time: string;
  priority: "High" | "Medium";
  category: string;
  completed: boolean;
};

const priorityStyles: Record<Task["priority"], string> = {
  High: "bg-red-50 text-red-600",
  Medium: "bg-yellow-50 text-yellow-600",
};

const priorityLabels: Record<Task["priority"], string> = {
  High: "Өндөр",
  Medium: "Дунд",
};

function TaskCard({
  task,
  onToggle,
}: {
  task: Task;
  onToggle?: (id: string, completed: boolean) => void;
}) {
  return (
    <div
      className={`flex gap-3 p-4 rounded-xl border transition-colors ${
        task.completed
          ? "border-gray-100 bg-gray-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <button
        onClick={() => onToggle?.(task.id, !task.completed)}
        className="shrink-0 mt-0.5 cursor-pointer"
      >
        {task.completed ? (
          <CheckCircle2 size={20} className="text-green-500" />
        ) : (
          <Circle
            size={20}
            className="text-gray-300 hover:text-indigo-400 transition-colors"
          />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            task.completed ? "line-through text-gray-400" : "text-gray-800"
          }`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            <Clock size={11} />
            {task.time}
          </span>
          <span
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${priorityStyles[task.priority]}`}
          >
            <Flag size={11} />
            {priorityLabels[task.priority]}
          </span>
          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            {task.category}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TodaySection({
  tasks,
  onToggle,
}: {
  tasks: Task[];
  onToggle?: (id: string, completed: boolean) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-gray-900 text-lg">Өнөөдөр</h2>
        <span className="text-xs font-medium bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full">
          {tasks.length} төлөвлөгдсөн
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}
