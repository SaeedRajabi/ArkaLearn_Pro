'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/api/client';

type ConsumeHandoffResponse = {
  returnUrl?: string;
  ReturnUrl?: string;
  userData?: Record<string, unknown>;
  UserData?: Record<string, unknown>;
};

function unwrapPayload(raw: unknown): ConsumeHandoffResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const nested =
    (record.data as Record<string, unknown> | undefined) ??
    (record.Data as Record<string, unknown> | undefined) ??
    record;
  return nested as ConsumeHandoffResponse;
}

export default function DesktopHandoffClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSessionFromUserData } = useAuth();
  const [message, setMessage] = useState('در حال ورود امن از برنامه دسکتاپ...');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const code = searchParams.get('code')?.trim() ?? '';
      const fallbackReturn =
        searchParams.get('returnUrl')?.trim() || '/account?view=support-freeze';

      if (!code) {
        setFailed(true);
        setMessage('کد ورود نامعتبر است. لطفاً دوباره از برنامه دسکتاپ وارد شوید.');
        return;
      }

      try {
        const raw = await apiRequest<unknown>('Account/ConsumeWebHandoff', {
          method: 'POST',
          body: { code, Code: code },
        });
        if (cancelled) return;

        const payload = unwrapPayload(raw);
        const userData = (payload?.userData ?? payload?.UserData) as
          | Record<string, unknown>
          | undefined;
        if (!userData || !setSessionFromUserData(userData)) {
          setFailed(true);
          setMessage('ورود از دسکتاپ ناموفق بود. لطفاً دوباره تلاش کنید.');
          return;
        }

        const returnUrl = payload?.returnUrl ?? payload?.ReturnUrl ?? fallbackReturn;
        const safeReturn =
          typeof returnUrl === 'string' && returnUrl.startsWith('/') && !returnUrl.startsWith('//')
            ? returnUrl
            : '/account?view=support-freeze';

        setMessage('ورود موفق — در حال انتقال...');
        router.replace(safeReturn);
      } catch {
        if (cancelled) return;
        setFailed(true);
        setMessage('کد ورود منقضی یا نامعتبر است. لطفاً دوباره از برنامه دسکتاپ وارد شوید.');
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, setSessionFromUserData]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className={`text-base ${failed ? 'text-red-600' : 'text-zinc-700'}`}>{message}</p>
      {failed ? (
        <a
          href="/login"
          className="mt-6 rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800"
        >
          ورود دستی
        </a>
      ) : null}
    </main>
  );
}
