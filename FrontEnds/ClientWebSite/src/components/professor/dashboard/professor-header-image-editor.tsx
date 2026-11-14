'use client';

import type { Dictionary } from '@/types';
import { DashboardHeaderImageEditor } from '@/components/dashboard/dashboard-header-image-editor';
import { useProfessorDashboard } from './professor-dashboard-context';

export function ProfessorHeaderImageEditor({
  dict,
  triggerClassName,
}: {
  dict: Dictionary;
  triggerClassName?: string;
}) {
  const { profile, updateHeaderImage } = useProfessorDashboard();

  return (
    <DashboardHeaderImageEditor
      dict={dict}
      translationPrefix="professorDashboard.headerImage"
      currentHeaderPath={profile?.headerImageUrl}
      onSave={updateHeaderImage}
      triggerClassName={triggerClassName}
      fileInputId="professor-header-image-file"
    />
  );
}
