'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api/client';
import { getStudentProfile, updateStudentProfile, type StudentProfile } from '@/lib/api/students';

type StudentDashboardContextValue = {
  profile: StudentProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateHeaderImage: (headerImageUrl: string | null) => Promise<void>;
};

const StudentDashboardContext = React.createContext<StudentDashboardContextValue | null>(null);

export function StudentDashboardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<StudentProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const hasProfileRef = React.useRef(false);
  const refreshIdRef = React.useRef(0);

  const refresh = React.useCallback(async () => {
    const requestId = ++refreshIdRef.current;
    if (!user?.userName && !user?.id) {
      setProfile(null);
      setLoading(false);
      hasProfileRef.current = false;
      return;
    }
    if (!hasProfileRef.current) {
      setLoading(true);
    }
    try {
      const next = await getStudentProfile({
        userName: user?.userName ?? undefined,
        userId: user?.id ? Number(user.id) : undefined,
      });
      if (requestId !== refreshIdRef.current) return; // stale — user logged out/in meanwhile
      setProfile(next);
      hasProfileRef.current = !!next;
    } catch (error) {
      // Logging out (401) or a transient network failure must never crash the page.
      if (requestId !== refreshIdRef.current) return;
      setProfile(null);
      hasProfileRef.current = false;
      if (error instanceof ApiError && error.status !== 401 && error.status !== 403) {
        console.error('Student profile refresh failed', error);
      }
    } finally {
      if (requestId === refreshIdRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id, user?.userName]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateHeaderImage = React.useCallback(
    async (headerImageUrl: string | null) => {
      const current =
        profile ??
        (user?.userName || user?.id
          ? await getStudentProfile({
              userName: user?.userName ?? undefined,
              userId: user?.id ? Number(user.id) : undefined,
            })
          : null);

      const userId = current?.userId || (user?.id ? Number(user.id) : NaN);
      if (!userId || Number.isNaN(userId)) {
        throw new Error('Missing user id for student profile update.');
      }

      await updateStudentProfile({ userId, headerImageUrl });
      await refresh();
    },
    [profile, refresh, user?.id, user?.userName]
  );

  const value = React.useMemo(
    () => ({ profile, loading, refresh, updateHeaderImage }),
    [profile, loading, refresh, updateHeaderImage]
  );

  return <StudentDashboardContext.Provider value={value}>{children}</StudentDashboardContext.Provider>;
}

export function useStudentDashboard(): StudentDashboardContextValue {
  const ctx = React.useContext(StudentDashboardContext);
  if (!ctx) {
    throw new Error('useStudentDashboard must be used within StudentDashboardProvider');
  }
  return ctx;
}
