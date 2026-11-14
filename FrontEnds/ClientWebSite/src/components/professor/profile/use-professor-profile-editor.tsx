'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  getTeacherProfile,
  getTeachingCategories,
  updateTeacherProfile,
  type TeacherEducationInput,
  type TeacherSkillInput,
} from '@/lib/api/teachers';
import type { TeacherProfile } from '@/types';
import type { CurrentUser } from '@/lib/api/account';

export type SavedEducation = TeacherEducationInput & { id: string };

export type SavedSkill = TeacherSkillInput & { id: string };

type ProfessorProfileEditorContextValue = {
  user: CurrentUser | null;
  profile: TeacherProfile | null;
  categories: Array<{ id: number; name: string }>;
  loading: boolean;
  saving: boolean;
  loadProfile: () => Promise<TeacherProfile | null>;
  persistProfile: (options: {
    educations?: TeacherEducationInput[];
    skills?: TeacherSkillInput[];
    longDescription?: string;
    shortDescription?: string;
    teachingCategoryId?: number | null;
  }) => Promise<void>;
  mapEducations: (items: TeacherProfile['educations'] | undefined) => SavedEducation[];
  mapSkills: (items: TeacherProfile['skills'] | undefined) => SavedSkill[];
  refetchAuth: () => Promise<void>;
};

const ProfessorProfileEditorContext = React.createContext<ProfessorProfileEditorContextValue | null>(null);

function useProfessorProfileEditorState() {
  const { user, refetch } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [profile, setProfile] = React.useState<TeacherProfile | null>(null);
  const [categories, setCategories] = React.useState<Array<{ id: number; name: string }>>([]);

  const loadProfile = React.useCallback(async () => {
    if (!user?.userName) {
      setProfile(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    try {
      const [nextProfile, categoryList] = await Promise.all([
        getTeacherProfile({ userName: user.userName, forEdit: true }),
        getTeachingCategories(),
      ]);
      setProfile(nextProfile);
      setCategories(categoryList);
      return nextProfile;
    } finally {
      setLoading(false);
    }
  }, [user?.userName]);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const persistProfile = React.useCallback(
    async (options: {
      educations?: TeacherEducationInput[];
      skills?: TeacherSkillInput[];
      longDescription?: string;
      shortDescription?: string;
      teachingCategoryId?: number | null;
    }) => {
      const userId = profile?.userId || Number(user?.id);
      if (!userId || Number.isNaN(userId)) {
        throw new Error('Missing user id for profile update.');
      }

      const current =
        profile ?? (user?.userName ? await getTeacherProfile({ userName: user.userName, forEdit: true }) : null);

      setSaving(true);
      try {
        await updateTeacherProfile({
          userId,
          shortDescription: options.shortDescription ?? current?.shortDescription ?? '',
          longDescription: options.longDescription ?? current?.longDescription ?? '',
          headerImageUrl: current?.headerImageUrl ?? null,
          teachingCategoryId:
            options.teachingCategoryId !== undefined
              ? options.teachingCategoryId
              : current?.teachingCategoryId ?? null,
          educations:
            options.educations ??
            (current?.educations ?? []).map((e) => ({
              universityName: e.universityName,
              degreeType: e.degreeType,
              degreeImage: e.degreeImage,
            })),
          skills:
            options.skills ??
            (current?.skills ?? []).map((s) => ({
              name: s.name,
              rate: s.rate,
            })),
        });
        await loadProfile();
        await refetch();
      } finally {
        setSaving(false);
      }
    },
    [loadProfile, profile, refetch, user?.id, user?.userName]
  );

  const mapEducations = React.useCallback((items: TeacherProfile['educations'] | undefined): SavedEducation[] => {
    return (items ?? []).map((e, index) => ({
      id: String(e.id || index + 1),
      universityName: e.universityName,
      degreeType: e.degreeType || 'bachelors',
      degreeImage: e.degreeImage ?? '',
    }));
  }, []);

  const mapSkills = React.useCallback((items: TeacherProfile['skills'] | undefined): SavedSkill[] => {
    return (items ?? []).map((s, index) => ({
      id: String(s.id || index + 1),
      name: s.name,
      rate: s.rate,
    }));
  }, []);

  return {
    user,
    profile,
    categories,
    loading,
    saving,
    loadProfile,
    persistProfile,
    mapEducations,
    mapSkills,
    refetchAuth: refetch,
  };
}

export function ProfessorProfileEditorProvider({ children }: { children: React.ReactNode }) {
  const value = useProfessorProfileEditorState();
  return (
    <ProfessorProfileEditorContext.Provider value={value}>{children}</ProfessorProfileEditorContext.Provider>
  );
}

export function useProfessorProfileEditor() {
  const ctx = React.useContext(ProfessorProfileEditorContext);
  if (!ctx) {
    throw new Error('useProfessorProfileEditor must be used within ProfessorProfileEditorProvider');
  }
  return ctx;
}
