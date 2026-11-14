'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfessorHeaderImageEditor } from '@/components/professor/dashboard/professor-header-image-editor';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';

export function ProfessorSettingsPageClient({ dict }: { dict: Dictionary }) {
  return (
    <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{getDictValue(dict, 'professorDashboard.settings.title', 'Dashboard settings')}</CardTitle>
          <CardDescription>
            {getDictValue(
              dict,
              'professorDashboard.settings.description',
              'Customize how your professor dashboard looks to you and your students.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfessorHeaderImageEditor
            dict={dict}
            triggerClassName="relative inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
          />
        </CardContent>
      </Card>
  );
}
