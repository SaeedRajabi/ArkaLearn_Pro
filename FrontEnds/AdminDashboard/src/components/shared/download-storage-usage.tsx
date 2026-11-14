'use client';

import { useEffect, useState } from 'react';
import { HardDrive, RefreshCw } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useLanguage } from '@/components/language-provider';
import apiClient from '@/lib/apiClient';

type Usage = { capacityBytes: number; usedBytes: number; remainingBytes: number; measuredAtUtc: string };

export function DownloadStorageUsage({ refreshKey }: { refreshKey?: unknown }) {
  const { authUser } = useAuth();
  const isAdmin = authUser?.roleName === 'admin';
  const { locale } = useLanguage();
  const fa = locale === 'fa';
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    let canceled = false;
    let busy = false;
    const controller = new AbortController();
    const load = async () => {
      if (busy) return;
      busy = true;
      setLoading(true);
      try {
        const raw = await apiClient.get<Record<string, unknown>>('/UserFile/GetStorageUsage', { signal: controller.signal }).then(response => response.data);
        const payload = (raw.data ?? raw.Data ?? raw) as Record<string, unknown>;
        const next = {
          capacityBytes: Number(payload.capacityBytes ?? payload.CapacityBytes),
          usedBytes: Number(payload.usedBytes ?? payload.UsedBytes),
          remainingBytes: Number(payload.remainingBytes ?? payload.RemainingBytes),
          measuredAtUtc: String(payload.measuredAtUtc ?? payload.MeasuredAtUtc ?? ''),
        };
        if (![next.capacityBytes, next.usedBytes, next.remainingBytes].every(Number.isFinite) ||
          next.capacityBytes <= 0 || next.usedBytes < 0 || next.remainingBytes < 0) throw new Error('Invalid usage response');
        if (!canceled) { setUsage(next); setFailed(false); }
      } catch {
        if (!canceled) { setUsage(null); setFailed(true); }
      } finally {
        busy = false;
        if (!canceled) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => { void load(); }, 30_000);
    return () => { canceled = true; controller.abort(); window.clearInterval(timer); };
  }, [isAdmin, refreshKey, retry]);

  if (!isAdmin) return null;
  const format = (bytes: number) => new Intl.NumberFormat(fa ? 'fa-IR' : 'en-US', {
    maximumFractionDigits: 2,
  }).format(bytes / (1024 ** 3));
  const unit = fa ? 'گیگابایت' : 'GiB';
  const percentage = usage ? Math.min(100, Math.round(usage.usedBytes / usage.capacityBytes * 100)) : 0;
  const refreshLabel = fa ? 'به‌روزرسانی فضای هاست' : 'Refresh storage usage';

  return (
    <section className="rounded-lg border bg-card p-4 text-card-foreground" aria-label={fa ? 'فضای هاست دانلودی' : 'Download storage'}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><HardDrive className="h-4 w-4" />
          {fa ? 'فضای هاست دانلودی' : 'Download storage'}
        </h2>
        <button type="button" disabled={loading} onClick={() => setRetry(value => value + 1)}
          className="rounded-md p-2 hover:bg-muted disabled:opacity-50" aria-label={refreshLabel} title={refreshLabel}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {failed ? <p role="alert" className="text-sm text-destructive">
        {fa ? 'دریافت اطلاعات فضا ناموفق بود. دوباره تلاش کنید.' : 'Storage usage is unavailable. Please retry.'}
      </p> : usage ? <>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          {[[fa ? 'ظرفیت کل' : 'Capacity', usage.capacityBytes],
            [fa ? 'استفاده‌شده' : 'Used', usage.usedBytes],
            [fa ? 'باقی‌مانده' : 'Remaining', usage.remainingBytes]].map(([label, bytes]) => (
            <div key={String(label)}><dt className="text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-semibold">{format(Number(bytes))} {unit}</dd></div>
          ))}
        </dl>
        <div role="progressbar" aria-label={fa ? 'درصد فضای استفاده‌شده' : 'Storage used'}
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className={`h-full ${percentage >= 90 ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${percentage}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {fa ? 'فضای مشترک هاست، شامل فایل‌ها و آپلودهای در حال انجام' : 'Shared host usage, including files and uploads in progress'}
        </p>
      </> : <p role="status" className="text-sm text-muted-foreground">
        {fa ? 'در حال دریافت اطلاعات فضا…' : 'Loading storage usage…'}
      </p>}
    </section>
  );
}
