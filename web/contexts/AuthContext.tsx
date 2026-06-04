'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User, onAuthStateChanged, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, GoogleAuthProvider,
  OAuthProvider, signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

type AuthCtx = {
  user: User | null;
  loading: boolean;
  getToken: () => Promise<string>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return unsub;
  }, []);

  const getToken = async () => {
    if (!user) throw new Error('Not authenticated');
    return user.getIdToken();
  };

  return (
    <AuthContext.Provider value={{
      user, loading, getToken,
      loginWithEmail: (e, p) => signInWithEmailAndPassword(auth, e, p).then(() => {}),
      signupWithEmail: (e, p) => createUserWithEmailAndPassword(auth, e, p).then(() => {}),
      loginWithGoogle: async () => { await signInWithPopup(auth, new GoogleAuthProvider()); },
      loginWithApple: async () => {
        const p = new OAuthProvider('apple.com');
        p.addScope('email'); p.addScope('name');
        await signInWithPopup(auth, p);
      },
      resetPassword: (e) => sendPasswordResetEmail(auth, e),
      logout: () => signOut(auth),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
