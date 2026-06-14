"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Mic,
  Sparkles,
  BarChart2,
  CheckCircle2,
  ArrowRight,
  Brain,
  Zap,
  Calendar,
  Star,
  ChevronRight,
  Rocket,
  Eye,
  Sunrise,
  ListTodo,
  Clock,
  UserPlus,
  Share2,
  Pencil,
  Trash2,
  Bell,
  LayoutDashboard,
  CheckSquare,
  Users,
} from "lucide-react";

/* ─── Spring cursor ────────────────────────────────────────────────────────── */

function useCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -200, y: -200 });
  const pos = useRef({ x: -200, y: -200 });
  const raf = useRef<number>(0);
  const ring = useRef<HTMLDivElement>(null);
  const rpos = useRef({ x: -200, y: -200 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", move);

    const tick = () => {
      const EASE = 0.1,
        EASE_RING = 0.055;
      pos.current.x += (mouse.current.x - pos.current.x) * EASE;
      pos.current.y += (mouse.current.y - pos.current.y) * EASE;
      rpos.current.x += (mouse.current.x - rpos.current.x) * EASE_RING;
      rpos.current.y += (mouse.current.y - rpos.current.y) * EASE_RING;

      if (ref.current)
        ref.current.style.transform = `translate(${pos.current.x - 10}px, ${pos.current.y - 10}px)`;
      if (ring.current)
        ring.current.style.transform = `translate(${rpos.current.x - 20}px, ${rpos.current.y - 20}px)`;

      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return { ref, ring };
}

/* ─── Text scramble ────────────────────────────────────────────────────────── */

const CHARS = "アイウエオカキクケコ#@!%ABCDEFGHあいうえお01234";

function ScrambleText({
  text,
  visible,
  className = "",
}: {
  text: string;
  visible: boolean;
  className?: string;
}) {
  const [out, setOut] = useState(text);
  const started = useRef(false);

  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    let frame = 0;
    const total = 24;
    const tick = () => {
      setOut(
        text
          .split("")
          .map((ch, i) => {
            if (ch === " " || ch === "." || ch === ",") return ch;
            return i < Math.floor((frame / total) * text.length)
              ? ch
              : CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join(""),
      );
      frame++;
      if (frame <= total) requestAnimationFrame(tick);
      else setOut(text);
    };
    const id = setTimeout(() => requestAnimationFrame(tick), 80);
    return () => clearTimeout(id);
  }, [visible, text]);

  return <span className={className}>{out}</span>;
}

/* ─── In-view hook ─────────────────────────────────────────────────────────── */

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVis(true);
      },
      { threshold },
    );
    o.observe(el);
    return () => o.disconnect();
  }, [threshold]);
  return { ref, vis };
}

/* ─── FadeUp wrapper ───────────────────────────────────────────────────────── */

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, vis } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : "translateY(36px)",
        transition: `opacity .75s ease ${delay}ms, transform .75s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── 3-D card tilt ────────────────────────────────────────────────────────── */

function Card3D({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateX(${-y * 11}deg) rotateY(${x * 11}deg) scale(1.025)`;
    el.style.transition = "transform .08s ease";
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(700px) rotateX(0) rotateY(0) scale(1)";
    el.style.transition = "transform .55s cubic-bezier(.22,1,.36,1)";
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transformStyle: "preserve-3d",
        willChange: "transform",
        ...style,
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}

/* ─── Magnetic button ──────────────────────────────────────────────────────── */

function MagBtn({
  children,
  href,
  outline = false,
}: {
  children: ReactNode;
  href: string;
  outline?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    el.style.transition = "transform .1s ease";
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0,0)";
    el.style.transition = "transform .55s cubic-bezier(.22,1,.36,1)";
  };

  const base =
    "group relative inline-flex items-center gap-2 font-bold rounded-2xl px-8 py-4 text-sm overflow-hidden transition-shadow";

  return outline ? (
    <Link
      ref={ref}
      href={href}
      className={`${base} text-white/60 hover:text-white border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/8`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </Link>
  ) : (
    <Link
      ref={ref}
      href={href}
      className={`${base} text-white`}
      style={{ background: "linear-gradient(135deg,#7c3aed 0%,#db2777 100%)" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[.12] transition-opacity" />
      {children}
    </Link>
  );
}

/* ─── Count-up ─────────────────────────────────────────────────────────────── */

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const { ref, vis } = useInView();
  const [n, setN] = useState(0);
  const ran = useRef(false);

  useEffect(() => {
    if (!vis || ran.current) return;
    ran.current = true;
    if (String(to).includes(".")) {
      setN(to);
      return;
    }
    const dur = 1800,
      t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setN(Math.floor(e * to));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [vis, to]);

  return (
    <span ref={ref}>
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─── Dashboard data ───────────────────────────────────────────────────────── */

// Always-visible done tasks
const DONE_TASKS = [
  {
    title: "Уулзалтын тэмдэглэл хийх",
    time: "09:00",
    priority: "High",
    category: "Уулзалт",
  },
  {
    title: "Баг руу тайлан илгээх",
    time: "14:00",
    priority: "High",
    category: "Ажил",
  },
  {
    title: "Кодын review хийх",
    time: "16:00",
    priority: "Medium",
    category: "Ажил",
  },
];

// Animated pending tasks — appear then get completed
const LIVE_TASKS = [
  {
    title: "Спринтийн тайлан бичих",
    time: "18:00",
    priority: "High",
    category: "Ажил",
  },
  {
    title: "Дизайн баг руу хариу өгөх",
    time: "17:00",
    priority: "Medium",
    category: "Хувийн",
  },
];

const WEEKLY = [22, 30, 18, 36, 14, 24, 52];
const WEEK_LABELS = ["Бя", "Ня", "Да", "Мя", "Лх", "Пү", "Ба"];

const UPCOMING = [
  { title: "Дизайн баг руу хариу өгөх", time: "Өнөөдөр 17:00" },
  { title: "Дизайн хариу өгөх", time: "Баасан 15:00" },
  { title: "Команд уулзалт", time: "Бямба 09:00" },
];

const PRIORITY_STYLE: Record<string, string> = {
  High: "bg-red-950/70 text-red-400",
  Medium: "bg-yellow-950/70 text-yellow-400",
  Low: "bg-slate-700/70 text-slate-400",
};
const PRIORITY_MN: Record<string, string> = {
  High: "Өндөр",
  Medium: "Дунд",
  Low: "Бага",
};

/* ─── App preview (dashboard) ──────────────────────────────────────────────── */

const NAV_TABS = [
  { icon: LayoutDashboard, label: "Хяналт", active: true },
  { icon: CheckSquare, label: "Даалгавар", active: false },
  { icon: Calendar, label: "Календарь", active: false },
  { icon: BarChart2, label: "Тайлан", active: false },
  { icon: Users, label: "Найзууд", active: false },
];

function AppPreview() {
  const [shownLive, setShownLive] = useState(0); // how many LIVE_TASKS visible
  const [completedLive, setCompletedLive] = useState<Set<number>>(new Set()); // which ones done

  useEffect(() => {
    const tIds: ReturnType<typeof setTimeout>[] = [];

    const cycle = () => {
      setShownLive(0);
      setCompletedLive(new Set());

      // New tasks appear one by one
      LIVE_TASKS.forEach((_, i) =>
        tIds.push(setTimeout(() => setShownLive(i + 1), 1800 + i * 1600)),
      );

      // Then get completed one by one
      const allShownAt = 1800 + (LIVE_TASKS.length - 1) * 1600 + 1000;
      LIVE_TASKS.forEach((_, i) =>
        tIds.push(
          setTimeout(
            () => setCompletedLive((prev) => new Set([...prev, i])),
            allShownAt + i * 1400,
          ),
        ),
      );
    };

    cycle();
    const CYCLE =
      1800 +
      (LIVE_TASKS.length - 1) * 1600 +
      1000 +
      LIVE_TASKS.length * 1400 +
      2500;
    const id = setInterval(cycle, CYCLE);
    return () => {
      clearInterval(id);
      tIds.forEach(clearTimeout);
    };
  }, []);

  const visibleTasks = [
    ...DONE_TASKS.map((t) => ({ ...t, isDone: true, isNew: false })),
    ...LIVE_TASKS.slice(0, shownLive).map((t, i) => ({
      ...t,
      isDone: completedLive.has(i),
      isNew: true,
    })),
  ];

  const total = DONE_TASKS.length + shownLive;
  const done = DONE_TASKS.length + completedLive.size;
  const pending = total - done;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;
  const circ = 2 * Math.PI * 19;

  const anim = (delay: number): React.CSSProperties => ({
    animation: `fup 0.55s cubic-bezier(.22,1,.36,1) ${delay}ms both`,
  });

  return (
    <Card3D className="relative mt-16 w-full max-w-5xl mx-auto text-left">
      <div
        className="absolute -inset-8 rounded-[40px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(124,58,237,.18) 0%, transparent 70%)",
        }}
      />

      <div
        className="relative rounded-3xl overflow-hidden border border-white/6 flex flex-col"
        style={{
          background: "rgba(13,15,26,.97)",
          backdropFilter: "blur(24px)",
          minHeight: 540,
        }}
      >
        {/* Window chrome */}
        <div
          className="flex items-center gap-2 px-5 py-3 border-b border-white/6 shrink-0"
          style={{ background: "rgba(17,24,39,.97)" }}
        >
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <span className="text-[11px] text-white/25 bg-white/4 rounded-full px-4 py-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              montask.app
            </span>
          </div>
        </div>

        {/* ── NavBar — matches real NavBar dark mode ── */}
        <nav
          className="h-13 flex items-center gap-3 px-4 border-b border-white/6 shrink-0"
          style={{ background: "rgba(17,24,39,.97)", ...anim(0) }}
        >
          {/* Left: logo + Бичих */}
          <div className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo.png"
              alt="MonTask"
              width={24}
              height={24}
              className="rounded-md shrink-0"
            />
            <span className="font-bold text-[13px] text-white hidden sm:block">
              MonTask
            </span>
            <div className="h-4 w-px bg-white/10 mx-0.5 hidden sm:block" />
            <button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-full transition-colors shrink-0">
              <Mic size={10} /> Бичих
            </button>
          </div>

          {/* Center: tabs */}
          <div className="flex-1 flex justify-center items-center gap-0.5">
            {NAV_TABS.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium rounded-full cursor-default transition-colors ${
                  active
                    ? "bg-indigo-950/80 text-indigo-400"
                    : "text-white/35 hover:text-white/60 hover:bg-white/5"
                }`}
              >
                <Icon size={12} />
                <span className="hidden lg:inline">{label}</span>
              </div>
            ))}
          </div>

          {/* Right: Bell + avatar */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white/65 hover:bg-white/5 cursor-default transition-colors">
              <Bell size={14} />
            </div>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}
            >
              С
            </div>
          </div>
        </nav>

        {/* ── Content ── */}
        <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-y-auto">
          <div className="flex flex-col gap-2.5">
            {/* Greeting banner */}
            <div
              className="rounded-xl px-4 py-3 flex items-center justify-between shrink-0"
              style={{
                background:
                  "linear-gradient(135deg,#3730a3 0%,#4f46e5 50%,#6d28d9 100%)",
                ...anim(80),
              }}
            >
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Sunrise size={13} style={{ color: "#fcd34d" }} />
                  <span className="text-[13px] font-black text-white">
                    Өглөөний мэнд!
                  </span>
                </div>
                <p className="text-[10px] text-white/55">
                  Баасан, 6-р сарын 12 · 09:14
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="text-center rounded-lg px-3 py-1.5"
                  style={{ background: "rgba(255,255,255,.15)" }}
                >
                  <div className="text-base font-black text-white leading-none">
                    {done}
                  </div>
                  <div className="text-[8px] text-white/55 mt-0.5">
                    Дуусгасан
                  </div>
                </div>
                <button
                  className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-white"
                  style={{ background: "rgba(255,255,255,.2)" }}
                >
                  + Нэмэх
                </button>
              </div>
            </div>

            {/* Focus bar */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/6"
              style={{
                background: "rgba(26,32,53,.95)",
                borderLeft: "2px solid #7c3aed",
                ...anim(120),
              }}
            >
              <Sparkles
                size={10}
                style={{ color: "#a78bfa" }}
                className="shrink-0"
              />
              <span className="text-[8px] font-black text-violet-400 uppercase tracking-wider shrink-0">
                Фокус
              </span>
              <span className="text-[10px] font-semibold text-white/75 truncate">
                {LIVE_TASKS.find((_, i) => !completedLive.has(i))?.title ??
                  LIVE_TASKS[0].title}
              </span>
            </div>

            {/* Stats 4 cols */}
            <div className="grid grid-cols-4 gap-1.5" style={anim(160)}>
              {[
                {
                  icon: ListTodo,
                  bg: "rgba(99,102,241,.15)",
                  col: "#818cf8",
                  val: total,
                  label: "Нийт",
                  bar: "linear-gradient(90deg,#6366f1,#7c3aed)",
                  pct: 100,
                },
                {
                  icon: CheckCircle2,
                  bg: "rgba(34,197,94,.12)",
                  col: "#4ade80",
                  val: done,
                  label: "Дууссан",
                  bar: "linear-gradient(90deg,#22c55e,#10b981)",
                  pct: total ? (done / total) * 100 : 0,
                },
                {
                  icon: Clock,
                  bg: "rgba(245,158,11,.12)",
                  col: "#fbbf24",
                  val: pending,
                  label: "Хүлээгдэж",
                  bar: "linear-gradient(90deg,#f59e0b,#ef4444)",
                  pct: total ? (pending / total) * 100 : 0,
                },
              ].map(({ icon: Icon, bg, col, val, label, bar, pct }) => (
                <div
                  key={label}
                  className="rounded-lg p-2 border border-white/6 flex flex-col gap-1.5"
                  style={{ background: "rgba(26,32,53,.95)" }}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: bg }}
                    >
                      <Icon size={10} style={{ color: col }} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white leading-none transition-all duration-500">
                        {val}
                      </p>
                      <p className="text-[8px] text-white/35">{label}</p>
                    </div>
                  </div>
                  <div
                    className="h-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,.08)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: bar }}
                    />
                  </div>
                </div>
              ))}
              <div
                className="rounded-lg p-2 border border-white/6 flex items-center gap-1.5"
                style={{ background: "rgba(26,32,53,.95)" }}
              >
                <div className="relative w-9 h-9 shrink-0">
                  <svg className="w-9 h-9 -rotate-90" viewBox="0 0 48 48">
                    <circle
                      cx="24"
                      cy="24"
                      r="19"
                      fill="none"
                      strokeWidth="4"
                      stroke="rgba(139,92,246,.15)"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="19"
                      fill="none"
                      strokeWidth="4"
                      strokeDasharray={`${(rate / 100) * circ} ${circ}`}
                      strokeLinecap="round"
                      stroke="#a855f7"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-[9px] font-black"
                      style={{ color: "#a855f7" }}
                    >
                      {rate}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white/80">
                    Гүйцэтгэл
                  </p>
                  <p className="text-[8px] text-white/35">
                    {done}/{total}
                  </p>
                  <span className="text-[8px] font-bold text-emerald-400">
                    ● Сайн
                  </span>
                </div>
              </div>
            </div>

          </div>{/* /greeting+focus+stats */}

          {/* Tasks · Weekly · Upcoming · AI — нэг flex мөр */}
          <div className="flex gap-2.5 flex-1 min-h-0">

            {/* Task list */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5" style={anim(210)}>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <p className="text-[11px] font-bold text-white/85">
                    Өнөөдрийн даалгаврууд
                  </p>
                  <p className="text-[9px] text-white/30">
                    {done}/{total} гүйцэтгэсэн
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {shownLive > 0 && (
                    <span
                      className="task-appear text-[8px] font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(124,58,237,.18)",
                        color: "#a78bfa",
                      }}
                    >
                      +{shownLive}
                    </span>
                  )}
                  <span
                    className="text-[8px] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      background: "rgba(99,102,241,.15)",
                      color: "#818cf8",
                    }}
                  >
                    {pending} хийгдэх
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {visibleTasks.map((task, idx) => (
                  <div
                    key={task.title + idx}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all duration-500 ${task.isNew ? "task-appear" : ""}`}
                    style={{
                      background: task.isDone
                        ? "rgba(20,26,45,.8)"
                        : "rgba(26,32,53,.95)",
                      borderColor: task.isDone
                        ? "rgba(255,255,255,.04)"
                        : task.isNew
                          ? "rgba(124,58,237,.25)"
                          : "rgba(255,255,255,.07)",
                    }}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full border shrink-0 flex items-center justify-center transition-all duration-400 ${
                        task.isDone
                          ? "border-emerald-500 bg-emerald-500"
                          : task.isNew
                            ? "border-violet-500/60"
                            : "border-white/20"
                      }`}
                      style={
                        task.isDone
                          ? { boxShadow: "0 0 6px rgba(52,211,153,.4)" }
                          : undefined
                      }
                    >
                      {task.isDone && (
                        <CheckCircle2 size={9} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[10px] font-semibold truncate transition-all duration-400 ${
                          task.isDone
                            ? "line-through text-white/25"
                            : task.isNew
                              ? "text-white/90"
                              : "text-white/80"
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="flex items-center gap-0.5 text-[8px] text-white/30 shrink-0">
                          <Clock size={7} />
                          {task.time}
                        </span>
                        <span
                          className="text-[8px] px-1 py-0.5 rounded-full shrink-0"
                          style={{
                            background: "rgba(99,102,241,.12)",
                            color: "#818cf8",
                          }}
                        >
                          {task.category}
                        </span>
                        <span
                          className={`text-[8px] font-bold px-1 py-0.5 rounded-full shrink-0 ${PRIORITY_STYLE[task.priority]}`}
                        >
                          {PRIORITY_MN[task.priority]}
                        </span>
                      </div>
                    </div>
                    {!task.isDone && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          className="w-4 h-4 rounded flex items-center justify-center text-white/25 hover:text-violet-400"
                          style={{ background: "rgba(255,255,255,.04)" }}
                        >
                          <Pencil size={8} />
                        </button>
                        <button
                          className="w-4 h-4 rounded flex items-center justify-center text-white/25 hover:text-red-400"
                          style={{ background: "rgba(255,255,255,.04)" }}
                        >
                          <Trash2 size={8} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Weekly · Upcoming · AI ── */}
            <div className="flex flex-col gap-2.5 w-40 shrink-0" style={anim(250)}>
            {/* Weekly bar chart */}
            <div
              className="rounded-xl p-2.5 border border-white/6"
              style={{ background: "rgba(26,32,53,.95)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-white/70 flex items-center gap-1">
                  <BarChart2 size={11} style={{ color: "#818cf8" }} /> 7
                  хоногийн идэвх
                </span>
                <span className="text-[8px]" style={{ color: "#818cf8" }}>
                  энэ 7 хоног
                </span>
              </div>
              <div className="flex items-end gap-1 h-11">
                {WEEKLY.map((h, i) => {
                  const isToday = i === 6;
                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-0.5 flex-1"
                    >
                      <div
                        className="w-full rounded-t-sm"
                        style={{
                          height: `${(h / 52) * 100}%`,
                          background: isToday
                            ? "linear-gradient(to top,#7c3aed,#818cf8)"
                            : "rgba(99,102,241,.25)",
                          minHeight: 2,
                        }}
                      />
                      <span
                        className="text-[7px]"
                        style={{
                          color: isToday ? "#818cf8" : "rgba(255,255,255,.2)",
                        }}
                      >
                        {WEEK_LABELS[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming */}
            <div
              className="rounded-xl p-2.5 border border-white/6"
              style={{ background: "rgba(26,32,53,.95)" }}
            >
              <div className="flex items-center gap-1 mb-2">
                <Calendar size={11} style={{ color: "#818cf8" }} />
                <span className="text-[10px] font-bold text-white/70">
                  Дараагийн
                </span>
              </div>
              <div className="flex flex-col">
                {UPCOMING.map(({ title, time }, i) => (
                  <div
                    key={title}
                    className="flex items-start gap-1.5 py-1.5 border-b border-white/4 last:border-0 last:pb-0"
                  >
                    <div
                      className="w-3 h-3 rounded-sm flex items-center justify-center text-[7px] font-bold shrink-0 mt-0.5"
                      style={{
                        background: "rgba(124,58,237,.2)",
                        color: "#a78bfa",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-white/65 font-medium truncate">
                        {title}
                      </p>
                      <p className="text-[8px] text-white/28 flex items-center gap-0.5 mt-0.5">
                        <Clock size={6} />
                        {time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI санал */}
            <div
              className="rounded-xl p-2.5 border border-violet-500/20 flex-1"
              style={{ background: "rgba(124,58,237,.08)" }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div
                  className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                  style={{ background: "rgba(124,58,237,.25)" }}
                >
                  <Sparkles size={9} style={{ color: "#a78bfa" }} />
                </div>
                <span className="text-[9px] font-black text-violet-400 uppercase tracking-wider">
                  AI санал
                </span>
              </div>
              <p className="text-[9px] text-white/45 leading-relaxed">
                Өнөөдөр{" "}
                <span className="text-violet-300 font-semibold">{rate}%</span>{" "}
                гүйцэтгэлтэй.{" "}
                {pending > 0
                  ? `${pending} даалгавар хүлээж байна.`
                  : "Бүх даалгавар дууссан!"}
              </p>
            </div>
          </div>{/* /weekly+upcoming+AI column */}
          </div>{/* /flex row: tasks+weekly+upcoming+AI */}
        </div>{/* /outer content */}
      </div>
    </Card3D>
  );
}

/* ─── Feature card with spotlight hover ───────────────────────────────────── */

function FeatCard({
  Icon,
  title,
  desc,
  col,
  delay,
}: {
  Icon: React.ElementType;
  title: string;
  desc: string;
  col: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { ref: fRef, vis } = useInView();
  const mx = useRef(50);
  const my = useRef(50);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.current = ((e.clientX - r.left) / r.width) * 100;
    my.current = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--mx", `${mx.current}%`);
    el.style.setProperty("--my", `${my.current}%`);
    el.style.transform = `perspective(600px) rotateX(${-((e.clientY - r.top) / r.height - 0.5) * 8}deg) rotateY(${((e.clientX - r.left) / r.width - 0.5) * 8}deg) scale(1.03)`;
    el.style.transition = "transform .08s ease";
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(600px) rotateX(0) rotateY(0) scale(1)";
    el.style.transition = "transform .5s cubic-bezier(.22,1,.36,1)";
  };

  return (
    <div
      ref={fRef}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : "translateY(40px)",
        transition: `opacity .7s ease ${delay}ms, transform .7s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      <div
        ref={ref}
        className="sheen relative h-full p-6 rounded-2xl border border-white/5 bg-white/1.5 cursor-default overflow-hidden group"
        style={
          {
            transformStyle: "preserve-3d",
            willChange: "transform",
            "--mx": "50%",
            "--my": "50%",
          } as React.CSSProperties
        }
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        {/* spotlight */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 180px at var(--mx) var(--my), ${col}18, transparent 70%)`,
          }}
        />

        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 shrink-0"
          style={{ background: `${col}20`, boxShadow: `0 0 24px ${col}25` }}
        >
          <Icon size={19} style={{ color: col }} />
        </div>

        <h3 className="font-bold text-white mb-2 text-[15px]">{title}</h3>
        <p className="text-[13px] text-white/38 leading-relaxed">{desc}</p>

        <div
          className="mt-5 h-px"
          style={{ background: `linear-gradient(90deg,${col}50,transparent)` }}
        />
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const { ref: cursorRef, ring: ringRef } = useCursor();
  const [scrolled, setScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const { ref: heroRef, vis: heroVis } = useInView(0.05);

  useEffect(() => {
    let ticking = false;

    const updateHeader = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollYRef.current;
      const scrollDelta = Math.abs(currentScrollY - lastScrollYRef.current);

      if (currentScrollY > 60 && scrollDelta > 2) {
        setHeaderVisible(!isScrollingDown);
      } else if (currentScrollY <= 60) {
        setHeaderVisible(true);
      }

      setScrolled(currentScrollY > 20);
      lastScrollYRef.current = currentScrollY;
      ticking = false;
    };

    const fn = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden select-none"
      style={{ background: "#030309" }}
    >
      {/* ── Custom cursor ─────────────────────────────────────────── */}
      <div
        ref={cursorRef}
        className="custom-cursor fixed top-0 left-0 w-5 h-5 rounded-full pointer-events-none z-9999"
        style={{
          background:
            "radial-gradient(circle, rgba(167,139,250,1) 0%, rgba(167,139,250,.5) 50%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />
      <div
        ref={ringRef}
        className="custom-cursor fixed top-0 left-0 w-10 h-10 rounded-full pointer-events-none z-9998 border border-violet-400/40"
        style={{ mixBlendMode: "screen" }}
      />

      {/* ── Background ────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="aurora-layer aurora-1" />
        <div className="aurora-layer aurora-2" />
        <div className="aurora-layer aurora-3" />
        <div className="aurora-layer aurora-4" />

        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,.07) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
            maskImage:
              "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          }}
        />

        <svg
          className="absolute inset-0 w-full h-full opacity-[.04]"
          aria-hidden
        >
          <filter id="noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>

        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 100% 100% at 50% 0%, transparent 50%, #030309 100%)",
          }}
        />
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 flex items-center justify-center px-4 sm:px-6 h-16 transition-colors duration-300 ${
          scrolled
            ? "bg-[rgba(3,3,9,.6)] backdrop-blur-md border-b border-white/5"
            : "bg-transparent"
        }`}
        style={{
          transform: headerVisible ? "translateY(0)" : "translateY(-100%)",
          transition:
            "transform 500ms cubic-bezier(0.22, 1, 0.36, 1), background-color 300ms ease, border-color 300ms ease",
          willChange: "transform",
        }}
      >
        <div className="w-full max-w-6xl px-4 sm:px-8 flex items-center justify-between">
          <Link
            href="#"
            className="flex items-center gap-2 shrink-0 group/logo"
          >
            <Image
              src="/logo.png"
              alt="MonTask"
              width={32}
              height={32}
              className="rounded-lg shrink-0 transition-all duration-300"
            />
            <span className="font-black text-[16px] tracking-tight text-white hidden sm:inline">
              MonTask
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
            {[
              { label: "Онцлог", href: "#features" },
              { label: "Хэрхэн", href: "#how-it-works" },
              { label: "Үнэлгээ", href: "#testimonials" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className={`text-sm font-medium transition-all duration-300 ${
                  scrolled
                    ? "text-white/60 hover:text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className={`text-sm font-medium transition-all duration-300 hidden sm:block ${
                scrolled
                  ? "text-white/60 hover:text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Нэвтрэх
            </Link>
            <Link
              href="/login"
              className="relative group text-sm font-semibold text-white px-6 py-2 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg,#7c3aed,#db2777)",
              }}
            >
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <span className="relative">Эхлэх</span>
              <ArrowRight
                size={14}
                className="relative group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="flex flex-col items-center text-center px-6 pt-28 pb-4"
        >
          <div
            className={`inline-flex items-center gap-2 text-[11px] font-semibold border border-violet-500/30 bg-violet-500/15 text-violet-300 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm transition-all duration-700 ${heroVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative rounded-full h-2 w-2 bg-violet-400" />
            </span>
            <Sparkles size={11} /> AI-тай бүтээмжтэй ажиллах шинэ боломж
          </div>

          <h1
            className={`text-[clamp(2.8rem,8vw,5.6rem)] font-black leading-[1.02] tracking-tight mb-8 transition-all duration-700 delay-75 ${heroVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
          >
            <span
              style={{ display: "block" }}
              className="text-white drop-shadow-lg"
            >
              <ScrambleText text="Ярьж тэмдэглэ." visible={heroVis} />
            </span>
            <span
              style={{
                display: "block",
                textShadow:
                  "0 0 30px rgba(124,58,237,.3), 0 0 60px rgba(219,39,119,.2)",
              }}
              className="gradient-text drop-shadow-lg"
            >
              <ScrambleText text="AI бүгдийг" visible={heroVis} />
            </span>
            <span
              style={{ display: "block" }}
              className="text-white drop-shadow-lg"
            >
              <ScrambleText text="зохион байгуулна." visible={heroVis} />
            </span>
          </h1>

          <p
            className={`text-[17px] text-white/45 max-w-115 leading-relaxed mb-12 transition-all duration-700 delay-150 ${heroVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            Дуут бичлэгийг өгөхөд даалгавар, хуваарь, тайлан автоматаар үүснэ.
            <br className="hidden sm:block" /> Гараар бичэх шаардлагагүй.
          </p>

          <div
            className={`flex flex-wrap items-center justify-center gap-4 transition-all duration-700 delay-220 ${heroVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <MagBtn href="/login">
              <Rocket size={15} /> Үнэгүй эхлэх
              <ArrowRight
                size={15}
                className="group-hover:translate-x-1 transition-transform"
              />
            </MagBtn>
            <MagBtn href="#preview" outline>
              <Eye size={15} /> Жишээ үзэх
              <ChevronRight size={14} className="opacity-50" />
            </MagBtn>
          </div>

          <div
            className={`flex flex-col items-center gap-4 mt-12 transition-all duration-700 delay-300 ${heroVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
          >
            <div className="flex -space-x-3">
              {(
                ["#7c3aed", "#db2777", "#0ea5e9", "#10b981", "#f59e0b"] as const
              ).map((bg, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full border-2 border-[#030309] flex items-center justify-center text-[11px] font-black text-white shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1 cursor-pointer"
                  style={{
                    background: bg,
                    boxShadow: `0 4px 15px ${bg}40`,
                  }}
                  title={
                    ["Анхзул", "Батболд", "Оюун", "Нямдавай", "Тэмүүлэн"][i]
                  }
                >
                  {["А", "Б", "О", "Н", "Т"][i]}
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-[14px] text-white/40">
                <span className="text-white/80 font-semibold block mb-1">
                  2,400+ хүн
                </span>
                өдөр бүр ашигладаг
              </p>
            </div>
          </div>

          <div
            id="preview"
            className={`w-full max-w-5xl transition-all duration-1000 delay-500 ${heroVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <AppPreview />
          </div>
        </section>

        {/* ── Stats ─────────────────────────────────────────────── */}
        <section className="relative py-24 px-6">
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg,transparent,rgba(124,58,237,.3) 30%,rgba(219,39,119,.3) 70%,transparent)",
            }}
          />
          <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { to: 2400, suffix: "+", label: "Идэвхтэй хэрэглэгч" },
              { to: 98, suffix: "%", label: "Сэтгэл ханамж" },
              { to: 50000, suffix: "+", label: "Хадгалсан даалгавар" },
              { to: 4.9, suffix: "★", label: "Дундаж үнэлгээ" },
            ].map(({ to, suffix, label }, i) => (
              <FadeUp key={label} delay={i * 70}>
                <div className="text-[2.2rem] font-black gradient-text leading-none">
                  <CountUp to={to} suffix={suffix} />
                </div>
                <div className="text-[12px] text-white/28 mt-2.5 font-medium">
                  {label}
                </div>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────── */}
        <section id="features" className="relative py-24 px-6">
          <FadeUp className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold border border-pink-500/20 bg-pink-500/8 text-pink-300 rounded-full px-4 py-1.5 mb-5">
              <Sparkles size={11} /> Онцлог боломжууд
            </div>
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-black tracking-tight mb-3">
              Хэрэгтэй бүх зүйл <span className="gradient-text">нэг дор</span>
            </h2>
            <p className="text-[15px] text-white/30 max-w-sm mx-auto">
              Цаг хугацаагаа хэмнэж, бүтээмжээ нэмэгдүүл
            </p>
          </FadeUp>

          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(
              [
                {
                  Icon: Mic,
                  title: "Дуут бичлэг",
                  desc: "Монгол хэлээр ярьж даалгавраа нэм. AI нэр, огноо, чухал байдлыг ялган таньдаг.",
                  col: "#7c3aed",
                },
                {
                  Icon: Brain,
                  title: "AI боловсруулалт",
                  desc: "Ярианаас даалгавар, хуваарь шууд үүсгэнэ. Гараар бичэх шаардлагагүй.",
                  col: "#db2777",
                },
                {
                  Icon: Calendar,
                  title: "Ухаалаг хуваарь",
                  desc: "Хугацаа, чухал байдал, ангилалаар эрэмбэлэгдсэн хуваарь автоматаар үүснэ.",
                  col: "#0ea5e9",
                },
                {
                  Icon: BarChart2,
                  title: "Гүнзгий шинжилгээ",
                  desc: "Өдөр, 7 хоног, сарын тайлан. AI зөвлөмжтэй гүйцэтгэлийн дүн шинжилгээ.",
                  col: "#10b981",
                },
                {
                  Icon: UserPlus,
                  title: "Найз урих",
                  desc: "Хэрэглэгч хайж найзаа нэм. Найзынхаа хуваарийг харж хамтдаа төлөвлө.",
                  col: "#8b5cf6",
                },
                {
                  Icon: Share2,
                  title: "Даалгавар хуваалцах",
                  desc: "Даалгавраа найздаа шууд илгээ. Хамтарсан ажлыг хялбархан зохицуул.",
                  col: "#06b6d4",
                },
              ] as const
            ).map(({ Icon, title, desc, col }, i) => (
              <FeatCard
                key={title}
                Icon={Icon}
                title={title}
                desc={desc}
                col={col}
                delay={i * 65}
              />
            ))}
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────── */}
        <section id="how-it-works" className="relative py-24 px-6">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124,58,237,.06) 0%, transparent 70%)",
            }}
          />
          <FadeUp className="text-center mb-14">
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-black tracking-tight">
              Хэрхэн <span className="gradient-text">ажилладаг</span> вэ?
            </h2>
          </FadeUp>

          <div className="max-w-125 mx-auto">
            {[
              {
                n: "01",
                title: "Ярь",
                desc: "Микрофон дарж өдрийн хийх зүйлсээ хэл. Монгол хэл бүрэн дэмжигдсэн.",
                Icon: Mic,
                col: "#7c3aed",
              },
              {
                n: "02",
                title: "AI боловсруулна",
                desc: "Яриаг шинжлэн даалгавар, цаг, чухал байдлыг автоматаар тодорхойлно.",
                Icon: Brain,
                col: "#db2777",
              },
              {
                n: "03",
                title: "Зохион байгуулагдана",
                desc: "Даалгаврууд ангилагдаж, хуваарь тохируулагдана. Нэг л дар.",
                Icon: Zap,
                col: "#0ea5e9",
              },
              {
                n: "04",
                title: "Тайлан харна",
                desc: "Гүйцэтгэлийн тайлан, AI зөвлөмж — бүгд автомат, ойлгомжтой.",
                Icon: BarChart2,
                col: "#10b981",
              },
            ].map(({ n, title, desc, Icon, col }, i, arr) => (
              <FadeUp key={n} delay={i * 90}>
                <div className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border border-white/5"
                      style={{ background: `${col}18` }}
                    >
                      <Icon size={17} style={{ color: col }} />
                    </div>
                    {i < arr.length - 1 && (
                      <div
                        className="w-px flex-1 my-2 rounded-full"
                        style={{
                          background: `linear-gradient(to bottom,${col}30,transparent)`,
                          minHeight: 36,
                        }}
                      />
                    )}
                  </div>
                  <div className={i < arr.length - 1 ? "pb-10" : "pb-0"}>
                    <div
                      className="text-[10px] font-black tracking-[.16em] mb-1 uppercase"
                      style={{ color: col }}
                    >
                      {n}
                    </div>
                    <h3 className="font-bold text-white text-[15px] mb-1.5">
                      {title}
                    </h3>
                    <p className="text-[13px] text-white/32 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* ── Testimonials ──────────────────────────────────────── */}
        <section id="testimonials" className="relative py-24 px-6">
          <FadeUp className="text-center mb-14">
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-black tracking-tight">
              Хэрэглэгчид <span className="gradient-text">ямар байна</span>?
            </h2>
          </FadeUp>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: "Батболд",
                role: "Программ хөгжүүлэгч",
                text: "Өдөр бүр 20+ даалгавартай байдаг. MonTask-ийн дараа бүгдийг цаг тухайд нь хийдэг болсон.",
                col: "#7c3aed",
              },
              {
                name: "Анхзул",
                role: "Дизайнер",
                text: "Дуутай бичих функц гайхалтай. Уулзалтын дараа шууд хэлэхэд бүх даалгавар үүснэ.",
                col: "#db2777",
              },
              {
                name: "Тэмүүлэн",
                role: "Бизнесийн зөвлөх",
                text: "Ажлын тайлан автоматаар гарч ирдэг нь хамгийн таалагддаг. Цаг хэмнэлт асар их болсон.",
                col: "#0ea5e9",
              },
            ].map(({ name, role, text, col }, i) => (
              <FadeUp key={name} delay={i * 80}>
                <Card3D className="p-6 rounded-2xl border border-white/5 bg-white/1.5 h-full flex flex-col cursor-default">
                  <div className="flex mb-4 gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        size={13}
                        className="text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-[13px] text-white/42 leading-relaxed flex-1 mb-6">
                    "{text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                      style={{
                        background: `linear-gradient(135deg,${col},${col}88)`,
                      }}
                    >
                      {name[0]}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-white/80">
                        {name}
                      </div>
                      <div className="text-[11px] text-white/28">{role}</div>
                    </div>
                  </div>
                </Card3D>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section className="relative py-28 px-6">
          <FadeUp>
            <div className="max-w-140 mx-auto relative">
              <div
                className="absolute -inset-10 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(124,58,237,.18) 0%, transparent 70%)",
                }}
              />
              <div
                className="relative rounded-3xl overflow-hidden border border-white/6 px-10 py-16 text-center"
                style={{
                  background: "rgba(12,8,28,.8)",
                  backdropFilter: "blur(24px)",
                }}
              >
                <div className="anim-border absolute inset-x-0 top-0 h-[1.5px]" />
                <div className="text-[11px] font-semibold text-violet-300 mb-5 tracking-widest uppercase">
                  <Sparkles size={10} className="inline mr-1" /> Өнөөдрөөс эхэл
                </div>
                <h2 className="text-[clamp(1.8rem,5vw,3rem)] font-black tracking-tight mb-4 leading-tight">
                  Цаг хугацаагаа{" "}
                  <span className="gradient-text">зөв ашиглаарай</span>
                </h2>
                <p className="text-[14px] text-white/30 mb-10 max-w-[320px] mx-auto leading-relaxed">
                  Кредит карт шаардлагагүй. 30 секундэд бүртгүүлж эхэл.
                </p>
                <MagBtn href="/login">
                  Үнэгүй эхлэх
                  <ArrowRight
                    size={15}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </MagBtn>
                <p className="mt-6 text-[11px] text-white/18">
                  Өнөө шөнө 47 хүн нэгдсэн
                </p>
              </div>
            </div>
          </FadeUp>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/4 px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="MonTask"
            width={24}
            height={24}
            className="rounded-lg shrink-0"
          />
          <span className="text-[13px] font-black text-white/38">MonTask</span>
        </div>
        <p className="text-[11px] text-white/18">
          © 2026 MonTask. Бүх эрх хуулиар хамгаалагдсан.
        </p>
        <div className="flex gap-5">
          {["Нууцлал", "Нөхцөл", "Холбоо"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-[11px] text-white/22 hover:text-white/55 transition-colors"
            >
              {item}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
