'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserImageUrl } from '@/lib/utils/image-url';
import getInitials from '@/components/shared/avatar-initializer';
import { FollowTeacherButton } from '@/components/features/teachers/follow-teacher-button';
import type { TeacherListItem, TeacherTeachingCategory } from '@/lib/api/teachers';

type Props = {
  teachers: TeacherListItem[];
  categories: TeacherTeachingCategory[];
  lang: 'en' | 'fa';
  dict: Record<string, string>;
};

export function TeachersPageClient({ teachers, categories, lang, dict }: Props) {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | 'all'>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      if (categoryId !== 'all' && categories.find((c) => c.id === categoryId)) {
        const cat = categories.find((c) => c.id === categoryId);
        if (cat && t.teachingCategorySlug !== cat.slug) return false;
      }
      if (!q) return true;
      return (
        t.displayName.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        t.shortDescription.toLowerCase().includes(q) ||
        t.teachingCategoryName.toLowerCase().includes(q)
      );
    });
  }, [teachers, search, categoryId, categories]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={dict.searchPlaceholder}
          className="max-w-md"
        />
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={categoryId === 'all' ? 'all' : String(categoryId)}
          onChange={(e) => setCategoryId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        >
          <option value="all">{dict.allCategories}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">{dict.empty}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((teacher) => (
            <Card key={teacher.teacherId} className="overflow-hidden">
              <div className="relative h-28 bg-muted">
                {teacher.headerImageUrl ? (
                  <Image src={getUserImageUrl(teacher.headerImageUrl)} alt="" fill className="object-cover" />
                ) : null}
              </div>
              <CardContent className="relative px-4 pb-4 pt-10">
                <Avatar className="absolute -top-8 h-16 w-16 ring-4 ring-background">
                  <AvatarImage src={getUserImageUrl(teacher.avatarUrl)} alt={teacher.displayName} />
                  <AvatarFallback>{getInitials(teacher.displayName)}</AvatarFallback>
                </Avatar>
                <h2 className="font-headline text-lg font-bold">{teacher.displayName}</h2>
                {teacher.teachingCategoryName ? (
                  <p className="text-xs text-primary">{teacher.teachingCategoryName}</p>
                ) : null}
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {teacher.shortDescription || dict.noBio}
                </p>
                <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                  <span>{teacher.publishedCourseCount} {dict.courses}</span>
                  <span>{teacher.publishedArticleCount} {dict.articles}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <FollowTeacherButton
                    teacherId={teacher.teacherId}
                    initialIsFollowing={teacher.isFollowing}
                    lang={lang}
                    size="sm"
                    labels={{
                      follow: dict.followTeacher,
                      unfollow: dict.unfollowTeacher,
                      following: dict.followingTeacher,
                    }}
                  />
                  <Link
                    href={`/teachers/${encodeURIComponent(teacher.userName)}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {dict.viewProfile}
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
