'use client';

import * as React from 'react';
import { Loader2, MessageCircle, Search, UserRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  getMySupportConversations,
  getStudentSupportTeachers,
  type SupportTeacherOption,
} from '@/lib/api/support-chat';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { cn } from '@/lib/utils';

export type StudentSupportTeacherRow = SupportTeacherOption & {
  topicCount: number;
  unreadCount: number;
  lastMessageAtUtc?: string | null;
  lastMessagePreview?: string | null;
};

type StudentSupportTeacherPanelProps = {
  dict: Dictionary;
  onSelectTeacher: (teacher: StudentSupportTeacherRow) => void;
  refreshToken?: number;
};

function formatTime(value: string | null | undefined, locale: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
}

export function StudentSupportTeacherPanel({
  dict,
  onSelectTeacher,
  refreshToken = 0,
}: StudentSupportTeacherPanelProps) {
  const locale = String(dict.locale ?? 'fa');
  const t = (key: string, def: string) => getDictValue(dict, key, def);

  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [teachers, setTeachers] = React.useState<StudentSupportTeacherRow[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const [teacherRows, conversations] = await Promise.all([
          getStudentSupportTeachers(),
          getMySupportConversations().catch(() => []),
        ]);
        if (cancelled) return;

        const byTeacher = new Map<
          string,
          { topicCount: number; unreadCount: number; lastMessageAtUtc?: string | null; lastMessagePreview?: string | null }
        >();

        for (const row of conversations) {
          const key = String(row.teacherUserId);
          const prev = byTeacher.get(key) ?? {
            topicCount: 0,
            unreadCount: 0,
            lastMessageAtUtc: null,
            lastMessagePreview: null,
          };
          prev.topicCount += 1;
          prev.unreadCount += row.unreadCount || 0;
          const prevAt = prev.lastMessageAtUtc ? new Date(prev.lastMessageAtUtc).getTime() : 0;
          const rowAt = row.lastMessageAtUtc ? new Date(row.lastMessageAtUtc).getTime() : 0;
          if (rowAt >= prevAt) {
            prev.lastMessageAtUtc = row.lastMessageAtUtc;
            prev.lastMessagePreview = row.lastMessagePreview;
          }
          byTeacher.set(key, prev);
        }

        const merged: StudentSupportTeacherRow[] = teacherRows
          .filter((teacher) => teacher.teacherUserId !== '0')
          .map((teacher) => {
            const stats = byTeacher.get(teacher.teacherUserId);
            return {
              ...teacher,
              topicCount: stats?.topicCount ?? 0,
              unreadCount: stats?.unreadCount ?? 0,
              lastMessageAtUtc: stats?.lastMessageAtUtc ?? null,
              lastMessagePreview: stats?.lastMessagePreview ?? null,
            };
          })
          .sort((a, b) => {
            const aTime = a.lastMessageAtUtc ? new Date(a.lastMessageAtUtc).getTime() : 0;
            const bTime = b.lastMessageAtUtc ? new Date(b.lastMessageAtUtc).getTime() : 0;
            return bTime - aTime || a.displayName.localeCompare(b.displayName, locale);
          });

        setTeachers(merged);
      } catch {
        if (!cancelled) setTeachers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshToken, locale]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (teacher) =>
        teacher.displayName.toLowerCase().includes(q) ||
        (teacher.email ?? '').toLowerCase().includes(q)
    );
  }, [teachers, search]);

  return (
    <Card className="flex min-h-[min(calc(100dvh-8rem),920px)] flex-col overflow-hidden">
      <CardHeader className="shrink-0 space-y-4 border-b pb-4">
        <div>
          <CardTitle className="text-base">
            {t('supportChat.teachersTitle', 'Teachers')}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              'supportChat.teachersSubtitle',
              'Select a teacher to view conversations and messages with them.'
            )}
          </p>
        </div>
        <form
          className="relative"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput.trim());
          }}
        >
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('supportChat.searchTeachers', 'Search teachers...')}
            className="ps-9"
          />
        </form>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm">{t('loading', 'Loading…')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
            <UserRound className="h-10 w-10 text-muted-foreground/70" />
            <p className="text-sm text-muted-foreground">
              {t('supportChat.noTeachers', 'No teachers available')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((teacher) => (
              <button
                key={teacher.teacherUserId}
                type="button"
                onClick={() => onSelectTeacher(teacher)}
                className={cn(
                  'w-full rounded-xl border bg-card px-4 py-3 text-start transition',
                  'hover:border-primary/30 hover:bg-primary/5'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{teacher.displayName}</p>
                    {teacher.email ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{teacher.email}</p>
                    ) : null}
                  </div>
                  {teacher.unreadCount > 0 ? (
                    <Badge className="shrink-0">{teacher.unreadCount}</Badge>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {teacher.topicCount} {t('supportChat.topics', 'Support topics')}
                  </span>
                  {teacher.lastMessageAtUtc ? (
                    <span>{formatTime(teacher.lastMessageAtUtc, locale)}</span>
                  ) : null}
                </div>
                {teacher.lastMessagePreview ? (
                  <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                    {teacher.lastMessagePreview}
                  </p>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
