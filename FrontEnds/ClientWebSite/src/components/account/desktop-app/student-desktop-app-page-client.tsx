'use client';

import type { Dictionary } from '@/types';
import { getDictValue } from '@/lib/i18n-client';
import { DesktopAppDownloadPanel } from '@/components/desktop-app/desktop-app-download-panel';

export function StudentDesktopAppPageClient({ dict }: { dict: Dictionary }) {
  const t = (key: string, def: string) => getDictValue(dict, key, def);

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('desktopApp.studentPage.title', 'اپلیکیشن ویندوز')}
        </h1>
        <p className="text-muted-foreground">
          {t(
            'desktopApp.studentPage.subtitle',
            'اپلیکیشن دسکتاپ آرکا نرم‌افزار را دانلود کنید تا دوره‌های لایسنس‌دار، پخش امن ویدیو و کمک از راه دور در دسترس شما باشد.'
          )}
        </p>
      </div>

      <DesktopAppDownloadPanel dict={dict} audience="student" />

      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          {t(
            'desktopApp.studentPage.step1',
            '۱. اپلیکیشن را دانلود و روی ویندوز نصب کنید.'
          )}
        </p>
        <p>
          {t(
            'desktopApp.studentPage.step2',
            '۲. با همان حساب کاربری وب‌سایت وارد شوید.'
          )}
        </p>
        <p>
          {t(
            'desktopApp.studentPage.step3',
            '۳. لایسنس دوره را از بخش «دوره‌های من» کپی کرده و در اپ وارد کنید.'
          )}
        </p>
      </div>
    </div>
  );
}
