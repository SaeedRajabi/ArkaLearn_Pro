
'use client';

import * as React from 'react';
import { MoreHorizontal, Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { ReplyReviewModal } from './reply-review-modal';
import type { CourseReview } from '@/lib/types';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

export function ReviewTable() {
  const { t , locale } = useLanguage();
  const { courseReviews, approveReview, rejectReview, deleteReview, likeReview, dislikeReview } = useStore();
  const { toast } = useToast();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [replyingTo, setReplyingTo] = React.useState<CourseReview | null>(null);

  const rootReviews = React.useMemo(
    () => courseReviews.filter((r) => !r.parentId),
    [courseReviews]
  );

  const { currentReviews } = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    const paginatedRootReviews = rootReviews.slice(start, start + pageSize);

    const reviewsWithReplies: CourseReview[] = [];
    paginatedRootReviews.forEach((review) => {
      reviewsWithReplies.push(review);
      const replies = courseReviews.filter((r) => r.parentId === review.id);
      reviewsWithReplies.push(...replies);
    });

    return { currentReviews: reviewsWithReplies };
  }, [courseReviews, rootReviews, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [pageSize, rootReviews.length]);

  const exportColumns = React.useMemo<TableExportColumn<CourseReview>[]>(
    () => [
      { header: t('review_table_col_student'), accessor: (row) => row.userName },
      { header: t('review_table_col_course'), accessor: (row) => row.courseTitle },
      { header: t('review_table_col_rating'), accessor: (row) => row.rating },
      { header: t('review_table_col_comment'), accessor: (row) => row.comment },
      {
        header: t('review_table_col_date'),
        accessor: (row) => row.createdAt.toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US'),
      },
      {
        header: t('review_table_col_status'),
        accessor: (row) => t(`status_${row.status.toLowerCase()}`),
      },
    ],
    [t, locale]
  );

  const getStatusVariant = (status: 'Approved' | 'Pending' | 'Rejected') => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Rejected':
        return 'destructive';
    }
  };

  const handleDelete = (id: string) => {
    deleteReview(id);
    toast({
      title: t('review_deleted_title'),
      description: t('review_deleted_description'),
    });
  };

  return (
    <>
      <AdminTableShell
        title={t('course_reviews_title')}
        description={t('course_reviews_description')}
        locale={locale}
        t={t}
        totalCount={rootReviews.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="course-reviews"
        exportTitle={t('course_reviews_title')}
        exportColumns={exportColumns}
        exportRows={currentReviews}
        fetchAllExportRows={async () => courseReviews}
        isEmpty={rootReviews.length === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}}>{t('review_table_col_student')}</TableHead>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}} className="hidden md:table-cell">{t('review_table_col_course')}</TableHead>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}} className="hidden sm:table-cell">{t('review_table_col_rating')}</TableHead>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}}>{t('review_table_col_comment')}</TableHead>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}} className="hidden lg:table-cell">{t('review_table_col_date')}</TableHead>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}}>{t('review_table_col_status')}</TableHead>
              <TableHead style={{textAlign: locale === 'fa' ? 'right' : 'left'}}>
                <span className="sr-only">{t('review_table_col_actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentReviews.map((review) => (
              <TableRow key={review.id} className={cn(review.parentId && 'bg-muted/50')}>
                <TableCell className={cn(review.parentId && 'pl-10')}>
                  <div className="flex items-center gap-3">
                    {review.parentId && <MessageSquare className="h-4 w-4 text-muted-foreground" />}
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={review.userAvatarUrl} alt={review.userName} />
                      <AvatarFallback>{review.userInitials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{review.userName}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{review.courseTitle}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {!review.parentId && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-4 w-4',
                            i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
                          )}
                        />
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <p className="max-w-[200px] sm:max-w-xs truncate text-muted-foreground">{review.comment}</p>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {review.createdAt.toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US')}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(review.status)}>
                    {t(`status_${review.status.toLowerCase()}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => likeReview(review.id)}>
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">{review.likes || 0}</span>
                    <Button variant="ghost" size="icon" onClick={() => dislikeReview(review.id)}>
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">{review.dislikes || 0}</span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t('actions_toggle_menu')}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                        {review.status !== 'Approved' && (
                          <DropdownMenuItem onClick={() => approveReview(review.id)}>{t('actions_approve')}</DropdownMenuItem>
                        )}
                        {review.status !== 'Rejected' && (
                          <DropdownMenuItem className="text-destructive" onClick={() => rejectReview(review.id)}>{t('actions_reject')}</DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setReplyingTo(review)}>{t('actions_reply')}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(review.id)} className="text-destructive">{t('actions_delete')}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>
      {replyingTo && (
        <ReplyReviewModal 
          open={!!replyingTo}
          onOpenChangeAction={(isOpen) => !isOpen && setReplyingTo(null)}
          review={replyingTo}
        />
      )}
    </>
  );
}
