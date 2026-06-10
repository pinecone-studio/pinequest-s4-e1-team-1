"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart2,
  Users,
  Bell,
  Moon,
  Sun,
  Clock,
  X,
  LogOut,
  CalendarDays,
  Mic,
  Activity,
} from "lucide-react";
import { useNotifications, formatTimeLeft } from "@/hooks/useNotifications";
import { acceptFriendRequest, rejectFriendRequest } from "@/lib/api";
import RecordOverlay from "@/components/RecordOverlay";

const tabs = [
  { href: "/", label: "Хяналтын самбар", icon: LayoutDashboard },
  { href: "/tasks", label: "Даалгавар", icon: CheckSquare },
  { href: "/calendar", label: "Календарь", icon: Calendar },
  { href: "/insights", label: "Тайлан", icon: BarChart2 },
  { href: "/friends", label: "Найзууд", icon: Users },
];

function getInitials(user: {
  displayName?: string | null;
  email?: string | null;
}) {
  if (user.displayName) return user.displayName.slice(0, 2).toUpperCase();
  if (user.email) return user.email.slice(0, 2).toUpperCase();
  return "?";
}

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, username } = useAuth();
  const { notifications, dismiss, dismissAll } = useNotifications();

  const [dark, setDark] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showRecord, setShowRecord] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotif(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node))
        setShowAccount(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleTheme() {
    const isDark = !dark;
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setDark(isDark);
  }

  function handleNotifClick(id: string) {
    dismiss(id);
    setShowNotif(false);
    router.push("/tasks");
  }

  async function handleAcceptFriend(requestId: string, notifId: string) {
    await acceptFriendRequest(requestId);
    dismiss(notifId);
  }

  async function handleRejectFriend(requestId: string, notifId: string) {
    await rejectFriendRequest(requestId);
    dismiss(notifId);
  }

  const createdAt = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("mn-MN")
    : null;

  return (
    <>
      {showRecord && <RecordOverlay onClose={() => setShowRecord(false)} />}

      <nav className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-10 px-5 h-14 grid grid-cols-[auto_1fr_auto] items-center gap-3 transition-colors duration-200">
        {/* Left: logo + record */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="rounded-lg w-7 h-7 flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}>
            <Activity size={14} color="white" />
          </div>
          <h1 className="font-medium text-sm text-gray-900 dark:text-white hidden sm:block">
            MonTask
          </h1>
          <div className="h-5 w-px bg-gray-200 dark:bg-slate-700 mx-1 hidden sm:block" />
          <button
            onClick={() => setShowRecord(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors shrink-0"
          >
            <Mic size={12} />
            <span className="hidden sm:inline">Бичих</span>
          </button>
        </div>

        {/* Center: tabs */}
        <div className="flex justify-center items-center gap-0.5">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200"
                }`}
              >
                <Icon size={14} />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Notification */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotif((v) => !v);
                setShowAccount(false);
              }}
              className="relative p-2 rounded-lg text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell size={16} />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    Мэдэгдэл
                    {notifications.length > 0 && (
                      <span className="ml-2 text-xs bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </span>
                  {notifications.length > 0 && (
                    <button
                      onClick={dismissAll}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                    >
                      Бүгдийг арилгах
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400 dark:text-slate-500">
                    <Bell size={22} className="opacity-30" />
                    <p className="text-sm">Мэдэгдэл байхгүй</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
                    {notifications.map((n) => {
                      if (n.type === 'friend_request') {
                        return (
                          <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                              {n.fromUsername[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-slate-100">
                                @{n.fromUsername}
                              </p>
                              <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5 mb-2">
                                Найзын хүсэлт илгээлээ
                              </p>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleAcceptFriend(n.requestId, n.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                                >
                                  Зөвшөөрөх
                                </button>
                                <button
                                  onClick={() => handleRejectFriend(n.requestId, n.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                                >
                                  Татгалзах
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => dismiss(n.id)}
                              className="text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 shrink-0 mt-1 transition-colors"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                          <button
                            onClick={() => handleNotifClick(n.id)}
                            className="flex items-start gap-3 flex-1 text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0 mt-0.5">
                              <Clock size={13} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">
                                {n.title}
                              </p>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                {formatTimeLeft(n.minutesLeft)}
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={() => dismiss(n.id)}
                            className="text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 shrink-0 mt-1 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Account */}
          <div className="relative" ref={accountRef}>
            <button
              onClick={() => {
                setShowAccount((v) => !v);
                setShowNotif(false);
              }}
              className="flex items-center px-1.5 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium shrink-0">
                {user ? getInitials(user) : "?"}
              </div>
            </button>

            {showAccount && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden z-50">
                <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm shrink-0">
                    {user ? getInitials(user) : "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {username || user?.displayName || "Хэрэглэгч"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 flex flex-col gap-2.5 border-b border-gray-100 dark:border-slate-700">
                  <div className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-slate-400">
                    <CalendarDays
                      size={13}
                      className="text-indigo-400 shrink-0"
                    />
                    <span>Бүртгэлийн огноо:</span>
                    <span className="font-medium text-gray-700 dark:text-slate-200">
                      {createdAt ?? "—"}
                    </span>
                  </div>
                </div>

                <div className="p-3">
                  <button
                    onClick={() => {
                      setShowAccount(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 text-sm font-medium transition-colors"
                  >
                    <LogOut size={14} />
                    Гарах
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
