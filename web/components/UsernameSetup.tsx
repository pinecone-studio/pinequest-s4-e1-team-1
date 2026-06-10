'use client';

import { useState } from 'react';
import { AtSign, Loader2 } from 'lucide-react';
import { setUsername as apiSetUsername } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function UsernameSetup() {
  const { setUsername } = useAuth();
  const [value, setValue]   = useState('');
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  const valid = /^[a-z0-9_]{3,20}$/.test(value);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiSetUsername(value);
      setUsername(res.username);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-6">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 p-8 w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
            <AtSign size={28} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Username үүсгэх</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Найзуудаа олохын тулд давтагдашгүй username оруулна уу
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none">@</span>
            <input
              type="text"
              value={value}
              onChange={e => { setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setError(''); }}
              placeholder="username"
              maxLength={20}
              className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              autoFocus
            />
          </div>

          <p className="text-xs text-gray-400 dark:text-slate-500 -mt-1">
            3–20 тэмдэгт · зөвхөн a–z, 0–9, _
          </p>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!valid || saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Хадгалж байна...' : 'Үргэлжлүүлэх'}
          </button>
        </form>
      </div>
    </div>
  );
}
