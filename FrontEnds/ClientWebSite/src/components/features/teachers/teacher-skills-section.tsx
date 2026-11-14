'use client';

import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { TeacherProfile } from '@/types';

type Skill = TeacherProfile['skills'][number];

function proficiencyLabel(rate: number, lang: 'en' | 'fa'): string {
  if (rate >= 90) return lang === 'fa' ? 'متخصص' : 'Expert';
  if (rate >= 70) return lang === 'fa' ? 'پیشرفته' : 'Advanced';
  if (rate >= 50) return lang === 'fa' ? 'متوسط' : 'Intermediate';
  return lang === 'fa' ? 'مبتدی' : 'Beginner';
}

function proficiencyBadgeClass(rate: number): string {
  if (rate >= 90) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  if (rate >= 70) return 'border-primary/30 bg-primary/10 text-primary';
  if (rate >= 50) return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';
  return 'border-muted-foreground/20 bg-muted text-muted-foreground';
}

function progressBarClass(rate: number): string {
  if (rate >= 90) return 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400';
  if (rate >= 70) return 'bg-gradient-to-r from-primary via-blue-500 to-primary/80';
  if (rate >= 50) return 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-400';
  return 'bg-gradient-to-r from-muted-foreground/70 to-muted-foreground/50';
}

type Props = {
  skills: Skill[];
  lang: 'en' | 'fa';
  title: string;
  emptyLabel: string;
  /** When true, renders without outer section heading (used inside ProfileSection). */
  embedded?: boolean;
};

export function TeacherSkillsSection({ skills, lang, title, emptyLabel, embedded = false }: Props) {
  const sorted = [...skills].sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name, lang === 'fa' ? 'fa' : 'en'));

  const content =
    sorted.length === 0 ? (
      <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-muted-foreground">
        {emptyLabel}
      </div>
    ) : (
      <div className={cn('grid gap-4', embedded ? 'grid-cols-1' : 'sm:grid-cols-2')}>
        {sorted.map((skill) => (
          <SkillCard key={skill.id || skill.name} skill={skill} lang={lang} />
        ))}
      </div>
    );

  if (embedded) {
    return content;
  }

  return (
    <section className={cn(lang === 'fa' && 'text-right')}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-headline text-2xl font-bold">{title}</h2>
        {sorted.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {lang === 'fa' ? `${sorted.length} مهارت ثبت‌شده` : `${sorted.length} listed skills`}
          </p>
        ) : null}
      </div>
      {content}
    </section>
  );
}

function SkillCard({ skill, lang }: { skill: Skill; lang: 'en' | 'fa' }) {
  const level = proficiencyLabel(skill.rate, lang);
  const clampedRate = Math.min(100, Math.max(0, skill.rate));

  return (
    <Card className="group overflow-hidden border bg-card/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
      <CardContent className="p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
                clampedRate >= 90
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-primary/10 text-primary group-hover:bg-primary/15'
              )}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="truncate font-semibold leading-tight">{skill.name}</p>
          </div>
          <Badge variant="outline" className={cn('shrink-0 text-xs font-medium', proficiencyBadgeClass(clampedRate))}>
            {level}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {lang === 'fa' ? 'میزان تسلط' : 'Proficiency'}
            </span>
            <span className="font-mono text-sm font-bold tabular-nums text-foreground">{clampedRate}%</span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/80">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out',
                progressBarClass(clampedRate)
              )}
              style={{ width: `${clampedRate}%` }}
              role="progressbar"
              aria-valuenow={clampedRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={skill.name}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
