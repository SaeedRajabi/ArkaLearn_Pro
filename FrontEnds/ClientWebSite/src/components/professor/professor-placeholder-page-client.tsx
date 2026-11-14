'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';

export function ProfessorPlaceholderPageClient({
  dict,
  titleKey,
  defaultTitle,
  descriptionKey,
  defaultDescription,
  profileHref = '/professor/profile',
}: {
  dict: Dictionary;
  titleKey: string;
  defaultTitle: string;
  descriptionKey: string;
  defaultDescription: string;
  profileHref?: string;
}) {
  const title = getDictValue(dict, titleKey, defaultTitle);
  const description = getDictValue(dict, descriptionKey, defaultDescription);

  return (
    <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={profileHref}>
              {getDictValue(dict, 'professorDashboard.cards.editProfile', 'Edit profile')}
            </Link>
          </Button>
        </CardContent>
      </Card>
  );
}
