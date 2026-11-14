'use client';



import * as React from 'react';

import { useRouter } from 'next/navigation';

import { BookOpen, ExternalLink, GraduationCap, Loader2, Video } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { useLanguage } from '@/components/language-provider';

import { CLIENT_SITE_URL } from '@/services/arka-content-api.service';



export default function ArkaContentHubPage() {

  const { t } = useLanguage();

  const router = useRouter();

  const [navigatingHref, setNavigatingHref] = React.useState<string | null>(null);



  const cards = [

    {

      href: '/dashboard/arka-content/books',

      icon: BookOpen,

      titleKey: 'arka_content_books_card_title',

      descKey: 'arka_content_books_card_desc',

    },

    {

      href: '/dashboard/arka-content/videos',

      icon: Video,

      titleKey: 'arka_content_videos_card_title',

      descKey: 'arka_content_videos_card_desc',

    },

    {

      href: '/dashboard/teacher-content-moderation',

      icon: GraduationCap,

      titleKey: 'arka_content_moderation_card_title',

      descKey: 'arka_content_moderation_card_desc',

    },

  ] as const;



  const clientLinks = [

    { href: `${CLIENT_SITE_URL}/professor/books`, labelKey: 'arka_content_client_books' },

    { href: `${CLIENT_SITE_URL}/professor/videos`, labelKey: 'arka_content_client_videos' },

  ] as const;



  const handleNavigate = (href: string) => {

    setNavigatingHref(href);

    router.push(href);

  };



  return (

    <div className="space-y-8">

      <div>

        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('arka_content_title')}</h1>

        <p className="mt-2 text-muted-foreground">{t('arka_content_description')}</p>

      </div>



      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

        {cards.map((card) => {

          const isLoading = navigatingHref === card.href;

          return (

            <Card key={card.href} className="flex flex-col">

              <CardHeader>

                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">

                  <card.icon className="h-5 w-5" />

                </div>

                <CardTitle>{t(card.titleKey)}</CardTitle>

                <CardDescription>{t(card.descKey)}</CardDescription>

              </CardHeader>

              <CardContent className="mt-auto">

                <Button

                  variant="outline"

                  className="w-full"

                  disabled={navigatingHref != null}

                  onClick={() => handleNavigate(card.href)}

                >

                  {isLoading ? (

                    <>

                      <Loader2 className="me-2 h-4 w-4 animate-spin" />

                      {t('arka_content_loading')}

                    </>

                  ) : (

                    t('arka_content_open')

                  )}

                </Button>

              </CardContent>

            </Card>

          );

        })}

      </div>



      <Card>

        <CardHeader>

          <CardTitle>{t('arka_content_client_preview_title')}</CardTitle>

          <CardDescription>{t('arka_content_client_preview_desc')}</CardDescription>

        </CardHeader>

        <CardContent className="flex flex-wrap gap-3">

          {clientLinks.map((link) => (

            <Button key={link.href} asChild variant="secondary">

              <a href={link.href} target="_blank" rel="noopener noreferrer">

                {t(link.labelKey)}

                <ExternalLink className="ms-2 h-4 w-4" />

              </a>

            </Button>

          ))}

        </CardContent>

      </Card>

    </div>

  );

}


