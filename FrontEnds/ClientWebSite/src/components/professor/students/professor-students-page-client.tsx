'use client';



import * as React from 'react';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { FolderOpen, Loader2, Pencil, Phone, Search, Trash2, Users, KeyRound } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Skeleton } from '@/components/ui/skeleton';

import {

  AlertDialog,

  AlertDialogAction,

  AlertDialogCancel,

  AlertDialogContent,

  AlertDialogDescription,

  AlertDialogFooter,

  AlertDialogHeader,

  AlertDialogTitle,

} from '@/components/ui/alert-dialog';

import {

  Pagination,

  PaginationContent,

  PaginationItem,

  PaginationLink,

  PaginationNext,

  PaginationPrevious,

} from '@/components/ui/pagination';

import {

  removeTeacherStudent,

  searchProfessorStudents,

  type ProfessorStudent,

} from '@/lib/api/professor-students';

import { ProfessorPortalStudentFormDialog, type PortalStudentSavedPayload } from '@/components/professor/students/professor-portal-student-form-dialog';
import { ProfessorDesktopLicensePanel } from '@/components/professor/students/professor-desktop-license-panel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { getDictValue } from '@/lib/i18n-client';

import { useLanguage } from '@/contexts/language-context';

import { useToast } from '@/hooks/use-toast';

import { cn } from '@/lib/utils';

import { usePagination, DOTS } from '@/hooks/use-pagination';

import type { Dictionary } from '@/types';



const PAGE_SIZE = 8;



type Props = { dict: Dictionary };



type GroupedStudent = {

  userId: string;

  fullName: string;

  userName?: string;

  email?: string;

  phoneNumber?: string;

  managedRoomStudentId?: number | null;

  enrollments: ProfessorStudent[];

};



function groupStudents(rows: ProfessorStudent[]): GroupedStudent[] {

  const map = new Map<string, GroupedStudent>();

  for (const row of rows) {

    const existing = map.get(row.userId);

    if (!existing) {

      map.set(row.userId, {

        userId: row.userId,

        fullName: row.fullName,

        userName: row.userName,

        email: row.email,

        phoneNumber: row.phoneNumber,

        managedRoomStudentId: row.managedRoomStudentId,

        enrollments: [row],

      });

      continue;

    }

    existing.enrollments.push(row);

    if (row.managedRoomStudentId && !existing.managedRoomStudentId) {

      existing.managedRoomStudentId = row.managedRoomStudentId;

    }

  }

  return Array.from(map.values());

}



function RtlSearchInput({

  isRtl,

  value,

  onChange,

  placeholder,

}: {

  isRtl: boolean;

  value: string;

  onChange: (value: string) => void;

  placeholder: string;

}) {

  return (

    <div className={cn('flex w-full', isRtl ? 'justify-end' : 'justify-start')} dir="ltr">

      <div className="relative w-full sm:max-w-lg">

        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input

          dir={isRtl ? 'rtl' : 'ltr'}

          className={cn(

            'h-11 w-full rounded-xl border-border/70 bg-background/80 pl-10 pr-4 shadow-sm',

            isRtl ? 'text-right' : 'text-left'

          )}

          placeholder={placeholder}

          value={value}

          onChange={(e) => onChange(e.target.value)}

        />

      </div>

    </div>

  );

}



export function ProfessorStudentsPageClient({ dict }: Props) {

  const router = useRouter();

  const { toast } = useToast();

  const { locale } = useLanguage();

  const isRtl = locale === 'fa';

  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);



  const [students, setStudents] = React.useState<ProfessorStudent[]>([]);

  const [totalCount, setTotalCount] = React.useState(0);

  const [page, setPage] = React.useState(1);

  const [search, setSearch] = React.useState('');

  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  const [initialLoading, setInitialLoading] = React.useState(true);

  const [listLoading, setListLoading] = React.useState(false);

  const hasLoadedOnceRef = React.useRef(false);



  const [editUserId, setEditUserId] = React.useState<string | null>(null);

  const [editStudentInitial, setEditStudentInitial] = React.useState<GroupedStudent | null>(null);

  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  const [editFormLoading, setEditFormLoading] = React.useState(false);

  const [pendingAction, setPendingAction] = React.useState<{ userId: string; type: 'edit' | 'files' } | null>(null);

  const [deleteTarget, setDeleteTarget] = React.useState<GroupedStudent | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [licenseTarget, setLicenseTarget] = React.useState<GroupedStudent | null>(null);



  const title = t('professorDashboard.menu.students', isRtl ? 'دانشجویان' : 'Students');

  const subtitle = t(

    'professorDashboard.students.subtitle',

    isRtl

      ? 'دانشجویان ثبت‌نام‌شده در دوره‌ها و سمینارهای شما'

      : 'Students enrolled in your courses and seminars'

  );

  const emptyText = t(

    'professorDashboard.students.empty',

    isRtl

      ? 'هنوز دانشجویی در دوره‌ها یا سمینارهای شما ثبت‌نام نکرده است.'

      : 'No students have enrolled in your courses or seminars yet.'

  );

  const noResultsText = t(

    'professorDashboard.students.noResults',

    isRtl ? 'دانشجویی با این جستجو یافت نشد.' : 'No students match your search.'

  );

  const phoneLabel = t('professorDashboard.students.phone', isRtl ? 'تماس' : 'Phone');



  React.useEffect(() => {

    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);

    return () => window.clearTimeout(timer);

  }, [search]);



  React.useEffect(() => {

    setPage(1);

  }, [debouncedSearch]);



  const loadStudents = React.useCallback(async () => {

    const silent = hasLoadedOnceRef.current;

    if (silent) setListLoading(true);

    else setInitialLoading(true);



    try {

      const data = await searchProfessorStudents({

        search: debouncedSearch,

        pageNumber: page,

        pageSize: PAGE_SIZE,

      });

      setStudents(data.queryResult);

      setTotalCount(data.totalCount);

    } catch {

      setStudents([]);

      setTotalCount(0);

    } finally {

      hasLoadedOnceRef.current = true;

      setInitialLoading(false);

      setListLoading(false);

    }

  }, [debouncedSearch, page]);



  React.useEffect(() => {

    void loadStudents();

  }, [loadStudents]);



  const grouped = React.useMemo(() => groupStudents(students), [students]);



  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const paginationRange = usePagination({

    totalCount,

    pageSize: PAGE_SIZE,

    currentPage: page,

    siblingCount: 1,

  });



  const formatPhone = (value?: string) => {

    const trimmed = value?.trim();

    if (!trimmed) return isRtl ? 'ثبت نشده' : 'Not provided';

    return trimmed;

  };

  React.useEffect(() => {
    if (!editFormLoading && pendingAction?.type === 'edit') {
      setPendingAction(null);
    }
  }, [editFormLoading, pendingAction?.type]);

  const handleEditDialogOpenChange = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setPendingAction(null);
      setEditStudentInitial(null);
    }
  };

  const openEdit = (student: GroupedStudent) => {

    setPendingAction({ userId: student.userId, type: 'edit' });

    setEditStudentInitial(student);

    setEditUserId(student.userId);

    setEditDialogOpen(true);

  };



  const openFiles = (student: GroupedStudent) => {

    if (!student.managedRoomStudentId) {
      setPendingAction(null);

      toast({

        variant: 'destructive',

        title: t('professorDashboard.students.filesNeedCredentials', isRtl ? 'نیاز به تنظیمات' : 'Setup required'),

        description: t(

          'professorDashboard.students.filesNeedCredentialsDesc',

          isRtl

            ? 'ابتدا با «ویرایش» نام کاربری و رمز ورود اتاق را برای این دانشجو تعریف کنید.'

            : 'Use Edit to set room username and password for this student first.'

        ),

      });

      return;

    }

    setPendingAction({ userId: student.userId, type: 'files' });

    const name = encodeURIComponent(student.fullName.trim());

    router.push(

      `/professor/room-students/${student.managedRoomStudentId}/files?name=${name}&from=students`

    );

  };



  const handleDelete = async () => {

    if (!deleteTarget) return;

    setDeleting(true);

    try {

      await removeTeacherStudent(deleteTarget.userId);

      toast({

        title: t('professorDashboard.students.deleted', isRtl ? 'دانشجو حذف شد' : 'Student removed'),

        description: t(

          'professorDashboard.students.deletedDesc',

          isRtl

            ? 'ثبت‌نام این دانشجو در دوره‌ها و سمینارهای شما لغو شد.'

            : 'This student was unenrolled from your courses and seminars.'

        ),

      });

      setDeleteTarget(null);

      await loadStudents();

    } catch {

      toast({

        variant: 'destructive',

        title: t('professorDashboard.students.deleteFailed', isRtl ? 'خطا' : 'Error'),

        description: t(

          'professorDashboard.students.deleteFailedDesc',

          isRtl ? 'حذف دانشجو انجام نشد.' : 'Could not remove student.'

        ),

      });

    } finally {

      setDeleting(false);

    }

  };

  const handleStudentSaved = (payload: PortalStudentSavedPayload) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.userId === payload.userId
          ? {
              ...s,
              fullName: payload.fullName,
              userName: payload.roomUserName,
              managedRoomStudentId: payload.managedRoomStudentId,
            }
          : s
      )
    );
    void loadStudents();
  };



  return (

    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>

      <div>

        <h1 className="text-2xl font-bold">{title}</h1>

        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

      </div>



      <Card>

        <CardHeader className="space-y-4">

          <div>

            <CardTitle className="flex items-center gap-2">

              <Users className="h-5 w-5" />

              {title}

            </CardTitle>

            <CardDescription>{subtitle}</CardDescription>

          </div>

          <RtlSearchInput

            isRtl={isRtl}

            value={search}

            onChange={setSearch}

            placeholder={t(

              'professorDashboard.students.search',

              isRtl ? 'جستجو بر اساس نام، ایمیل، تماس یا عنوان دوره/سمینار…' : 'Search by name, email, phone, or course/seminar…'

            )}

          />

        </CardHeader>

        <CardContent>

          {initialLoading ? (

            <div className="space-y-3">

              {Array.from({ length: 4 }).map((_, i) => (

                <Skeleton key={i} className="h-28 w-full rounded-xl" />

              ))}

            </div>

          ) : grouped.length === 0 ? (

            <p className="text-sm text-muted-foreground">{debouncedSearch ? noResultsText : emptyText}</p>

          ) : (

            <div className="space-y-4">

              <div className="relative space-y-3">

                {listLoading ? (

                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-[1px]">

                    <Loader2 className="h-6 w-6 animate-spin text-primary" />

                  </div>

                ) : null}



                {grouped.map((s) => (

                  <div

                    key={s.userId}

                    className="flex flex-col gap-4 rounded-xl border p-4 lg:flex-row lg:items-start lg:justify-between"

                  >

                    <div className="min-w-0 flex-1 space-y-2 text-start">

                      <p className="font-medium">{s.fullName || s.userName || s.email || `#${s.userId}`}</p>

                      <p className="text-sm text-muted-foreground">{s.email || s.userName || ''}</p>

                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">

                        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />

                        <span>

                          {phoneLabel}: {formatPhone(s.phoneNumber)}

                        </span>

                      </p>

                      <div className="space-y-1.5 pt-1">

                        {s.enrollments.map((e) => (

                          <div key={`${e.sourceType}-${e.sourceId}`} className="flex flex-wrap items-center gap-2 text-sm">

                            {e.sourceType === 'course' ? (

                              <Link href={`/professor/courses/${e.sourceId}`} className="text-primary hover:underline">

                                {e.sourceTitle}

                              </Link>

                            ) : (

                              <span>{e.sourceTitle}</span>

                            )}

                            <Badge variant="outline" className="text-xs">

                              {e.sourceType === 'course'

                                ? t('professorDashboard.students.course', isRtl ? 'دوره' : 'Course')

                                : t('professorDashboard.students.seminar', isRtl ? 'سمینار' : 'Seminar')}

                            </Badge>

                            <Badge variant={e.isActive ? 'default' : 'secondary'} className="text-xs">

                              {e.isActive

                                ? t('professorDashboard.students.active', isRtl ? 'فعال' : 'Active')

                                : t('professorDashboard.students.pending', isRtl ? 'در انتظار' : 'Pending')}

                            </Badge>

                            <span className="text-xs text-muted-foreground">{e.registeredAt}</span>

                          </div>

                        ))}

                      </div>

                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">

                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={Boolean(pendingAction) || editFormLoading}
                        onClick={() => openEdit(s)}
                      >
                        {pendingAction?.userId === s.userId && pendingAction.type === 'edit' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Pencil className="h-3.5 w-3.5" />
                        )}
                        {t('professorDashboard.roomStudents.edit', isRtl ? 'ویرایش' : 'Edit')}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={Boolean(pendingAction) || editFormLoading}
                        onClick={() => openFiles(s)}
                      >
                        {pendingAction?.userId === s.userId && pendingAction.type === 'files' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FolderOpen className="h-3.5 w-3.5" />
                        )}
                        {t('professorDashboard.students.manageFiles', isRtl ? 'مدیریت فایل‌ها' : 'Manage files')}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={Boolean(pendingAction) || editFormLoading}
                        onClick={() => setLicenseTarget(s)}
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        {t('professorDashboard.students.desktopLicenses', isRtl ? 'لایسنس دسکتاپ' : 'Desktop licenses')}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        disabled={deleting || Boolean(pendingAction) || editFormLoading}
                        onClick={() => setDeleteTarget(s)}
                      >
                        {deleteTarget?.userId === s.userId && deleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        {t('professorDashboard.students.delete', isRtl ? 'حذف' : 'Remove')}
                      </Button>

                    </div>

                  </div>

                ))}

              </div>



              {totalCount > PAGE_SIZE ? (

                <Pagination>

                  <PaginationContent>

                    <PaginationItem>

                      <PaginationPrevious

                        href="#"

                        onClick={(e) => {

                          e.preventDefault();

                          if (page > 1) setPage((p) => p - 1);

                        }}

                        className={page <= 1 ? 'pointer-events-none opacity-50' : ''}

                      />

                    </PaginationItem>

                    {paginationRange.map((item, idx) =>

                      item === DOTS ? (

                        <PaginationItem key={`dots-${idx}`}>

                          <span className="px-2">…</span>

                        </PaginationItem>

                      ) : (

                        <PaginationItem key={item}>

                          <PaginationLink

                            href="#"

                            isActive={item === page}

                            onClick={(e) => {

                              e.preventDefault();

                              setPage(item);

                            }}

                          >

                            {item}

                          </PaginationLink>

                        </PaginationItem>

                      )

                    )}

                    <PaginationItem>

                      <PaginationNext

                        href="#"

                        onClick={(e) => {

                          e.preventDefault();

                          if (page < totalPages) setPage((p) => p + 1);

                        }}

                        className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}

                      />

                    </PaginationItem>

                  </PaginationContent>

                </Pagination>

              ) : null}

            </div>

          )}

        </CardContent>

      </Card>



      <ProfessorPortalStudentFormDialog

        dict={dict}

        open={editDialogOpen}

        onOpenChange={handleEditDialogOpenChange}

        portalUserId={editUserId}

        initialStudent={
          editStudentInitial
            ? {
                fullName: editStudentInitial.fullName,
                userName: editStudentInitial.userName,
                email: editStudentInitial.email,
                phoneNumber: editStudentInitial.phoneNumber,
              }
            : null
        }

        onLoadingChange={setEditFormLoading}

        onSaved={handleStudentSaved}

      />



      <AlertDialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>

        <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'}>

          <AlertDialogHeader>

            <AlertDialogTitle>

              {t('professorDashboard.students.deleteTitle', isRtl ? 'حذف دانشجو' : 'Remove student')}

            </AlertDialogTitle>

            <AlertDialogDescription>

              {t(

                'professorDashboard.students.deleteConfirm',

                isRtl

                  ? `آیا از حذف «${deleteTarget?.fullName ?? ''}» مطمئن هستید؟ ثبت‌نام او در همه دوره‌ها و سمینارهای شما لغو می‌شود.`

                  : `Remove "${deleteTarget?.fullName ?? ''}" from all your courses and seminars?`

              )}

            </AlertDialogDescription>

          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel disabled={deleting}>

              {t('professorDashboard.roomStudents.cancel', isRtl ? 'انصراف' : 'Cancel')}

            </AlertDialogCancel>

            <AlertDialogAction

              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"

              disabled={deleting}

              onClick={(e) => {

                e.preventDefault();

                void handleDelete();

              }}

            >

              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}

              {t('professorDashboard.students.delete', isRtl ? 'حذف' : 'Remove')}

            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>

      <Dialog open={licenseTarget != null} onOpenChange={(open) => !open && setLicenseTarget(null)}>
        <DialogContent className="flex max-h-[92vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl">
          <DialogHeader className="border-b px-6 py-4 text-start">
            <DialogTitle className="text-base sm:text-lg">
              {isRtl ? 'مدیریت لایسنس دسکتاپ' : 'Desktop license management'}
              {licenseTarget ? ` — ${licenseTarget.fullName}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-5">
            {licenseTarget ? (
              <ProfessorDesktopLicensePanel
                userId={licenseTarget.userId}
                studentName={licenseTarget.fullName}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}


