import Link from 'next/link';
import {
  BookOpen,
  FolderKanban,
  GraduationCap,
  MessageSquare,
  Newspaper,
  Tags,
  Users,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SeoTagLink } from '@/components/shared/seo-tag-link';

type ExploreLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

interface DetailExploreLinksProps {
  lang: 'en' | 'fa';
  tags?: string[];
  categoryHref?: string;
  categoryLabel?: string;
  className?: string;
}

export function DetailExploreLinks({
  lang,
  tags = [],
  categoryHref,
  categoryLabel,
  className,
}: DetailExploreLinksProps) {
  const isRtl = lang === 'fa';

  const links: ExploreLink[] = [
    { href: '/courses', label: isRtl ? 'دوره‌های برنامه‌نویسی' : 'Programming courses', icon: GraduationCap },
    { href: '/seminars', label: isRtl ? 'سمینارها' : 'Seminars', icon: Video },
    { href: '/articles', label: isRtl ? 'مقالات تخصصی' : 'Expert articles', icon: Newspaper },
    { href: '/projects', label: isRtl ? 'پروژه‌ها' : 'Projects', icon: FolderKanban },
    { href: '/qa', label: isRtl ? 'پرسش و پاسخ' : 'Community Q&A', icon: MessageSquare },
    { href: '/about', label: isRtl ? 'درباره سعید رجبی و آرکا' : 'About Saeed Rajabi & Arka', icon: Users },
    { href: '/tags', label: isRtl ? 'موضوعات و برچسب‌ها' : 'Topics & tags', icon: Tags },
  ];

  if (categoryHref && categoryLabel) {
    links.unshift({
      href: categoryHref,
      label: categoryLabel,
      icon: BookOpen,
    });
  }

  return (
    <aside
      className={cn('space-y-4 lg:sticky lg:top-28 lg:self-start', className)}
      dir={isRtl ? 'rtl' : 'ltr'}
      aria-label={isRtl ? 'کاوش بیشتر' : 'Explore more'}
    >
      <div className="rounded-xl border bg-background p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          {isRtl ? 'کاوش در آرکا نرم افزار' : 'Explore ArkaSoftware'}
        </h2>
        <nav className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <link.icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {tags.length > 0 && (
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Tags className="h-4 w-4 text-primary" />
            {isRtl ? 'برچسب‌های مرتبط' : 'Related tags'}
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <SeoTagLink key={tag} tag={tag} />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
