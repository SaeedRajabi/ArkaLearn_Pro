'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Download,
  FilePlus2,
  FileText,
  FolderKanban,
  FolderOpen,
  GraduationCap,
  Home,
  Info,
  Layers,
  LifeBuoy,
  LogIn,
  Megaphone,
  MessagesSquare,
  Phone,
  Presentation,
  Search,
  ShoppingCart,
  Sparkles,
  Tags,
  UserCircle,
  BookMarked,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { pageLayout } from '@/lib/utils/page-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SiteMapIconKey, SiteMapNode, SiteMapSection } from '@/lib/site-map/build-site-map-sections';
import { countSiteMapLinks } from '@/lib/site-map/build-site-map-sections';

const ICON_MAP: Record<SiteMapIconKey, LucideIcon> = {
  home: Home,
  sparkles: Sparkles,
  'folder-kanban': FolderKanban,
  megaphone: Megaphone,
  'graduation-cap': GraduationCap,
  'messages-square': MessagesSquare,
  info: Info,
  phone: Phone,
  'book-open': BookOpen,
  presentation: Presentation,
  'file-text': FileText,
  'book-marked': BookMarked,
  download: Download,
  'folder-open': FolderOpen,
  'file-plus-2': FilePlus2,
  'user-circle': UserCircle,
  tags: Tags,
  layers: Layers,
  'life-buoy': LifeBuoy,
  'log-in': LogIn,
  'shopping-cart': ShoppingCart,
};

type SitemapPageDict = Record<string, string>;

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function nodeMatchesQuery(node: SiteMapNode, query: string): boolean {
  if (!query) return true;

  const haystack = `${node.label} ${node.description ?? ''} ${node.href}`.toLowerCase();
  if (haystack.includes(query)) return true;

  return node.children?.some((child) => nodeMatchesQuery(child, query)) ?? false;
}

function filterNodes(nodes: SiteMapNode[], query: string): SiteMapNode[] {
  if (!query) return nodes;

  return nodes
    .map((node) => {
      const filteredChildren = node.children ? filterNodes(node.children, query) : undefined;
      const selfMatch =
        `${node.label} ${node.description ?? ''} ${node.href}`.toLowerCase().includes(query);

      if (selfMatch || (filteredChildren && filteredChildren.length > 0)) {
        return {
          ...node,
          children: filteredChildren,
        };
      }

      return null;
    })
    .filter((node): node is SiteMapNode => node != null);
}

function SiteMapTreeNode({
  node,
  depth = 0,
  lang,
  defaultExpanded,
}: {
  node: SiteMapNode;
  depth?: number;
  lang: 'en' | 'fa';
  defaultExpanded?: boolean;
}) {
  const hasChildren = Boolean(node.children?.length);
  const [open, setOpen] = React.useState(defaultExpanded ?? depth < 1);

  const ArrowIcon = lang === 'fa' ? ArrowLeft : ArrowRight;

  return (
    <li className="relative">
      {depth > 0 ? (
        <span
          aria-hidden
          className={cn(
            'absolute top-0 bottom-0 w-px bg-border/80',
            lang === 'fa' ? 'right-0' : 'left-0'
          )}
        />
      ) : null}

      <div
        className={cn(
          'group flex items-start gap-2 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-primary/15 hover:bg-primary/5',
          depth > 0 && (lang === 'fa' ? 'mr-4 pr-3' : 'ml-4 pl-3')
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground transition hover:text-primary"
            aria-expanded={open}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
          </button>
        ) : (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/70" />
        )}

        <div className="min-w-0 flex-1">
          <Link href={node.href} className="inline-flex flex-wrap items-center gap-2 font-medium text-foreground hover:text-primary">
            <span>{node.label}</span>
            <ArrowIcon className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
          </Link>
          {node.description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{node.description}</p>
          ) : null}
        </div>
      </div>

      {hasChildren && open ? (
        <ul className="mt-1 space-y-1">
          {node.children!.map((child) => (
            <SiteMapTreeNode key={`${child.href}-${child.label}`} node={child} depth={depth + 1} lang={lang} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function SiteMapSectionCard({
  section,
  lang,
  query,
}: {
  section: SiteMapSection;
  lang: 'en' | 'fa';
  query: string;
}) {
  const Icon = ICON_MAP[section.iconKey] ?? Layers;
  const nodes = filterNodes(section.nodes, query);

  if (nodes.length === 0) return null;

  const isTreeSection = section.id === 'categories';

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg',
        isTreeSection && 'md:col-span-2'
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-24 bg-gradient-to-b', section.accentClass)} aria-hidden />
      <div className="relative p-6 md:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-background/90 shadow-sm">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{section.title}</h2>
              <Badge variant="secondary" className="font-normal">
                {nodes.length}
              </Badge>
            </div>
            {section.description ? (
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{section.description}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          {isTreeSection ? (
            <ul className="space-y-1">
              {nodes.map((node) => (
                <SiteMapTreeNode key={`${node.href}-${node.label}`} node={node} lang={lang} defaultExpanded />
              ))}
            </ul>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {nodes.map((node) => (
                <Link
                  key={`${node.href}-${node.label}`}
                  href={node.href}
                  className="group/link flex flex-col rounded-xl border bg-background/70 px-4 py-3 transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="font-medium text-foreground group-hover/link:text-primary">{node.label}</span>
                  {node.description ? (
                    <span className="mt-1 text-xs text-muted-foreground line-clamp-2">{node.description}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function SitemapPageClient({
  lang,
  dict,
  sections,
}: {
  lang: 'en' | 'fa';
  dict: SitemapPageDict;
  sections: SiteMapSection[];
}) {
  const [query, setQuery] = React.useState('');
  const normalizedQuery = normalizeQuery(query);

  const visibleSections = React.useMemo(() => {
    if (!normalizedQuery) return sections;

    return sections.filter((section) => {
      const sectionMatch =
        `${section.title} ${section.description}`.toLowerCase().includes(normalizedQuery);
      const nodeMatch = section.nodes.some((node) => nodeMatchesQuery(node, normalizedQuery));
      return sectionMatch || nodeMatch;
    });
  }, [sections, normalizedQuery]);

  const totalLinks = countSiteMapLinks(sections);
  const visibleLinks = countSiteMapLinks(
    visibleSections.map((section) => ({
      ...section,
      nodes: filterNodes(section.nodes, normalizedQuery),
    }))
  );

  return (
    <div className="space-y-12 pb-16">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/8 via-background to-background px-4 py-12 md:px-10 md:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.12) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className={cn('relative', pageLayout.container, 'max-w-5xl px-0')}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
            {dict.heroEyebrow ?? (lang === 'fa' ? 'کاوش در آرکا' : 'Explore Arka')}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            {dict.heroTitle ?? (lang === 'fa' ? 'همه مسیرهای یادگیری در یک نگاه' : 'Every learning path at a glance')}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {dict.heroSubtitle ?? ''}
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={dict.searchPlaceholder}
                className="h-12 rounded-xl ps-10"
                aria-label={dict.searchPlaceholder}
              />
            </div>
            <Button asChild size="lg" className="h-12 rounded-xl px-6">
              <Link href="/courses">{dict.ctaPrimary}</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { label: dict.statSections, value: String(sections.length) },
              { label: dict.statLinks, value: String(totalLinks) },
              {
                label: dict.statFiltered,
                value: normalizedQuery ? String(visibleLinks) : dict.statAll,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border bg-background/80 px-4 py-3 backdrop-blur-sm"
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={cn(pageLayout.container, 'px-0')}>
        {visibleSections.length === 0 ? (
          <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
            <p className="text-lg font-medium">{dict.emptyTitle}</p>
            <p className="mt-2 text-sm text-muted-foreground">{dict.emptySubtitle}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {visibleSections.map((section) => (
              <SiteMapSectionCard
                key={section.id}
                section={section}
                lang={lang}
                query={normalizedQuery}
              />
            ))}
          </div>
        )}
      </section>

      <section className={cn(pageLayout.container, 'px-0')}>
        <div className="rounded-2xl border bg-muted/30 px-6 py-8 md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <h3 className="text-lg font-semibold">{dict.footerNoteTitle}</h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{dict.footerNoteDesc}</p>
          </div>
          <Button asChild variant="outline" className="mt-4 shrink-0 md:mt-0">
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
              {dict.footerNoteLink}
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
