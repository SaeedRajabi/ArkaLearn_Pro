import { pageLayout } from '@/lib/utils/page-layout';
import { cn } from '@/lib/utils';

export type AuthLayoutCopy = {
  welcomeTitle: string;
  welcomeSubtitle: string;
  welcomeSocialProof: string;
};

interface AuthLayoutProps {
  children: React.ReactNode;
  copy?: AuthLayoutCopy;
  dir: 'ltr' | 'rtl';
}

/** Auth form shell inside the site header/footer — only the main content area changes. */
export function AuthLayout({ children, dir }: AuthLayoutProps) {
  return (
    <div dir={dir} className={cn(pageLayout.sectionContainerTight)}>
      <div className="mx-auto w-full max-w-lg">
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-lg sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
