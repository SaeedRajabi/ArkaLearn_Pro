"use client"
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle, FileText, Star, ArrowRight, ArrowLeft } from 'lucide-react';
import { YoutubeIcon } from '@/components/icons/youtube-icon';
import { TwitterIcon } from '@/components/icons/twitter-icon';
import { InstagramIcon } from '@/components/icons/instagram-icon';
import { LinkedInIcon } from '@/components/icons/linkedin-icon';
import type { Instructor } from '@/types';
import { cn } from '@/lib/utils';
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import getInitials, {avatarColors} from "@/components/shared/avatar-initializer";
import {useTheme} from "next-themes";

type DictionarySlice = {
  instructorCourses: string;
  instructorArticles: string;
  instructorPoints: string;
  aboutInstructor: string;
  viewProfile: string;
};

interface InstructorCardProps {
  instructor: Instructor;
  lang: 'en' | 'fa';
  dict: DictionarySlice;
}

function formatPoints(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function InstructorCard({ instructor, lang, dict }: InstructorCardProps) {
  const name = lang === 'en' ? instructor.name_en : instructor.name;
  const title = lang === 'en' ? instructor.title_en : instructor.title;
  const bio = lang === 'en' ? instructor.bio_en : instructor.bio;
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";
  const profileHref =
    instructor.userName && instructor.userName !== 'NOT'
      ? `/teachers/${encodeURIComponent(instructor.userName)}${
          instructor.teacherId ? `?teacherId=${instructor.teacherId}` : ''
        }`
      : instructor.teacherId
        ? `/teachers/${instructor.teacherId}?teacherId=${instructor.teacherId}`
        : null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-3">
          <div
            className={cn(
              'flex flex-col items-center text-center md:col-span-1',
              lang === 'fa' ? 'md:order-last' : ''
            )}
          >
            <div className="relative mb-4 h-32 w-32 overflow-hidden rounded-full ring-4 ring-primary/20">
              <Avatar className="h-32 w-32 ring-4 ring-primary/20">
                <AvatarImage
                    src={instructor.avatarUrl || undefined}
                    alt={name}
                    className="object-cover"
                />
                <AvatarFallback  style={avatarColors(name, mode)} className={cn("text-3xl font-bold ", lang === "fa" && "font-persian")}>
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <h3 className="font-headline text-xl font-bold">{name}</h3>
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="mt-4 flex gap-3">
              {instructor.social.youtube && (
                <Link href={instructor.social.youtube}>
                  <Button variant="outline" size="icon">
                    <YoutubeIcon className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              {instructor.social.twitter && (
                <Link href={instructor.social.twitter}>
                  <Button variant="outline" size="icon">
                    <TwitterIcon className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              {instructor.social.instagram && (
                <Link href={instructor.social.instagram}>
                  <Button variant="outline" size="icon">
                    <InstagramIcon className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              {instructor.social.linkedin && (
                <Link href={instructor.social.linkedin}>
                  <Button variant="outline" size="icon">
                    <LinkedInIcon className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className={cn('md:col-span-2', lang === 'fa' ? 'text-right' : 'text-left')}>
            <div
              className={cn(
                'mb-6 flex flex-wrap gap-x-8 gap-y-4',
                lang === 'fa' && 'justify-end'
              )}
            >
              <div className="flex items-center gap-2">
                <PlayCircle className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-lg font-bold">{instructor.stats.courses}</p>
                  <p className="text-sm text-muted-foreground">{dict.instructorCourses}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-lg font-bold">{instructor.stats.articles}</p>
                  <p className="text-sm text-muted-foreground">{dict.instructorArticles}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-lg font-bold">{formatPoints(instructor.stats.points)}</p>
                  <p className="text-sm text-muted-foreground">{dict.instructorPoints}</p>
                </div>
              </div>
            </div>
            <h4 className="font-headline mb-2 text-lg font-bold">{dict.aboutInstructor}</h4>
            <p className="leading-relaxed text-muted-foreground">{bio || '—'}</p>
            {profileHref ? (
              <Button asChild variant="link" className="mt-2 px-0">
                <Link href={profileHref}>
                  {dict.viewProfile}
                  {lang === 'en' ? (
                    <ArrowRight className="ml-2 h-4 w-4" />
                  ) : (
                    <ArrowLeft className="mr-2 h-4 w-4" />
                  )}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
