'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft, ClipboardCheck, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/components/language-provider';
import { asLongId, isValidLongId } from '@/lib/id';
import { searchAdminTeachers, type AdminTeacherRow } from '@/services/admin-teachers-api.service';
import type { ArkaBookItem, ArkaPromotionalVideoItem } from '@/services/arka-content-api.service';
import { ArkaBooksTable } from '@/app/dashboard/arka-content/books/components/arka-books-table';
import { ArkaVideosTable } from '@/app/dashboard/arka-content/videos/components/arka-videos-table';
import { AddArkaBookModal } from '@/app/dashboard/arka-content/books/components/add-arka-book-modal';
import { AddArkaVideoModal } from '@/app/dashboard/arka-content/videos/components/add-arka-video-modal';

export default function TeacherContentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = asLongId(params.userId);
  const teacherIdFromQuery = Number(searchParams.get('teacherId') || 0);
  const { t } = useLanguage();

  const [teacher, setTeacher] = React.useState<AdminTeacherRow | null>(null);
  const [activeTab, setActiveTab] = React.useState<'books' | 'videos'>('books');
  const [booksRefreshKey, setBooksRefreshKey] = React.useState(0);
  const [videosRefreshKey, setVideosRefreshKey] = React.useState(0);
  const [bookModalOpen, setBookModalOpen] = React.useState(false);
  const [videoModalOpen, setVideoModalOpen] = React.useState(false);
  const [editingBook, setEditingBook] = React.useState<ArkaBookItem | null>(null);
  const [editingVideo, setEditingVideo] = React.useState<ArkaPromotionalVideoItem | null>(null);

  React.useEffect(() => {
    if (!isValidLongId(userId)) {
      setTeacher(null);
      return;
    }
    void searchAdminTeachers({ inputValue: userId, pageNumber: 1, pageSize: 50 })
      .then((res) => {
        const match = res.items.find((row) => row.userId === userId);
        setTeacher(match ?? null);
      })
      .catch(() => setTeacher(null));
  }, [userId]);

  const teacherId = teacherIdFromQuery > 0 ? teacherIdFromQuery : teacher?.teacherId ?? 0;
  const teacherName = teacher?.displayName || teacher?.userName || userId;
  const moderationHref =
    teacherId > 0
      ? `/dashboard/teacher-content-moderation?teacherId=${teacherId}`
      : '/dashboard/teacher-content-moderation';

  const openBookModal = (item: ArkaBookItem | null = null) => {
    setEditingBook(item);
    setBookModalOpen(true);
  };

  const openVideoModal = (item: ArkaPromotionalVideoItem | null = null) => {
    setEditingVideo(item);
    setVideoModalOpen(true);
  };

  if (!isValidLongId(userId)) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/users/teachers">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t('portal_students_back')}
          </Link>
        </Button>
        <p className="text-muted-foreground">{t('teacher_content_invalid_user')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/users/teachers">
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('portal_students_back')}
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('teacher_content_manage_title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('teacher_content_manage_description', { name: teacherName })}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={moderationHref}>
            <ClipboardCheck className="me-2 h-4 w-4" />
            {t('action_content_moderation_queue')}
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'books' | 'videos')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="books">{t('teacher_content_books_tab')}</TabsTrigger>
            <TabsTrigger value="videos">{t('teacher_content_videos_tab')}</TabsTrigger>
          </TabsList>
          {activeTab === 'books' ? (
            <Button size="sm" onClick={() => openBookModal()}>
              <PlusCircle className="me-2 h-4 w-4" />
              {t('arka_books_new_button')}
            </Button>
          ) : (
            <Button size="sm" onClick={() => openVideoModal()}>
              <PlusCircle className="me-2 h-4 w-4" />
              {t('arka_videos_new_button')}
            </Button>
          )}
        </div>

        <TabsContent value="books" className="mt-4">
          <ArkaBooksTable
            teacherUserId={userId}
            refreshKey={booksRefreshKey}
            onEditAction={openBookModal}
          />
        </TabsContent>
        <TabsContent value="videos" className="mt-4">
          <ArkaVideosTable
            teacherUserId={userId}
            refreshKey={videosRefreshKey}
            onEditAction={openVideoModal}
          />
        </TabsContent>
      </Tabs>

      <AddArkaBookModal
        open={bookModalOpen}
        onOpenChangeAction={setBookModalOpen}
        book={editingBook}
        teacherUserId={userId}
        onSuccessAction={() => setBooksRefreshKey((k) => k + 1)}
      />
      <AddArkaVideoModal
        open={videoModalOpen}
        onOpenChangeAction={setVideoModalOpen}
        video={editingVideo}
        teacherUserId={userId}
        onSuccessAction={() => setVideosRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
