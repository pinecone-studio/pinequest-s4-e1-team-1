'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User, onAuthStateChanged, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, GoogleAuthProvider,
  OAuthProvider, signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getMe } from '@/lib/api';

type AuthCtx = {
  user: User | null;
  loading: boolean;
  username: string | null;
  setUsername: (u: string) => void;
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
  const [user, setUser]         = useState<User | null>(null);
  const [loading, setLoading]   = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const me = await getMe();
          setUsername(me.username);
        } catch {
          setUsername(null);
        }
      } else {
        setUsername(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const getToken = async () => {
    if (!user) throw new Error('Not authenticated');
    return user.getIdToken();
  };

  return (
    <AuthContext.Provider value={{
      user, loading, username, setUsername, getToken,
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
