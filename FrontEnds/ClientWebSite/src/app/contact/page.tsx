import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { getContactUsPage } from '@/lib/api/contact';
import { buildContentMetadata } from '@/lib/seo';
import { BRAND_OG_IMAGE_PATH } from '@/lib/seo/brand';
import { PageWithBreadcrumb } from '@/components/shared';
import { ContactPageClient } from '@/components/contact-page-client';

export const metadata: Metadata = buildContentMetadata({
  title: 'تماس با ما | آرکا نرم افزار',
  description:
    'با تیم آرکا نرم افزار تماس بگیرید. درخواست مشاوره، نمایندگی فروش و پشتیبانی از طریق فرم تماس یا شماره و ایمیل رسمی شرکت.',
  path: '/contact',
  image: BRAND_OG_IMAGE_PATH,
  keywordsExtra: ['تماس با ما', 'contact', 'ArkaSoftware', 'آرکا نرم افزار'],
});

export default async function ContactPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);
  const pageDict: Record<string, string> = (dict as { contactPage?: Record<string, string> }).contactPage ?? {};
  const contactContent = await getContactUsPage();

  const breadcrumbs = [
    { label: pageDict.home ?? (lang === 'fa' ? 'خانه' : 'Home'), href: '/' },
    {
      label: contactContent?.pageTitle?.trim() || pageDict.title || (lang === 'fa' ? 'تماس با ما' : 'Contact Us'),
      href: '/contact',
    },
  ];

  return (
    <PageWithBreadcrumb
      title={contactContent?.pageTitle?.trim() || pageDict.title || (lang === 'fa' ? 'تماس با ما' : 'Contact Us')}
      subtitle={contactContent?.pageSubtitle?.trim() || pageDict.subtitle}
      breadcrumbs={breadcrumbs}
      dict={dict}
      withContainer={false}
    >
      <ContactPageClient
        lang={lang}
        dict={pageDict as Parameters<typeof ContactPageClient>[0]['dict']}
        contactContent={contactContent}
      />
    </PageWithBreadcrumb>
  );
}
