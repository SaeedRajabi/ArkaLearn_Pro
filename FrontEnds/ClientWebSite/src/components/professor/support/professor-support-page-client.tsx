'use client';

import * as React from 'react';
import type { Dictionary } from '@/types';
import { ProfessorSupportWorkspace } from '@/components/professor/support/professor-support-workspace';
import { getDictValue } from '@/lib/i18n-client';

export function ProfessorSupportPageClient({ dict }: { dict: Dictionary }) {
  const t = (key: string, def: string) => getDictValue(dict, key, def);
  const [mobileInChat, setMobileInChat] = React.useState(false);

  return (
    <div className="space-y-4 pb-6">
      {!mobileInChat ? (
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('supportChat.professorTitle', 'Student support')}
          </h1>
          <p className="text-muted-foreground">
            {t('supportChat.professorSubtitle', 'Answer student questions in real time.')}
          </p>
        </div>
      ) : null}
      <ProfessorSupportWorkspace dict={dict} onMobileChatViewChange={setMobileInChat} />
    </div>
  );
}
