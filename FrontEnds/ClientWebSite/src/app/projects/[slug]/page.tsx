import { notFound } from 'next/navigation';

import { cookies } from 'next/headers';

import type { Metadata } from 'next';

import { getProjectBySlug } from '@/lib/data-server';

import { getDictionary } from '@/lib/i18n';

import { buildContentMetadata } from '@/lib/seo';

import { buildMetaDescription } from '@/lib/seo/meta-helpers';

import { ProjectHero, ProjectDetailContent } from '@/components/features/projects';

import { JsonLdProject } from '@/components/shared/json-ld-project';

import { JsonLdBreadcrumb } from '@/components/shared/json-ld-breadcrumb';



type Props = { params: Promise<{ slug: string }> };



export async function generateMetadata({ params }: Props): Promise<Metadata> {

  const { slug } = await params;

  const project = await getProjectBySlug(slug);

  if (!project) return { robots: { index: false, follow: true } };

  const description = buildMetaDescription(project.shortDescription, project.title, 160);

  return buildContentMetadata({

    title: project.title,

    description,

    path: `/projects/${slug}`,

    image: project.thumbnailUrl,

    tags: [...project.tags, ...project.technologies],

    keywordsExtra: [...project.tags, ...project.technologies],

  });

}



export default async function ProjectPage({ params }: Props) {

  const { slug } = await params;

  const project = await getProjectBySlug(slug);



  if (!project) notFound();



  const cookieStore = await cookies();

  const lang = (cookieStore.get('lang')?.value || 'fa') as 'en' | 'fa';

  const dict = await getDictionary(lang);

  const description = buildMetaDescription(project.shortDescription, project.title, 200);



  return (

    <article className="overflow-x-hidden">

      <JsonLdProject

        title={project.title}

        description={description}

        path={`/projects/${slug}`}

        image={project.thumbnailUrl}

        authorName={project.authorName}

        technologies={project.technologies}

        tags={project.tags}

        codeRepository={project.gitHubUrl}

        liveUrl={project.projectUrl}

        datePublished={project.publishedAt ?? project.createdAt}

      />

      <JsonLdBreadcrumb

        items={[

          { name: lang === 'fa' ? 'خانه' : 'Home', path: '/' },

          { name: lang === 'fa' ? 'پروژه‌ها' : 'Projects', path: '/projects' },

          { name: project.title, path: `/projects/${slug}` },

        ]}

      />

      <ProjectHero project={project} lang={lang} />

      <div className="bg-muted/30 overflow-x-hidden">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">

          <ProjectDetailContent project={project} dict={dict} lang={lang} />

        </div>

      </div>

    </article>

  );

}

