'use client';

import * as React from 'react';
import { useAuthSessionReady } from '@/lib/hooks/use-auth-session-ready';
import { asLongId, isValidLongId } from '@/lib/id';
import { getTeacherProfile, updateTeacherProfile } from '@/lib/api/teachers';
import type { TeacherProfile } from '@/types';

type ProfessorDashboardContextValue = {
  profile: TeacherProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateHeaderImage: (headerImageUrl: string | null) => Promise<void>;
};

const ProfessorDashboardContext = React.createContext<ProfessorDashboardContextValue | null>(null);

export function ProfessorDashboardProvider({ children }: { children: React.ReactNode }) {
  const { user, isReady: authReady } = useAuthSessionReady();
  const [profile, setProfile] = React.useState<TeacherProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const hasProfileRef = React.useRef(false);
  const loadedUserNameRef = React.useRef<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!authReady) {
      // Keep current profile while auth is still hydrating; do not clear UI.
      return;
    }

    if (!user?.userName) {
      setProfile(null);
      setLoading(false);
      hasProfileRef.current = false;
      loadedUserNameRef.current = null;
      return;
    }

    if (loadedUserNameRef.current === user.userName && hasProfileRef.current) {
      return;
    }

    if (!hasProfileRef.current) {
      setLoading(true);
    }
    try {
      const next = await getTeacherProfile({ userName: user.userName, forEdit: true });
      setProfile(next);
      hasProfileRef.current = !!next;
      loadedUserNameRef.current = user.userName;
    } finally {
      setLoading(false);
    }
  }, [authReady, user?.userName]);

  React.useEffect(() => {
    if (!authReady) return;
    void refresh();
  }, [authReady, user?.userName, refresh]);

  React.useEffect(() => {
    if (!user?.userName) {
      hasProfileRef.current = false;
      loadedUserNameRef.current = null;
      setProfile(null);
    }
  }, [user?.userName]);

  const updateHeaderImage = React.useCallback(
    async (headerImageUrl: string | null) => {
      const current =
        profile ?? (user?.userName ? await getTeacherProfile({ userName: user.userName, forEdit: true }) : null);

      const userIdRaw = current?.userId ?? user?.id;
      const userId = isValidLongId(asLongId(userIdRaw)) ? asLongId(userIdRaw) : '';
      if (!userId) {
        throw new Error('Missing user id for teacher profile update.');
      }

      await updateTeacherProfile({
        userId: Number(userId),
        shortDescription: current?.shortDescription ?? '',
        longDescription: current?.longDescription ?? '',
        headerImageUrl,
        teachingCategoryId: current?.teachingCategoryId ?? null,
        educations: (current?.educations ?? []).map((e) => ({
          universityName: e.universityName,
          degreeType: e.degreeType,
          degreeImage: e.degreeImage,
        })),
        skills: (current?.skills ?? []).map((s) => ({
          name: s.name,
          rate: s.rate,
        })),
      });
      await refresh();
    },
    [profile, refresh, user?.id, user?.userName]
  );

  const value = React.useMemo(
    () => ({ profile, loading, refresh, updateHeaderImage }),
    [profile, loading, refresh, updateHeaderImage]
  );

  return (
    <ProfessorDashboardContext.Provider value={value}>{children}</ProfessorDashboardContext.Provider>
  );
}

export function useProfessorDashboard(): ProfessorDashboardContextValue {
  const ctx = React.useContext(ProfessorDashboardContext);
  if (!ctx) {
    throw new Error('useProfessorDashboard must be used within ProfessorDashboardProvider');
  }
  return ctx;
}
