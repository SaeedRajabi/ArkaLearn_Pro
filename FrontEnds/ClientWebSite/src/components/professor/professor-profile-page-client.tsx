'use client';

import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { ProfessorProfileSettings } from '@/components/professor/profile/professor-profile-settings';

export function ProfessorProfilePageClient({ dict }: { dict: Dictionary }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-headline">
          {getDictValue(dict, 'professorDashboard.profile.title', 'Public profile')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {getDictValue(
            dict,
            'professorDashboard.profile.pageSubtitle',
            'Manage your public teacher profile. Changes are published after admin approval.'
          )}
        </p>
      </div>
      <ProfessorProfileSettings dict={dict} />
    </div>
  );
}
