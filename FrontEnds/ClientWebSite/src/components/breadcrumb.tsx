
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Dictionary } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { pageLayout } from '@/lib/utils/page-layout';

interface BreadcrumbProps {
  title: string;
  subtitle: string;
  breadcrumbs: { label: string; href: string }[];
  dict: Dictionary;
}

export function Breadcrumb({ title, subtitle, breadcrumbs, dict }: BreadcrumbProps) {
  const lang = dict.header.courses === 'Courses' ? 'en' : 'fa';
  const dir = lang === 'fa' ? 'rtl' : 'ltr';

  return (
    <div dir={dir} className={pageLayout.pageHeaderBand}>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-start">
          <div>
            <h1 className="text-4xl font-bold font-headline">{title}</h1>
            <p className={cn("mt-2 text-muted-foreground", lang === 'fa' && 'font-subtitle')}>
                {subtitle}
            </p>
          </div>
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              {breadcrumbs.map((item, index) => (
                <li key={item.href} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronRight className={cn("h-4 w-4", lang === 'fa' && 'rotate-180')} />
                  )}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="font-semibold text-foreground">{item.label}</span>
                  ) : (
                    <Link href={item.href} className="hover:text-primary">
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
    </div>
  );
}
