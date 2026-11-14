import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDictionary } from '@/lib/i18n';
import { getDefaultMetadata } from '@/lib/seo';
import { BRAND_DEFAULT_TITLE, BRAND_DESCRIPTION_FA } from '@/lib/seo/brand';
import { getLatestCourses, getLatestProjects, getUpcomingSeminars, getArticlesList, getPublicCategoryTree } from '@/lib/data-server';
import { buildHomeCategorySliderItems } from '@/lib/home-category-slider';
import {
  Hero,
  CourseCategorySlider,
  ContentTabs,
  ProjectsSection,
  SeminarsCarousel,
  ArticlesSection,
  DesktopAppSection,
  JobMarketAction,
} from '@/components/features/home';

export const metadata: Metadata = {
  ...getDefaultMetadata(),
  title: BRAND_DEFAULT_TITLE,
  description: BRAND_DESCRIPTION_FA,
  openGraph: {
    ...getDefaultMetadata().openGraph,
    title: BRAND_DEFAULT_TITLE,
    description: BRAND_DESCRIPTION_FA,
  },
};

export default async function Home() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict = await getDictionary(lang);

  // استفاده از getLatestCourses برای دریافت لیست اصلی دوره‌ها (بدون فیلتر محبوبیت)
  const [courses, projects, seminars, { articles }, categoryTree] = await Promise.all([
    getLatestCourses(12),
    getLatestProjects(12),
    getUpcomingSeminars(6),
    getArticlesList({ pageSize: 6 }),
    getPublicCategoryTree(),
  ]);

  const sliderCategories = buildHomeCategorySliderItems(
    categoryTree,
    lang,
    dict.header as Record<string, string | undefined>
  );

  return (
    <>
      <Hero dict={dict} />
      <CourseCategorySlider dict={dict} categories={sliderCategories} />
      <ContentTabs dict={dict} courses={courses} />
      <SeminarsCarousel dict={dict} seminars={seminars} />
      <ArticlesSection dict={dict} articles={articles} />
      <ProjectsSection dict={dict} projects={projects} />
      <DesktopAppSection dict={dict} />
      <JobMarketAction dict={dict} />
    </>
  );
}
