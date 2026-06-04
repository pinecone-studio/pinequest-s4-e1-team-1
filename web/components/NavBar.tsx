'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const tabs = [
  { href: '/', label: 'Бичих', icon: '🎙' },
  { href: '/tasks', label: 'Даалгавар', icon: '✅' },
  { href: '/report', label: 'Тайлан', icon: '📊' },
];

export default function NavBar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between">
        <div className="flex gap-1">
          {tabs.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <span>{icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>
        <button onClick={logout} title={user?.email ?? 'Гарах'}
          className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded transition-colors">
          Гарах
        </button>
      </div>
    </nav>
  );
}
