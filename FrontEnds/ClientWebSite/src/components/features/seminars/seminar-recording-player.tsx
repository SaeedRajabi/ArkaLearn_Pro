'use client';

import { getSeminarRecordingStreamUrl } from '@/lib/utils/seminar-media-url';

type Props = {
  seminarId: string;
  title: string;
  lang: 'en' | 'fa';
};

export function SeminarRecordingPlayer({ seminarId, title, lang }: Props) {
  const src = getSeminarRecordingStreamUrl(seminarId);

  return (
    <div className="rounded-3xl border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-semibold">
        {lang === 'fa' ? 'ویدیو ضبط‌شده سمینار' : 'Recorded seminar video'}
      </p>
      <video
        src={src}
        controls
        playsInline
        className="w-full rounded-2xl max-h-[480px]"
        title={title}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {lang === 'fa'
          ? 'برای مشاهده باید در سمینار ثبت‌نام کرده باشید.'
          : 'You must be registered to watch this recording.'}
      </p>
    </div>
  );
}
