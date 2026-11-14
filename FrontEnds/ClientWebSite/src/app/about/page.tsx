import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { buildContentMetadata } from '@/lib/seo';
import { BRAND_OG_IMAGE_PATH } from '@/lib/seo/brand';
import { PageWithBreadcrumb } from '@/components/shared';
import { PlaceHolderImages } from '@/lib/constants/placeholder-images';
import { JsonLdPerson } from '@/components/shared/json-ld-person';
import { AboutPageClient } from '@/components/about-page-client';
import { getAboutUsPage } from '@/lib/api';

/** Cache rendered HTML so crawlers get a stable response even if the API is briefly unavailable. */
export const revalidate = 3600;

export const metadata: Metadata = buildContentMetadata({
  title: 'درباره ما | Saeed Rajabi — آرکا نرم افزار',
  description:
    'آشنایی با Saeed Rajabi (سعید رجبی)، برنامه‌نویس برتر و بنیان‌گذار Arka Norm Software / ArkaSoftware. آموزش تخصصی برنامه‌نویسی، دوره‌ها، سمینارها و مقالات فناوری.',
  path: '/about',
  image: BRAND_OG_IMAGE_PATH,
  ogType: 'profile',
  keywordsExtra: [
    'Saeed Rajabi',
    'سعید رجبی',
    'Arka Norm Software',
    'آرکا نرم افزار',
    'ArkaSoftware',
    'top programmer',
    'برنامه نویس برتر',
    'programmer',
    'برنامه نویسی',
    'programming',
    'آموزش برنامه نویسی',
  ],
});

export default async function AboutPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const pageDict:any = dict.aboutPage;
  const aboutContent = await getAboutUsPage();

  const breadcrumbs = [
    { label: pageDict.home, href: '/' },
    { label: aboutContent?.heroTitle || pageDict.title, href: '/about' },
  ];

  const aboutHeroImage = PlaceHolderImages.find((p) => p.id === 'about-hero');

  return (
    <PageWithBreadcrumb
      title={aboutContent?.heroTitle || pageDict.title}
      subtitle={aboutContent?.heroSubtitle || pageDict.subtitle}
      breadcrumbs={breadcrumbs}
      dict={dict}
      withContainer={false}
    >
      <JsonLdPerson />
      <AboutPageClient
        lang={lang}
        dict={dict}
        aboutContent={aboutContent}
        aboutHeroImage={aboutHeroImage ?? undefined}
      />
    </PageWithBreadcrumb>
  );
}
