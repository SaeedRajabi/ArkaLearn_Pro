import { Breadcrumb } from './breadcrumb';
import type { Dictionary } from '@/types';
import { cn } from '@/lib/utils';
import { pageLayout } from '@/lib/utils/page-layout';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface PageWithBreadcrumbProps {
  title: string;
  subtitle: string;
  breadcrumbs: BreadcrumbItem[];
  dict: Dictionary;
  children: React.ReactNode;
  /** اگر true باشد، محتوا داخل container با padding قرار می‌گیرد. پیش‌فرض true */
  withContainer?: boolean;
}

export function PageWithBreadcrumb({
  title,
  subtitle,
  breadcrumbs,
  dict,
  children,
  withContainer = true,
}: PageWithBreadcrumbProps) {
  return (
    <>
      <Breadcrumb
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        dict={dict}
      />
      {withContainer ? (
        <div className={cn(pageLayout.container, 'py-12')}>{children}</div>
      ) : (
        children
      )}
    </>
  );
}
