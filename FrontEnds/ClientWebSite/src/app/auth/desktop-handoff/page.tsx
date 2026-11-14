import type { Metadata } from 'next';
import { Suspense } from 'react';
import { buildPageMetadata } from '@/lib/seo';
import DesktopHandoffClient from '@/components/auth/desktop-handoff-client';

export const metadata: Metadata = buildPageMetadata({
  title: 'ورود از دسکتاپ',
  description: 'احراز هویت امن از برنامه دسکتاپ آرکا.',
  path: '/auth/desktop-handoff',
  noIndex: true,
});

export default function DesktopHandoffPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-6 text-center text-zinc-700">
          در حال ورود امن از برنامه دسکتاپ...
        </main>
      }
    >
      <DesktopHandoffClient />
    </Suspense>
  );
}
