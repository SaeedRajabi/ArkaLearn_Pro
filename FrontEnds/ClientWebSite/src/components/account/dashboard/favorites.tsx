'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CourseCard } from '@/components/course-card';
import { getMyFavoriteCourses } from '@/lib/api/courses';
import { getMyFavoriteSeminars } from '@/lib/api/seminars';
import { getMyFavoriteArticles } from '@/lib/api/articles';
import { getDictValue } from '@/lib/i18n-client';
import type { ArticleListItem, CourseListItem, Dictionary, SeminarListItem } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SeminarCard } from '@/components/seminar-card';
import { ArticleCard } from '@/components/article-card';
import { Button } from '@/components/ui/button';
import { getArticleImageUrl, getCourseImageUrl, getSeminarImageUrl } from '@/lib/utils/image-url';

export function Favorites({ dict }: { dict: Dictionary }) {
  const [favoriteCourses, setFavoriteCourses] = useState<CourseListItem[]>([]);
  const [favoriteSeminars, setFavoriteSeminars] = useState<SeminarListItem[]>([]);
  const [favoriteArticles, setFavoriteArticles] = useState<ArticleListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'seminars' | 'articles'>('courses');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchFavorites = async () => {
      setIsLoading(true);
      try {
        const [coursesRaw, seminarsRaw, articlesRaw] = await Promise.all([
          getMyFavoriteCourses(),
          getMyFavoriteSeminars(),
          getMyFavoriteArticles(),
        ]);
        const mappedCourses = coursesRaw.map((course) => ({
          id: course.id,
          title: course.title,
          price: course.price ?? 0,
          createAt: course.createAt,
          courseLevel: course.courseLevel,
          shortDescription: course.shortDescription,
          titleImage: getCourseImageUrl(course.titleImage),
          categoryName: course.categoryName,
          status: course.status,
          videoUrl: course.videoUrl,
          studentCount: course.studentCount ?? 0,
        })) as CourseListItem[];
        const mappedSeminars = seminarsRaw.map((seminar) => ({
          id: seminar.id,
          title: seminar.title,
          description: seminar.description,
          startTime: seminar.startTime,
          endTime: seminar.endTime,
          capacity: seminar.capacity,
          registeredCount: seminar.registeredCount,
          price: seminar.price,
          isFree: seminar.isFree,
          status: seminar.status,
          thumbnailUrl: getSeminarImageUrl(seminar.thumbnailUrl),
          roomId: seminar.roomId,
          roomTitle: seminar.roomTitle,
        })) as SeminarListItem[];
        const mappedArticles = articlesRaw.map((article) => ({
          id: article.id,
          title: article.title,
          summary: article.summary,
          slug: article.slug,
          thumbnailUrl: getArticleImageUrl(article.thumbnailUrl),
          isPublished: article.isPublished,
          publishedAt: article.publishedAt,
          categoryName: article.categoryName,
          createdAt: article.createdAt,
        })) as ArticleListItem[];
        setFavoriteCourses(mappedCourses);
        setFavoriteSeminars(mappedSeminars);
        setFavoriteArticles(mappedArticles);
      } catch (err) {
        console.error('Failed to fetch favorites:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const renderLoadingSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

  const favoritesTitle = getDictValue(dict, 'dashboard.favorites.title', 'My Favorites');
  const favoritesSubtitle = getDictValue(dict, 'dashboard.favorites.subtitle', 'Your saved items across courses, seminars, and articles.');
  const searchPlaceholder = getDictValue(dict, 'dashboard.favorites.search', 'Search in favorites...');
  const coursesLabel = getDictValue(dict, 'dashboard.favorites.courses', 'Courses');
  const seminarsLabel = getDictValue(dict, 'dashboard.favorites.seminars', 'Seminars');
  const articlesLabel = getDictValue(dict, 'dashboard.favorites.articles', 'Articles');

  const filteredCourses = useMemo(() => {
    if (!query.trim()) return favoriteCourses;
    const q = query.trim().toLowerCase();
    return favoriteCourses.filter((c) => (c.title ?? '').toLowerCase().includes(q));
  }, [favoriteCourses, query]);

  const filteredSeminars = useMemo(() => {
    if (!query.trim()) return favoriteSeminars;
    const q = query.trim().toLowerCase();
    return favoriteSeminars.filter((s) =>
      [s.title, s.description, s.roomTitle].some((v) => (v ?? '').toLowerCase().includes(q))
    );
  }, [favoriteSeminars, query]);

  const filteredArticles = useMemo(() => {
    if (!query.trim()) return favoriteArticles;
    const q = query.trim().toLowerCase();
    return favoriteArticles.filter((a) =>
      [a.title, a.summary, a.categoryName].some((v) => (v ?? '').toLowerCase().includes(q))
    );
  }, [favoriteArticles, query]);

  const EmptyState = ({ label, href }: { label: string; href: string }) => (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
      <p className="text-sm text-muted-foreground">
        {getDictValue(dict, 'dashboard.favorites.empty', 'No favorites yet.')}
      </p>
      <Button asChild variant="outline" className="mt-4">
        <Link href={href}>
          {getDictValue(dict, 'dashboard.favorites.browse', `Browse ${label}`)}
        </Link>
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{favoritesTitle}</CardTitle>
        <CardDescription>{favoritesSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'courses' | 'seminars' | 'articles')}>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="w-full justify-start sm:w-auto">
              <TabsTrigger value="courses">
                {coursesLabel}
                <Badge variant="secondary" className="ml-2">{favoriteCourses.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="seminars">
                {seminarsLabel}
                <Badge variant="secondary" className="ml-2">{favoriteSeminars.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="articles">
                {articlesLabel}
                <Badge variant="secondary" className="ml-2">{favoriteArticles.length}</Badge>
              </TabsTrigger>
            </TabsList>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full sm:w-64"
            />
          </div>
          <TabsContent value="courses">
            {isLoading ? renderLoadingSkeletons() : (
              filteredCourses.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map(course => (
                    <CourseCard key={course.id} course={course} dict={dict} />
                  ))}
                </div>
              ) : (
                <EmptyState label={coursesLabel} href="/courses" />
              )
            )}
          </TabsContent>
          <TabsContent value="seminars">
            {isLoading ? renderLoadingSkeletons() : (
              filteredSeminars.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSeminars.map(seminar => (
                    <SeminarCard key={seminar.id} seminar={seminar} dict={dict} />
                  ))}
                </div>
              ) : (
                <EmptyState label={seminarsLabel} href="/seminars" />
              )
            )}
          </TabsContent>
          <TabsContent value="articles">
            {isLoading ? renderLoadingSkeletons() : (
              filteredArticles.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map(article => (
                    <ArticleCard key={article.id} article={article} dict={dict} />
                  ))}
                </div>
              ) : (
                <EmptyState label={articlesLabel} href="/articles" />
              )
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
