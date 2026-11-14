
'use client';

import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/components/language-provider';
import { useStore } from '@/lib/store';
import { deleteCoursePermanently } from '@/services/course-service';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { CourseFormModal } from './course-form-modal';
import type { Course } from '@/lib/types';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

export function CourseTable() {
  const { t , locale } = useLanguage();
  const { courses, deleteCourse, getCourseDetails } = useStore();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [editingCourse, setEditingCourse] = React.useState<Course | null>(null);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [loadingEdit, setLoadingEdit] = React.useState(false);

  const { currentCourses, totalCount } = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const paginatedCourses = courses.slice(start, end);
    return { currentCourses: paginatedCourses, totalCount: courses.length };
  }, [courses, currentPage, pageSize]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, courses.length]);

  const exportColumns = React.useMemo<TableExportColumn<Course>[]>(
    () => [
      { header: t('courseTable_col_title'), accessor: (row) => row.title },
      { header: t('courseTable_col_status'), accessor: (row) => t(row.status.toLowerCase()) },
      { header: t('courseTable_col_price'), accessor: (row) => row.price.toFixed(2) },
      { header: t('courseTable_col_students'), accessor: (row) => row.studentCount },
    ],
    [t]
  );

  const handlePageChange = (page: number) => {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(t('permanent_delete_description').replace('{name}', title))) return;
    try {
      await deleteCoursePermanently(id);
      deleteCourse(id);
      toast({
        title: t('permanent_delete_success_title'),
        description: t('permanent_delete_success_description').replace('{name}', title),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('permanent_delete_failed'),
      });
    }
  };

  const handleEdit = async (course: Course) => {
    setEditModalOpen(true);
    setEditingCourse(null);
    setLoadingEdit(true);
    try {
      const full = await getCourseDetails(course.id);
      setEditingCourse(full ?? course);
    } catch {
      toast({
        variant: 'destructive',
        title: t('toast_error_title'),
        description: t('toast_error_description'),
      });
      setEditModalOpen(false);
    } finally {
      setLoadingEdit(false);
    }
  };

  return (
    <>
      <AdminTableShell
        title={t('courseTable_title')}
        description={t('courseTable_description')}
        locale={locale}
        t={t}
        totalCount={totalCount}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={setPageSize}
        exportFilenameBase="courses"
        exportTitle={t('courseTable_title')}
        exportColumns={exportColumns}
        exportRows={currentCourses}
        fetchAllExportRows={async () => courses}
        isEmpty={currentCourses.length === 0}
      >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}}>{t('courseTable_col_title')}</TableHead>
                <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}}>{t('courseTable_col_status')}</TableHead>
                <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}} className="hidden md:table-cell">{t('courseTable_col_price')}</TableHead>
                <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}} className="hidden lg:table-cell">{t('courseTable_col_students')}</TableHead>
                <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}}>
                  <span className="sr-only">{t('courseTable_col_actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {currentCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                       <Link href={`/dashboard/courses/${course.id}`} className="hover:underline">
                          {course.title}
                        </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          course.status === 'Published' ? 'default' : 'secondary'
                        }
                      >
                        {t(course.status.toLowerCase())}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      ${course.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {course.studentCount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('actions_toggle_menu')}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(course)}>{t('actions_edit')}</DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(course.id, course.title)}
                            className="text-destructive"
                          >
                            {t('actions_delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
      </AdminTableShell>
      {editModalOpen && (
        <CourseFormModal
          // Remount when GetById finishes so Select/Combobox get correct defaultValues
          // (Radix Select often stays empty if values are reset after first mount).
          key={editingCourse?.id ? `edit-${editingCourse.id}` : 'edit-loading'}
          open={editModalOpen}
          loading={loadingEdit || !editingCourse}
          onOpenChangeAction={(isOpen) => {
            setEditModalOpen(isOpen);
            if (!isOpen) {
              setEditingCourse(null);
            }
          }}
          course={editingCourse}
        />
      )}
    </>
  );
}
