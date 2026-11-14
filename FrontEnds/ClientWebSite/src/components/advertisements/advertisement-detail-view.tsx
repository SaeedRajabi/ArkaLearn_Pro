'use client';



import Link from 'next/link';
import { RichHtmlContent } from '@/components/shared/rich-html-content';

import { AdvertisementContactUnlock } from '@/components/advertisements/advertisement-contact-unlock';

import { MessageCircle, Star, ThumbsUp, Clock3 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Alert, AlertDescription } from '@/components/ui/alert';

import getInitials from '@/components/shared/avatar-initializer';

import { FollowTeacherButton } from '@/components/features/teachers/follow-teacher-button';

import { formatActiveDuration, formatPrice } from '@/lib/advertisement-utils';

import type { TeacherAdvertisement } from '@/lib/api/teacher-advertisements';

import { getUserImageUrl } from '@/lib/utils/image-url';



type Props = {

  ad: TeacherAdvertisement;

  stats?: { points: number; reviewCount: number; likeCount: number; memberSinceUtc?: string; subjectNames?: string };

  dict: Record<string, string>;

  isPreview?: boolean;

};



export function AdvertisementDetailView({ ad, stats, dict, isPreview }: Props) {

  const subjects = stats?.subjectNames || ad.title;

  const tags = ad.tags ?? [];

  return (

    <div className="space-y-8">

      {isPreview ? (

        <Alert className="border-primary/30 bg-primary/5">

          <AlertDescription>{dict.previewBanner ?? 'Preview mode — only you can see this page.'}</AlertDescription>

        </Alert>

      ) : null}



      <Card className="overflow-hidden">

        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-start">

          <Avatar className="h-28 w-28 ring-4 ring-background">

            <AvatarImage src={getUserImageUrl(ad.teacherAvatarUrl)} alt={ad.teacherDisplayName ?? ''} />

            <AvatarFallback>{getInitials(ad.teacherDisplayName ?? ad.title)}</AvatarFallback>

          </Avatar>

          <div className="flex-1 space-y-3">

            <div className="flex flex-wrap items-start gap-2">

              <div className="flex-1">

                <h1 className="font-headline text-2xl font-bold md:text-3xl">{ad.teacherDisplayName}</h1>

                <p className="mt-1 text-lg text-primary">{ad.title}</p>

              </div>

              {!isPreview ? (
                <FollowTeacherButton
                  teacherId={ad.teacherId}
                  initialIsFollowing={ad.isFollowing}
                  lang={(dict.lang as 'en' | 'fa') ?? 'fa'}
                  size="sm"
                  labels={{
                    follow: dict.followTeacher,
                    unfollow: dict.unfollowTeacher,
                    following: dict.followingTeacher,
                  }}
                />
              ) : null}

              {(ad.listingStarLevel ?? 0) > 0 ? (

                <Badge variant="secondary" className="text-sm">

                  <Star className="mr-1 h-3.5 w-3.5 text-amber-500" />

                  {ad.listingStarLevel}★ {dict.featuredListing ?? 'Featured'}

                </Badge>

              ) : null}

            </div>

            {tags.length > 0 ? (

              <div>

                <p className="mb-1 text-sm font-medium text-muted-foreground">{dict.tags ?? 'Tags'}</p>

                <div className="flex flex-wrap gap-2">

                  {tags.map((tag) => (

                    <Badge key={tag} variant="outline">{tag}</Badge>

                  ))}

                </div>

              </div>

            ) : null}

            {subjects ? (

              <div>

                <p className="mb-1 text-sm font-medium text-muted-foreground">{dict.subjects}</p>

                <div className="flex flex-wrap gap-2">

                  {subjects.split('،').map((s) => (

                    <Badge key={s.trim()} variant="secondary">{s.trim()}</Badge>

                  ))}

                </div>

              </div>

            ) : null}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">

              <span className="inline-flex items-center gap-1">

                <Star className="h-4 w-4 text-amber-500" />

                {stats?.points ?? 0}

              </span>

              <span className="inline-flex items-center gap-1">

                <MessageCircle className="h-4 w-4" />

                {stats?.reviewCount ?? 0}

              </span>

              <span className="inline-flex items-center gap-1">

                <ThumbsUp className="h-4 w-4" />

                {stats?.likeCount ?? 0}

              </span>

              <span className="inline-flex items-center gap-1">

                <Clock3 className="h-4 w-4" />

                {formatActiveDuration(stats?.memberSinceUtc, {

                  days: dict.days ?? 'days',

                  months: dict.months ?? 'months',

                  years: dict.years ?? 'years',

                })}

              </span>

            </div>

            <div className="flex flex-wrap gap-4 text-sm">

              {ad.hourlyTeachingCost != null ? (

                <span>{dict.hourlyCost}: {formatPrice(ad.hourlyTeachingCost)}</span>

              ) : null}

              {ad.privateTeachingCost != null ? (

                <span>{dict.privateCost}: {formatPrice(ad.privateTeachingCost)}</span>

              ) : null}

            </div>

            {ad.teacherUserName && !isPreview ? (

              <Button asChild variant="outline">

                <Link href={`/teachers/${encodeURIComponent(ad.teacherUserName)}`}>{dict.viewProfile}</Link>

              </Button>

            ) : null}

          </div>

        </CardContent>

      </Card>



      {ad.workExperience ? (

        <Card>

          <CardHeader>

            <CardTitle>{dict.experience}</CardTitle>

          </CardHeader>

          <CardContent>

            <p className="whitespace-pre-wrap text-muted-foreground">{ad.workExperience}</p>

          </CardContent>

        </Card>

      ) : null}



      {ad.descriptionHtml ? (

        <Card>

          <CardHeader>

            <CardTitle>{dict.description}</CardTitle>

          </CardHeader>

          <CardContent>

            <RichHtmlContent html={ad.descriptionHtml} className="prose-sm" />

          </CardContent>

        </Card>

      ) : null}



      <Card>

        <CardHeader>

          <CardTitle>{dict.contact}</CardTitle>

        </CardHeader>

        <CardContent className="space-y-3 text-sm">
          <AdvertisementContactUnlock
            teacherId={ad.teacherId}
            contactPhone={ad.contactPhone}
            websiteUrl={ad.websiteUrl}
            websiteTitle={ad.websiteTitle}
            baleLink={ad.baleLink}
            telegramLink={ad.telegramLink}
            whatsAppLink={ad.whatsAppLink}
            gitHubLink={ad.gitHubLink}
            linkedInLink={ad.linkedInLink}
            canShowContact={ad.canShowContact}
            hasContactDetails={ad.hasContactDetails}
            dict={dict}
          />
        </CardContent>

      </Card>

    </div>

  );

}

