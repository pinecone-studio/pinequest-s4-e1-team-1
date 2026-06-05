"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, CheckSquare, Calendar, BarChart2,
  LogOut, Bell, Sparkles, Moon, Sun, Clock, X,
} from "lucide-react";
import { useNotifications, formatTimeLeft } from "@/hooks/useNotifications";

const tabs = [
  { href: "/",         label: "Хяналтын самбар", icon: LayoutDashboard },
  { href: "/tasks",    label: "Даалгавар",        icon: CheckSquare },
  { href: "/calendar", label: "Календарь",        icon: Calendar },
  { href: "/insights", label: "Тайлан",           icon: BarChart2 },
];

export default function NavBar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { logout, user } = useAuth();
  const { notifications, dismiss, dismissAll } = useNotifications();

  const [dark, setDark]           = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const dropdownRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setDark(isDark);
  }

  function handleNotifClick(id: string) {
    dismiss(id);
    setShowNotif(false);
    router.push("/tasks");
  }

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-10 px-6 h-16 flex items-center gap-4 shadow-sm relative transition-colors duration-200">

      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="rounded-full bg-indigo-600 w-9 h-9 flex items-center justify-center">
          <Sparkles size={18} color="white" />
        </div>
        <h1 className="font-bold text-lg text-gray-900 dark:text-white">SmartTask AI</h1>
      </div>

      <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 shrink-0" />

      {/* Tabs */}
      <div className="absolute left-1/2 -translate-x-1/2 flex gap-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                active
                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200"
              }`}>
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1">

        {/* Notification bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotif((v) => !v)}
            className="relative p-2 rounded-lg text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  Мэдэгдэл
                  {notifications.length > 0 && (
                    <span className="ml-2 text-xs bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </span>
                {notifications.length > 0 && (
                  <button onClick={dismissAll} className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                    Бүгдийг арилгах
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400 dark:text-slate-500">
                  <Bell size={24} className="opacity-30" />
                  <p className="text-sm">Мэдэгдэл байхгүй</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
                  {notifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <button onClick={() => handleNotifClick(n.id)} className="flex items-start gap-3 flex-1 text-left">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0 mt-0.5">
                          <Clock size={14} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{n.title}</p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                            {formatTimeLeft(n.minutesLeft)}
                          </p>
                        </div>
                      </button>
                      <button onClick={() => dismiss(n.id)} className="text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 transition-colors shrink-0 mt-1">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button onClick={toggleTheme} title={dark ? "Цайлгах горим" : "Харлуулах горим"}
          className="p-2 rounded-lg text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Logout */}
        <button onClick={logout} title={user?.email ?? "Гарах"}
          className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
          <LogOut size={16} />
          <span>Гарах</span>
        </button>
      </div>
    </nav>
  );
}
