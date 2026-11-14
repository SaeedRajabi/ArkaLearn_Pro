'use client';

import type { Dictionary } from '@/types';
import { getDictValue } from '@/lib/i18n-client';
import { DesktopAppDownloadPanel } from '@/components/desktop-app/desktop-app-download-panel';

export function ProfessorDesktopAppPageClient({ dict }: { dict: Dictionary }) {
  const t = (key: string, def: string) => getDictValue(dict, key, def);

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('desktopApp.professorPage.title', 'اپلیکیشن ویندوز')}
        </h1>
        <p className="text-muted-foreground">
          {t(
            'desktopApp.professorPage.subtitle',
            'اپلیکیشن دسکتاپ را نصب کنید تا بتوانید به کمک از راه دور دانشجویان متصل شوید و تجربه یادگیری دسکتاپ را پشتیبانی کنید.'
          )}
        </p>
      </div>

      <DesktopAppDownloadPanel dict={dict} audience="professor" />

      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          {t(
            'desktopApp.professorPage.step1',
            '۱. فایل نصب ویندوز را دانلود و نصب کنید.'
          )}
        </p>
        <p>
          {t(
            'desktopApp.professorPage.step2',
            '۲. با حساب استادی وارد اپلیکیشن شوید.'
          )}
        </p>
        <p>
          {t(
            'desktopApp.professorPage.step3',
            '۳. از بخش کمک از راه دور در داشبورد وب یا اپ به دانشجو متصل شوید.'
          )}
        </p>
      </div>
    </div>
  );
}
