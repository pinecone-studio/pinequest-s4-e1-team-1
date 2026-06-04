'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type Mode = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
  const { loginWithEmail, signupWithEmail, loginWithGoogle, loginWithApple, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setInfo(''); setLoading(true);
    try {
      if (mode === 'login') await loginWithEmail(email, password);
      else if (mode === 'signup') await signupWithEmail(email, password);
      else { await resetPassword(email); setInfo('Нууц үг сэргээх линк илгээлээ.'); }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Алдаа гарлаа.';
      setError(msg.replace('Firebase: ', '').replace(/\s*\(auth\/.*\)/, ''));
    } finally { setLoading(false); }
  };

  const handleSocial = async (fn: () => Promise<void>) => {
    setError(''); setLoading(true);
    try { await fn(); }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Алдаа гарлаа.';
      setError(msg.replace('Firebase: ', '').replace(/\s*\(auth\/.*\)/, ''));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Товч</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {mode === 'login' ? 'Нэвтрэх' : mode === 'signup' ? 'Бүртгүүлэх' : 'Нууц үг сэргээх'}
          </p>
        </div>

        {mode !== 'forgot' && (
          <div className="flex flex-col gap-3 mb-6">
            <button onClick={() => handleSocial(loginWithGoogle)} disabled={loading}
              className="flex items-center justify-center gap-3 w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google-аар нэвтрэх
            </button>

            <button onClick={() => handleSocial(loginWithApple)} disabled={loading}
              className="flex items-center justify-center gap-3 w-full bg-black rounded-xl px-4 py-3 text-sm font-medium text-white hover:bg-gray-900 transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="white" viewBox="0 0 814 1000">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4C46 411.8 6 332.7 6 257.4c0-136.4 88.8-208.6 175.5-208.6 46.7 0 101.9 31.9 135.5 31.9 32.2 0 97.2-34.4 148.4-34.4 28.7-.1 108.2 2.9 168.9 91.3z"/>
                <path d="M554.1 54.3c25.7-30.4 43.9-72.3 43.9-114.2 0-5.8-.6-11.6-1.6-16.5-41.5 1.6-89.9 28.7-120.2 63.8-23.2 26.2-45.3 68.8-45.3 111.6 0 6.4 1 12.8 1.6 14.9 2.9.6 7.7 1.3 12.6 1.3 37.6 0 84.1-26.2 109-60.9z"/>
              </svg>
              Apple-аар нэвтрэх
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">эсвэл</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="email" placeholder="И-мэйл" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
          {mode !== 'forgot' && (
            <input type="password" placeholder="Нууц үг" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
          )}
          {error && <p className="text-red-600 text-xs">{error}</p>}
          {info && <p className="text-green-600 text-xs">{info}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold rounded-xl px-4 py-3 text-sm transition-colors">
            {loading ? 'Түр хүлээнэ үү...' : mode === 'login' ? 'Нэвтрэх' : mode === 'signup' ? 'Бүртгүүлэх' : 'Линк илгээх'}
          </button>
        </form>

        <div className="flex flex-col items-center gap-2 mt-5 text-sm text-gray-500">
          {mode === 'login' && <>
            <button onClick={() => setMode('signup')} className="hover:text-indigo-600">Бүртгэл үүсгэх</button>
            <button onClick={() => setMode('forgot')} className="hover:text-indigo-600">Нууц үг мартсан?</button>
          </>}
          {(mode === 'signup' || mode === 'forgot') &&
            <button onClick={() => setMode('login')} className="hover:text-indigo-600">← Нэвтрэх</button>}
        </div>
      </div>
    </div>
  );
}
