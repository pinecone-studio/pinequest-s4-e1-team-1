'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from './NavBar';
import UsernameSetup from './UsernameSetup';

const PUBLIC = ['/login', '/landing'];

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading, username } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) router.replace('/landing');
    if (user && isPublic) router.replace('/');
  }, [user, loading, isPublic, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if ((!user && !isPublic) || (user && isPublic)) return null;

  return (
    <>
      {user && <NavBar />}
      {user && !isPublic && username === null && <UsernameSetup />}
      <main className="flex-1 flex flex-col">{children}</main>
    </>
  );
}
