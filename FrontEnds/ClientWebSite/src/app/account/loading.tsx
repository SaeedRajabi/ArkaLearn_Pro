import { Loader2 } from 'lucide-react';

/** Soft-nav into /account: avoid an empty main under site Header/Footer. */
export default function AccountLoading() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 py-16">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">در حال بارگذاری داشبورد…</p>
    </div>
  );
}
