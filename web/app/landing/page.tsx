"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import Link from "next/link";
import {
  Mic,
  Sparkles,
  BarChart2,
  CheckCircle2,
  Circle,
  ArrowRight,
  Brain,
  Zap,
  Calendar,
  Shield,
  Star,
  ChevronRight,
  Activity,
  Rocket,
  Eye,
  Sun,
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

/* ─── App preview ──────────────────────────────────────────────────────────── */

const STATIC = [
  { title: "Вэбсайтын дизайн сайжруулах", time: "14:00", done: false },
  { title: "Өглөөний уулзалт", time: "10:30", done: false },
  { title: "Кодын review хийх", time: "16:45", done: true },
  { title: "Баланс хэрхэнгүүлэх", time: "13:15", done: false },
];
const AI_OUT = [
  "Вэбсайтын дизайн сайжруулах",
  "Өглөөний уулзалт",
  "Кодын review хийх",
];

function AppPreview() {
  const [mic, setMic] = useState(false);
  const [aiTasks, setAiTasks] = useState<string[]>([]);

  useEffect(() => {
    const cycle = () => {
      setMic(true);
      setTimeout(() => {
        setMic(false);
        setAiTasks(AI_OUT);
      }, 2400);
      setTimeout(() => setAiTasks([]), 6800);
    };
    const id = setInterval(cycle, 8500);
    return () => clearInterval(id);
  }, []);

  return (
    <Card3D className="relative mt-16 w-full max-w-160 mx-auto">
      <div
        className="absolute -inset-8 rounded-[40px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(124,58,237,.18) 0%, transparent 70%)",
        }}
      />

      <div
        className="relative rounded-3xl overflow-hidden border border-white/[.07]"
        style={{ background: "rgba(8,6,22,.88)", backdropFilter: "blur(24px)" }}
      >
        {/* window chrome */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <span className="text-[11px] text-white/25 bg-white/4 rounded-full px-4 py-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              pinequest.app
            </span>
          </div>
        </div>

        {/* stats bar - Dashboard style */}
        <div className="grid grid-cols-4 divide-x divide-white/8 border-b border-white/8 backdrop-blur-sm">
          {[
            { val: "12", label: "Нийт даалгавар", col: "#a78bfa" },
            { val: "8", label: "Дүүссэн", col: "#34d399" },
            { val: "3", label: "Хүлээгдэж буй", col: "#f59e0b" },
            { val: "87%", label: "Гүйцэтгэл", col: "#f9a8d4" },
          ].map(({ val, label, col }) => (
            <div
              key={label}
              className="px-4 py-5 group/stat cursor-default transition-all duration-300 hover:bg-white/3"
            >
              <div className="text-[10px] text-white/40 font-medium uppercase tracking-wide mb-2">
                {label}
              </div>
              <div
                className="text-2xl font-black transition-transform duration-300 group-hover/stat:scale-110"
                style={{ color: col, textShadow: `0 0 12px ${col}40` }}
              >
                {val}
              </div>
            </div>
          ))}
        </div>

        {/* Header section with greeting */}
        <div className="px-6 pt-5 pb-3 border-b border-white/8">
          <div className="text-[14px] font-semibold text-white mb-1 flex items-center gap-1.5">
            <Sun size={14} className="text-yellow-300" /> Өглөө гов!
          </div>
          <div className="text-[12px] text-white/40">
            Даваа, 6-р сарын 8 • 09:45
          </div>
        </div>

        {/* mic + task list */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl px-4 py-3.5 border border-white/8 hover:border-white/15 transition-all duration-300">
            <div className="relative shrink-0 group/mic">
              {mic && (
                <>
                  <div className="ping-ring absolute inset-0 rounded-full bg-pink-500/30" />
                  <div
                    className="ping-ring absolute inset-0 rounded-full bg-violet-500/20"
                    style={{ animationDelay: "500ms" }}
                  />
                </>
              )}
              <button
                className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg group-hover/mic:shadow-2xl ${mic ? "scale-110" : "scale-100 group-hover/mic:scale-105"}`}
                style={{
                  background: mic
                    ? "linear-gradient(135deg,#db2777,#f59e0b)"
                    : "linear-gradient(135deg,#7c3aed,#db2777)",
                  boxShadow: mic
                    ? "0 0 30px rgba(219,39,119,.4)"
                    : "0 0 20px rgba(124,58,237,.3)",
                }}
              >
                <Mic size={19} color="white" />
              </button>
            </div>

            <div className="flex-1">
              <div className="text-[13px] font-semibold text-white/85">
                {mic ? "Бичиж байна..." : "Дарж ярьж эхэл"}
              </div>
              <div className="text-[11px] text-white/35 mt-0.5">
                AI автоматаар боловсруулна
              </div>
            </div>

            {mic && (
              <div className="flex items-end gap-1 h-7">
                {[4, 7, 5, 9, 3, 8, 5, 6, 4, 7].map((h, i) => (
                  <div
                    key={i}
                    className="wave-bar w-1 rounded-full bg-linear-to-t from-violet-400 to-pink-400"
                    style={{ height: h * 2.5, animationDelay: `${i * 60}ms` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Tasks section header */}
          <div className="flex items-center justify-between mt-2">
            <div className="text-[13px] font-semibold text-white/90">
              Өнөөдрийн даалгаврууд
            </div>
            <div className="text-[11px] text-white/30">
              {aiTasks.length > 0
                ? `${aiTasks.length} даалгавар`
                : `${STATIC.length} даалгавар`}
            </div>
          </div>

          <div className="space-y-2 mt-3">
            {aiTasks.length > 0
              ? aiTasks.map((t, i) => (
                  <div
                    key={t}
                    className="task-appear flex items-center gap-3 px-4 py-3 rounded-xl border border-violet-500/30 bg-violet-500/8 hover:bg-violet-500/12 transition-all duration-300 group/task cursor-default"
                    style={{ animationDelay: `${i * 110}ms` }}
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-violet-400/60 flex items-center justify-center shrink-0 group-hover/task:border-violet-400 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    </div>
                    <span className="text-[13px] text-white/70 group-hover/task:text-white/90 transition-colors font-medium flex-1">
                      {t}
                    </span>
                  </div>
                ))
              : STATIC.map(({ title, time, done }) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/15 transition-all duration-300 group/task cursor-default"
                  >
                    {done ? (
                      <CheckCircle2
                        size={16}
                        className="text-emerald-400 shrink-0 group-hover/task:text-emerald-300 transition-colors"
                      />
                    ) : (
                      <Circle
                        size={16}
                        className="text-white/30 shrink-0 group-hover/task:text-white/40 transition-colors"
                      />
                    )}
                    <span
                      className={`flex-1 text-[13px] transition-all duration-300 ${done ? "line-through text-white/25 group-hover/task:text-white/35" : "text-white/60 group-hover/task:text-white/75"}`}
                    >
                      {title}
                    </span>
                    <span className="text-[11px] text-white/25 shrink-0 group-hover/task:text-white/35 transition-colors">
                      {time}
                    </span>
                  </div>
                ))}
          </div>
        </div>
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

      // Show/hide header based on scroll direction (with minimum scroll delta to avoid flickering)
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

        {/* dot grid */}
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

        {/* noise */}
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

        {/* vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 100% 100% at 50% 0%, transparent 50%, #030309 100%)",
          }}
        />
      </div>

      {/* ── Nav ─ Apple Style ───────────────────────────────────────── */}
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
        {/* Max width container for Apple-like design */}
        <div className="w-full max-w-6xl px-4 sm:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="#"
            className="flex items-center gap-2 shrink-0 group/logo"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300"
              style={{
                background: "linear-gradient(135deg,#7c3aed,#db2777)",
              }}
            >
              <Activity size={16} color="white" />
            </div>
            <span className="font-black text-[16px] tracking-tight text-white hidden sm:inline">
              MonTask
            </span>
          </Link>

          {/* Center Navigation - Apple Style */}
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

          {/* Right Side - CTA */}
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
          {/* Premium badge */}
          <div
            className={`inline-flex items-center gap-2 text-[11px] font-semibold border border-violet-500/30 bg-violet-500/15 text-violet-300 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm transition-all duration-700 ${heroVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative rounded-full h-2 w-2 bg-violet-400" />
            </span>
            <Sparkles size={11} /> AI-тай бүтээмжтэй ажиллах шинэ арга
          </div>

          {/* Main heading with gradient effect */}
          <h1
            className={`text-[clamp(2.8rem,8vw,5.6rem)] font-black leading-[1.02] tracking-tight mb-8 transition-all duration-700 delay-75 ${heroVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
          >
            <span className="block text-white drop-shadow-lg">
              <ScrambleText text="Ярьж тэмдэглэ." visible={heroVis} />
            </span>
            <span
              className="block gradient-text drop-shadow-lg"
              style={{
                textShadow:
                  "0 0 30px rgba(124,58,237,.3), 0 0 60px rgba(219,39,119,.2)",
              }}
            >
              <ScrambleText text="AI бүгдийг" visible={heroVis} />
            </span>
            <span className="block text-white drop-shadow-lg">
              <ScrambleText text="зохион байгуулна." visible={heroVis} />
            </span>
          </h1>

          {/* Subtitle with enhanced styling */}
          <p
            className={`text-[17px] text-white/45 max-w-115 leading-relaxed mb-12 transition-all duration-700 delay-150 ${heroVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            Дуут бичлэгийг өгөхөд даалгавар, хуваарь, тайлан автоматаар үүснэ.
            <br className="hidden sm:block" /> Гар бичгийн хэрэг байхгүй.
          </p>

          {/* CTA Buttons */}
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
            <MagBtn href="#features" outline>
              <Eye size={15} /> Жишээ үзэх
              <ChevronRight size={14} className="opacity-50" />
            </MagBtn>
          </div>

          {/* User testimonial section */}
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
            className={`w-full max-w-160 transition-all duration-1000 delay-500 ${heroVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
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
              Цаг хугацаа хэмнэж, бүтээмжийг нэмэгдүүл
            </p>
          </FadeUp>

          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(
              [
                {
                  Icon: Mic,
                  title: "Дуут бичлэг",
                  desc: "Байгалийн хэлээр ярь. AI нэр, огноо, чухал байдлыг ялган таньдаг.",
                  col: "#7c3aed",
                },
                {
                  Icon: Brain,
                  title: "AI боловсруулалт",
                  desc: "Ярианаас даалгавар, хуваарь шууд үүсгэнэ. GPT-4 хүч чадал.",
                  col: "#db2777",
                },
                {
                  Icon: Calendar,
                  title: "Ухаалаг хуваарь",
                  desc: "Давтагдах үйл явдал, автомат сануулга, цагийн мэдрэмжтэй.",
                  col: "#0ea5e9",
                },
                {
                  Icon: BarChart2,
                  title: "Гүнзгий шинжилгээ",
                  desc: "Өдөр, 7 хоног, сарын тайлан. Ажлын болон хувийн амжилт.",
                  col: "#10b981",
                },
                {
                  Icon: Zap,
                  title: "Шуурхай үйлдэл",
                  desc: "Дуу бичиж дуусмагц 3 секундэд даалгавар үүснэ. Цаг алдахгүй.",
                  col: "#f59e0b",
                },
                {
                  Icon: Shield,
                  title: "Бүрэн хамгаалалт",
                  desc: "End-to-end шифрлэлт. Хэн ч таны өгөгдөлд хандах боломжгүй.",
                  col: "#ec4899",
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
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}
          >
            <Activity size={11} color="white" />
          </div>
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
