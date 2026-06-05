import { BackendTask } from '@/lib/api';

const MN_DAYS = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'];

const PRIORITY_DOT: Record<string, string> = {
  high:   'bg-red-400',
  medium: 'bg-amber-400',
  low:    'bg-blue-400',
};

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getCalendarDays(year: number, month: number) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const days: { date: Date; current: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--)
    days.push({ date: new Date(year, month - 1, daysInPrev - i), current: false });
  for (let i = 1; i <= daysInMonth; i++)
    days.push({ date: new Date(year, month, i), current: true });
  for (let i = 1; i <= 42 - days.length; i++)
    days.push({ date: new Date(year, month + 1, i), current: false });

  return days;
}

export default function CalendarGrid({ tasks, selectedDate, year, month, onSelectDate }: {
  tasks: BackendTask[];
  selectedDate: string;
  year: number;
  month: number;
  onSelectDate: (date: string) => void;
}) {
  const today = toISO(new Date());
  const days  = getCalendarDays(year, month);

  const tasksByDate: Record<string, BackendTask[]> = {};
  tasks.forEach((t) => {
    if (!t.due) return;
    const key = t.due.slice(0, 10);
    tasksByDate[key] = [...(tasksByDate[key] ?? []), t];
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
      <div className="grid grid-cols-7 mb-1">
        {MN_DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 dark:text-slate-500 py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, current }) => {
          const iso        = toISO(date);
          const isToday    = iso === today;
          const isSelected = iso === selectedDate;
          const dayTasks   = tasksByDate[iso] ?? [];

          return (
            <button
              key={iso}
              onClick={() => onSelectDate(iso)}
              className={`flex flex-col items-center py-2 px-1 rounded-xl transition-colors min-h-[52px] ${
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : isToday
                  ? 'border-2 border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950'
                  : current
                  ? 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200'
                  : 'text-gray-300 dark:text-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <span className="text-sm font-medium leading-none">{date.getDate()}</span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center">
                  {dayTasks.slice(0, 3).map((t, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[t.priority] ?? 'bg-gray-400'} ${isSelected ? 'ring-1 ring-white/40' : ''}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
