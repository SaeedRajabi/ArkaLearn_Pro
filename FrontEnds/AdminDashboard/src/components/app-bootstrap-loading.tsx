import { BrandLogo } from '@/components/brand-logo';

export function AppBootstrapLoading() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background"
      suppressHydrationWarning
    >
      <div className="flex animate-pulse flex-col items-center gap-4" suppressHydrationWarning>
        <BrandLogo showWordmark={false} />
        <span className="text-2xl font-semibold text-primary">ArkaSoftware</span>
      </div>
    </div>
  );
}
