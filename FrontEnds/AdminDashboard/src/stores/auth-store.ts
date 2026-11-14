/**
 * استور واحد احراز هویت — بدون persist؛ منبع حقیقت فقط API و کوکی است.
 */

import { create } from 'zustand';
import type { AuthUser } from '@/lib/auth/types';

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  /** True only after `/User/get-user` (or login) succeeded — not from stale session hint alone. */
  sessionVerified: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (v: boolean) => void;
  setSessionVerified: (v: boolean) => void;
  /** Full store reset (avoid on logout — re-triggers session verify). */
  reset: () => void;
  /** Clears user/session without re-running bootstrap (use on logout). */
  clearSession: () => void;
};

const initialState = {
  user: null as AuthUser | null,
  loading: true,
  initialized: false,
  sessionVerified: false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  setSessionVerified: (sessionVerified) => set({ sessionVerified }),
  reset: () => set(initialState),
  clearSession: () =>
    set({
      user: null,
      loading: false,
      initialized: true,
      sessionVerified: false,
    }),
}));
