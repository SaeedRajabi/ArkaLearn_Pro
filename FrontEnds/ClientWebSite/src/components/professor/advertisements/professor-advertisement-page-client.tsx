'use client';

import * as React from 'react';
import { ProfessorAdvertisementForm } from '@/components/professor/advertisements/professor-advertisement-form';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';

export function ProfessorAdvertisementPageClient({ dict }: { dict: Dictionary }) {
  const [hasExistingAd, setHasExistingAd] = React.useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {getDictValue(dict, 'professorDashboard.advertisements.pageTitle', 'Ads & promotions')}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {getDictValue(
            dict,
            hasExistingAd
              ? 'professorDashboard.advertisements.pageDescriptionEdit'
              : 'professorDashboard.advertisements.pageDescription',
            hasExistingAd
              ? 'View and edit your saved teaching advertisement.'
              : 'Create and publish your teaching and project advertisement.'
          )}
        </p>
      </div>
      <ProfessorAdvertisementForm dict={dict} onExistingAdChange={setHasExistingAd} />
    </div>
  );
}
