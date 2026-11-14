'use client';

import Image from 'next/image';
import { UserCircle, GraduationCap, Award, PlayCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TeacherProfileHero } from '@/components/features/teachers/teacher-profile-hero';
import { TeacherProfileSection } from '@/components/features/teachers/teacher-profile-section';
import { TeacherSkillsSection } from '@/components/features/teachers/teacher-skills-section';
import { TeacherCoursesSection } from '@/components/features/teachers/teacher-courses-section';
import { TeacherResumeSection } from '@/components/features/teachers/teacher-resume-section';
import { cn } from '@/lib/utils';
import { getDegreeImageUrl, getUserImageUrl } from '@/lib/utils/image-url';
import type { TeacherProfile } from '@/types';
import { useTheme } from 'next-themes';

type DictSlice = {
  courses: string;
  articles: string;
  points: string;
  students?: string;
  reviews?: string;
  about: string;
  qualifications: string;
  skills: string;
  publishedCourses: string;
  noBio: string;
  noQualifications: string;
  noSkills: string;
  noCourses: string;
  degreeBachelors: string;
  degreeMasters: string;
  degreePhd: string;
  degreeCertificate: string;
  viewCourse: string;
  resume?: string;
  resumeViewPdf?: string;
  resumeDownload?: string;
};

interface TeacherProfileViewProps {
  profile: TeacherProfile;
  lang: 'en' | 'fa';
  dict: DictSlice;
}

function degreeLabel(degreeType: string, dict: DictSlice): string {
  switch (degreeType.toLowerCase()) {
    case 'phd':
      return dict.degreePhd;
    case 'masters':
    case 'master':
      return dict.degreeMasters;
    case 'certificate':
    case 'work':
      return dict.degreeCertificate;
    default:
      return dict.degreeBachelors;
  }
}

function degreeBadgeClass(degreeType: string): string {
  switch (degreeType.toLowerCase()) {
    case 'phd':
      return 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300';
    case 'masters':
    case 'master':
      return 'border-primary/30 bg-primary/10 text-primary';
    default:
      return 'border-muted-foreground/20 bg-muted text-muted-foreground';
  }
}

export function TeacherProfileView({ profile, lang, dict }: TeacherProfileViewProps) {
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === 'dark' ? 'dark' : 'light';
  const bio = profile.longDescription?.trim() || profile.shortDescription?.trim();

  if (profile.accountStatus === 'terminated') {
    return (
      <div className="mx-auto max-w-3xl space-y-6 py-8">
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="space-y-4 p-8 text-center">
            <UserCircle className="mx-auto h-14 w-14 text-destructive" />
            <h1 className="text-2xl font-bold">{profile.displayName}</h1>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {profile.accountStatusNote?.trim() ||
                (lang === 'fa'
                  ? 'این حساب استاد از پلتفرم اخراج شده است.'
                  : 'This teacher account has been removed from the platform.')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <TeacherProfileHero profile={profile} lang={lang} dict={dict} mode={mode} />

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          <TeacherProfileSection title={dict.about} icon={UserCircle} lang={lang}>
            {bio ? (
              <p className="whitespace-pre-line text-base leading-8 text-muted-foreground">{bio}</p>
            ) : (
              <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-muted-foreground">
                {dict.noBio}
              </div>
            )}
          </TeacherProfileSection>

          <TeacherProfileSection title={dict.qualifications} icon={GraduationCap} lang={lang}>
            {profile.educations.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-muted-foreground">
                {dict.noQualifications}
              </div>
            ) : (
              <div className="space-y-4">
                {profile.educations.map((edu, index) => (
                  <Card
                    key={edu.id || edu.universityName}
                    className="overflow-hidden border bg-background/60 transition-colors hover:border-primary/20"
                  >
                    <CardContent className="flex gap-4 p-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-muted sm:h-20 sm:w-20">
                        <Image
                          src={getDegreeImageUrl(edu.degreeImage)}
                          alt={edu.universityName}
                          fill
                          className="object-contain p-1.5"
                          sizes="80px"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-semibold leading-snug">{edu.universityName}</p>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <Badge variant="outline" className={cn('font-normal', degreeBadgeClass(edu.degreeType))}>
                          {degreeLabel(edu.degreeType, dict)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TeacherProfileSection>
        </div>

        <div className="space-y-8 lg:col-span-5">
          <TeacherProfileSection
            title={dict.skills}
            icon={Award}
            lang={lang}
            className="h-full"
          >
            <TeacherSkillsSection
              skills={profile.skills}
              lang={lang}
              title=""
              emptyLabel={dict.noSkills}
              embedded
            />
          </TeacherProfileSection>
        </div>
      </div>

      {profile.resume?.approvalStatus === 'approved' && profile.resume.pdfFileUrl ? (
        <TeacherResumeSection
          resume={profile.resume}
          lang={lang}
          dict={{
            title: dict.resume,
            viewPdf: dict.resumeViewPdf,
            download: dict.resumeDownload,
          }}
        />
      ) : null}

      <TeacherProfileSection title={dict.publishedCourses} icon={PlayCircle} lang={lang}>
        <TeacherCoursesSection
          courses={profile.courses}
          lang={lang}
          title=""
          emptyLabel={dict.noCourses}
          viewCourseLabel={dict.viewCourse}
        />
      </TeacherProfileSection>
    </div>
  );
}
