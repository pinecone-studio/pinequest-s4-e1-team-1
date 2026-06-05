"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart2,
  LogOut,
  Bell,
  Sparkles,
} from "lucide-react";

const tabs = [
  { href: "/", label: "Хяналтын самбар", icon: LayoutDashboard },
  { href: "/tasks", label: "Даалгавар", icon: CheckSquare },
  { href: "/report", label: "Календарь", icon: Calendar },
  { href: "/insights", label: "Тайлан", icon: BarChart2 },
];

export default function NavBar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-10 px-6 h-16 flex items-center gap-4 shadow-sm relative">
      <div className="flex items-center gap-2 shrink-0">
        <div className="rounded-full bg-indigo-600 w-9 h-9 flex items-center justify-center">
          <Sparkles size={18} color="white" />
        </div>
        <h1 className="font-bold text-lg text-gray-900">SmartTask AI</h1>
      </div>

      <div className="h-6 w-px bg-gray-200 shrink-0" />

      <div className="absolute left-1/2 -translate-x-1/2 flex gap-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell size={18} />
        </button>
        <button
          onClick={logout}
          title={user?.email ?? "Гарах"}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          <span>Гарах</span>
        </button>
      </div>
    </nav>
  );
}
