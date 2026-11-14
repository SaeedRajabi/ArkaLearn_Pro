import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getCourseBySlug } from '@/lib/data-server';
import { getCoursePath } from '@/lib/course-slug';
import { getDictionary } from '@/lib/i18n';
import { buildContentMetadata } from '@/lib/seo';
import { buildMetaDescription } from '@/lib/seo/meta-helpers';
import {
  CourseDetailHeader,
  CourseDetailTabs,
  CourseDetailSidebar,
} from '@/components/features/courses';
import { DetailExploreLinks } from '@/components/shared/detail-explore-links';
import { JsonLdCourse } from '@/components/shared/json-ld-course';
import { JsonLdBreadcrumb } from '@/components/shared/json-ld-breadcrumb';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const course = await getCourseBySlug(rawSlug);
  if (!course) return { robots: { index: false, follow: true } };
  const title = course.seoTitle?.trim() || course.title_en || course.title;
  const desc = course.description_en || course.description;
  const description = course.metaDescription?.trim() || buildMetaDescription(desc, course.title, 160);
  const path = getCoursePath(course.slug);
  return buildContentMetadata({
    title,
    description,
    path,
    image: course.ogImageUrl || course.imageUrl,
    tags: course.tags,
    section: course.category,
    keywordsExtra: course.tags,
  });
}

export default async function CoursePage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const course = await getCourseBySlug(rawSlug);

  if (!course) notFound();

  const canonicalPath = getCoursePath(course.slug);
  const requestedPath = getCoursePath(decodeURIComponent(rawSlug));
  if (canonicalPath !== requestedPath) {
    redirect(canonicalPath);
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';
  const dict: any = await getDictionary(lang);
  const title = lang === 'en' ? course.title_en : course.title;
  const description = buildMetaDescription(course.description, course.title, 200);

  return (
    <article>
      <JsonLdCourse
        title={title}
        description={description}
        path={canonicalPath}
        image={course.imageUrl}
        category={course.category}
        tags={course.tags}
        price={course.price}
      />
      <JsonLdBreadcrumb
        items={[
          { name: lang === 'fa' ? 'خانه' : 'Home', path: '/' },
          { name: lang === 'fa' ? 'دوره‌ها' : 'Courses', path: '/courses' },
          { name: title, path: canonicalPath },
        ]}
      />
      <CourseDetailHeader course={course} dict={dict} lang={lang} />
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="lg:col-span-2">
            <CourseDetailTabs course={course} dict={dict} lang={lang} />
          </div>
          <div className="space-y-6">
            <CourseDetailSidebar course={course} dict={dict} lang={lang} />
            <DetailExploreLinks lang={lang} tags={course.tags} />
          </div>
        </div>
      </div>
    </article>
  );
}
