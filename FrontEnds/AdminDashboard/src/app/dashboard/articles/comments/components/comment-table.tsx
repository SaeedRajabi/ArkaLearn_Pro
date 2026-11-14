'use client';

import * as React from 'react';
import { MoreHorizontal, MessageSquare } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  getArticleComments,
  approveArticleComment,
  deleteArticleComment,
  type ArticleCommentItem,
} from '@/services/article-api.service';
import { ReplyCommentModal } from './reply-comment-modal';
import { cn } from '@/lib/utils';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

type CommentRow = {
  id: string;
  articleId: string;
  articleTitle: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  userInitials: string;
  comment: string;
  createdAt: Date;
  status: 'Approved' | 'Pending' | 'Rejected';
  likes: number;
  parentId?: string | null;
};

function flattenWithReplies(items: ArticleCommentItem[]): CommentRow[] {
  const rows: CommentRow[] = [];

  function add(c: ArticleCommentItem) {
    const author = c.author;
    rows.push({
      id: String(c.id),
      articleId: String(c.articleId ?? 0),
      articleTitle: c.articleTitle ?? '',
      userId: String(author?.id ?? 0),
      userName: author?.fullName ?? 'Unknown',
      userAvatarUrl: author?.avatarUrl,
      userInitials: getInitials(author?.fullName ?? 'U'),
      comment: c.text,
      createdAt: c.timeStamp ? new Date(c.timeStamp) : new Date(),
      status: c.isApproved ? 'Approved' : 'Pending',
      likes: c.likes ?? 0,
      parentId: c.parentId != null ? String(c.parentId) : null,
    });
    (c.replies ?? []).forEach((r) => add(r));
  }

  items.forEach((c) => add(c));
  return rows;
}

export function CommentTable() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [items, setItems] = React.useState<CommentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [replyingTo, setReplyingTo] = React.useState<CommentRow | null>(null);

  const fetchComments = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getArticleComments(null, {
        onlyApproved: false,
        pageNumber: 1,
        pageSize: 500,
      });
      const flat = flattenWithReplies(res.items);
      setItems(flat);
    } catch {
      setItems([]);
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_fetch_comments') || 'Failed to load comments.',
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  React.useEffect(() => {
    setPage(1);
  }, [pageSize, items.length]);

  const paginatedItems = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const exportColumns = React.useMemo<TableExportColumn<CommentRow>[]>(
    () => [
      { header: t('comment_table_col_user'), accessor: (row) => row.userName },
      { header: t('comment_table_col_article'), accessor: (row) => row.articleTitle },
      { header: t('comment_table_col_comment'), accessor: (row) => row.comment },
      {
        header: t('comment_table_col_date'),
        accessor: (row) => row.createdAt.toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US'),
      },
      {
        header: t('comment_table_col_status'),
        accessor: (row) => t(`status_${row.status.toLowerCase()}`),
      },
    ],
    [t, locale]
  );

  const handleApprove = async (c: CommentRow) => {
    try {
      await approveArticleComment(c.articleId, c.id, true);
      toast({ title: t('comment_approved_title') || 'Comment approved' });
      fetchComments();
    } catch {
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_approve_comment') || 'Failed to approve.',
      });
    }
  };

  const handleReject = async (c: CommentRow) => {
    try {
      await approveArticleComment(c.articleId, c.id, false);
      toast({ title: t('comment_rejected_title') || 'Comment rejected' });
      fetchComments();
    } catch {
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_reject_comment') || 'Failed to reject.',
      });
    }
  };

  const handleDelete = async (c: CommentRow) => {
    try {
      await deleteArticleComment(c.articleId, c.id);
      toast({ title: t('comment_deleted_title') || 'Comment deleted' });
      fetchComments();
    } catch {
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_delete_comment') || 'Failed to delete comment.',
      });
    }
  };

  const getStatusVariant = (status: 'Approved' | 'Pending' | 'Rejected') => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <>
      <AdminTableShell
        title={t('article_comments_title')}
        description={t('article_comments_description')}
        locale={locale}
        t={t}
        totalCount={items.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="article-comments"
        exportTitle={t('article_comments_title')}
        exportColumns={exportColumns}
        exportRows={paginatedItems}
        fetchAllExportRows={async () => items}
        loading={loading}
        isEmpty={!loading && items.length === 0}
        emptyMessage={t('no_comments') || 'No comments yet.'}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('comment_table_col_user')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('comment_table_col_article')}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('comment_table_col_comment')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('comment_table_col_date')}</TableHead>
              <TableHead>{t('comment_table_col_status')}</TableHead>
              <TableHead>
                <span className="sr-only">{t('comment_table_col_actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((comment) => (
              <TableRow key={comment.id} className={cn(comment.parentId && 'bg-muted/50')}>
                <TableCell className={cn(comment.parentId && 'pl-10')}>
                  <div className="flex items-center gap-3">
                    {comment.parentId && (
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={comment.userAvatarUrl} alt={comment.userName} />
                      <AvatarFallback>{comment.userInitials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{comment.userName}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{comment.articleTitle}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <p className="max-w-[200px] sm:max-w-xs truncate text-muted-foreground">
                    {comment.comment}
                  </p>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {comment.createdAt.toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US')}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(comment.status)}>
                    {t(`status_${comment.status.toLowerCase()}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{t('actions_toggle_menu')}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                      {comment.status !== 'Approved' && (
                        <DropdownMenuItem onClick={() => handleApprove(comment)}>
                          {t('actions_approve')}
                        </DropdownMenuItem>
                      )}
                      {comment.status !== 'Rejected' && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleReject(comment)}
                        >
                          {t('actions_reject')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => setReplyingTo(comment)}>
                        {t('actions_reply')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(comment)}
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
      {replyingTo && (
        <ReplyCommentModal
          open={!!replyingTo}
          onOpenChangeAction={(isOpen) => !isOpen && setReplyingTo(null)}
          comment={replyingTo}
          onSuccessAction={fetchComments}
        />
      )}
    </>
  );
}
