'use client';

import * as React from 'react';
import {
  Copy,
  Loader2,
  Mail,
  MessageSquare,
  PlusCircle,
  Search,
  Wallet,
  Send,
  Pencil,
  Ban,
  Trash2,
  BookOpen,
  FileText,
  Presentation,
  Megaphone,
  TrendingUp,
  UserPlus,
  Library,
  ClipboardCheck,
  MonitorSmartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { searchAdminTeachers, type AdminTeacherRow } from '@/services/admin-teachers-api.service';
import {
  deleteUser,
  getUserDeleteErrorMessage,
  pickUserId,
  setUserBlocked,
} from '@/services/user-service';
import { setTeacherAccountStatus } from '@/services/teacher-service';
import type { User } from '@/lib/types';
import { EditUserModal } from '../components/edit-user-modal';
import { AddPortalUserModal } from '../components/add-portal-user-modal';
import { BulkNotifyModal } from '../components/user-management-modals';
import { AdminMessageModal } from '../components/admin-message-modal';
import { AssignStudentsToTeacherModal } from '../components/assign-students-teacher-modal';
import { UserActionMenu, type UserActionMenuItem } from '../components/user-action-menu';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';
import {toPersianDigits} from "@/lib/utils/format/digits";

const TEACHER_NAV_MENU_IDS = new Set([
  'courses',
  'articles',
  'seminars',
  'ad',
  'auto-bump',
  'content',
  'content-moderation',
  'remote-assist',
]);

const getInitials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || '?';

function teacherRowToUser(row: AdminTeacherRow): User {
  const id = String(row.userId);
  return {
    id,
    name: row.displayName || row.userName || id,
    email: row.email || '',
    avatarUrl: row.avatarUrl,
    initials: (row.displayName || row.userName || '?').slice(0, 2).toUpperCase(),
    status: row.isUserBlocked ? 'Blocked' : 'Active',
    registrationDate: new Date(),
    lastLogin: new Date(),
    role: 'User',
  };
}

export default function UsersTeachersPage() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [list, setList] = React.useState<AdminTeacherRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = React.useState(false);
  const [bulkEmailOpen, setBulkEmailOpen] = React.useState(false);
  const [bulkSmsOpen, setBulkSmsOpen] = React.useState(false);
  const [userToEdit, setUserToEdit] = React.useState<User | null>(null);
  const [userToDelete, setUserToDelete] = React.useState<AdminTeacherRow | null>(null);
  const [messageTarget, setMessageTarget] = React.useState<AdminTeacherRow | null>(null);
  const [assignTarget, setAssignTarget] = React.useState<AdminTeacherRow | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [statusBusyId, setStatusBusyId] = React.useState<string | null>(null);
  const [menuLoadingId, setMenuLoadingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const tmr = window.setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => window.clearTimeout(tmr);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [debouncedSearch, pageSize]);

  const fmt = (value: string | number) => (isRtl ? toPersianDigits(value) : String(value));


  const exportColumns = React.useMemo<TableExportColumn<AdminTeacherRow>[]>(
    () => [
      { header: t('userTable_col_name'), accessor: (row) => row.displayName || row.userName || '—' },
      { header: t('userTable_col_email'), accessor: (row) => row.email || '—' },
      { header: t('users_teachers_col_category'), accessor: (row) => row.teachingCategoryName || '—' },
      {
        header: t('students_col_status'),
        accessor: (row) => (row.isUserBlocked ? t('status_blocked') : t('status_active')),
      },
    ],
    [t]
  );

  const fetchAllTeachers = React.useCallback(async () => {
    const res = await searchAdminTeachers({
      inputValue: debouncedSearch,
      pageNumber: 1,
      pageSize: Math.max(totalCount, 1000),
    });
    return res.items;
  }, [debouncedSearch, totalCount]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchAdminTeachers({
        inputValue: debouncedSearch,
        pageNumber: page,
        pageSize,
      });
      setList(res.items);
      setTotalCount(res.totalCount);
    } catch {
      setList([]);
      setTotalCount(0);
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('users_teachers_load_failed'),
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, t, toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const textAlign = locale === 'fa' ? 'right' : 'left';
  const isRtl = locale === 'fa';
  const selectedIds = Array.from(selected);

  const toggleRow = (userId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(userId);
      else next.delete(userId);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) setSelected(new Set(list.map((r) => r.userId)));
    else setSelected(new Set());
  };

  const copyId = async (userId: string) => {
    try {
      await navigator.clipboard.writeText(userId);
      toast({ title: t('copy_id_success_title'), description: t('copy_id_success_desc') });
    } catch {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('copy_id_failed') });
    }
  };

  const handleMenuItemActivate = React.useCallback((rowUserId: string, itemId: string) => {
    setMenuLoadingId(rowUserId);
    if (!TEACHER_NAV_MENU_IDS.has(itemId)) {
      window.setTimeout(() => {
        setMenuLoadingId((current) => (current === rowUserId ? null : current));
      }, 400);
    }
  }, []);

  const handleToggleBlock = async (row: AdminTeacherRow) => {
    const blocked = !row.isUserBlocked;
    setStatusBusyId(row.userId);
    try {
      await setUserBlocked(pickUserId({ userId: row.userId }), blocked);
      await setTeacherAccountStatus({
        teacherId: row.teacherId,
        status: blocked ? 'blocked' : 'active',
      });
      toast({
        title: blocked ? t('toast_user_blocked_title') : t('toast_user_unblocked_title'),
        description: (blocked ? t('toast_user_blocked_desc') : t('toast_user_unblocked_desc')).replace(
          '{name}',
          row.displayName || row.userName
        ),
      });
      void load();
    } catch {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('users_status_failed') });
    } finally {
      setStatusBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeleteBusy(true);
    try {
      await deleteUser(pickUserId({ userId: userToDelete.userId }));
      toast({
        title: t('users_deleted_title'),
        description: t('users_deleted_desc').replace('{name}', userToDelete.displayName || userToDelete.userName),
      });
      setUserToDelete(null);
      void load();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: getUserDeleteErrorMessage(err) || t('users_delete_failed'),
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  const showWallet = (row: AdminTeacherRow) => {
    toast({
      title: t('teacher_wallet_title'),
      description: t('teacher_wallet_desc').replace('{amount}', row.walletBalanceToman.toLocaleString(locale)),
    });
  };

  const buildTeacherMenuItems = (row: AdminTeacherRow): UserActionMenuItem[] => [
    { type: 'label', label: t('actions') },
    {
      type: 'item',
      id: 'copy',
      label: t('action_copy_id'),
      icon: <Copy size={16} />,
      onClick: () => void copyId(row.userId),
    },
    {
      type: 'item',
      id: 'message',
      label: t('action_send_message'),
      icon: <Send size={16} />,
      onClick: () => setMessageTarget(row),
    },
    {
      type: 'item',
      id: 'edit',
      label: t('actions_edit'),
      icon: <Pencil size={16} />,
      onClick: () => setUserToEdit(teacherRowToUser(row)),
    },
    {
      type: 'item',
      id: 'block',
      label: row.isUserBlocked ? t('actions_unblock') : t('actions_block'),
      icon: <Ban size={16} />,
      onClick: () => void handleToggleBlock(row),
    },
    {
      type: 'item',
      id: 'delete',
      label: t('actions_delete'),
      icon: <Trash2 size={16} />,
      danger: true,
      onClick: () => setUserToDelete(row),
    },
    { type: 'separator' },
    {
      type: 'item',
      id: 'courses',
      label: t('action_view_courses'),
      icon: <BookOpen size={16} />,
      href: `/dashboard/users/teachers/${row.userId}/courses`,
    },
    {
      type: 'item',
      id: 'content',
      label: t('action_manage_content'),
      icon: <Library size={16} />,
      href: `/dashboard/users/teachers/${row.userId}/content?teacherId=${row.teacherId}`,
    },
    {
      type: 'item',
      id: 'content-moderation',
      label: t('action_content_moderation_queue'),
      icon: <ClipboardCheck size={16} />,
      href: `/dashboard/teacher-content-moderation?teacherId=${row.teacherId}`,
    },
    {
      type: 'item',
      id: 'articles',
      label: t('action_view_articles'),
      icon: <FileText size={16} />,
      href: `/dashboard/users/teachers/${row.userId}/articles`,
    },
    {
      type: 'item',
      id: 'seminars',
      label: t('action_view_seminars'),
      icon: <Presentation size={16} />,
      href: `/dashboard/users/teachers/${row.userId}/seminars`,
    },
    {
      type: 'item',
      id: 'ad',
      label: t('action_teacher_ad'),
      icon: <Megaphone size={16} />,
      href: `/dashboard/users/teachers/${row.userId}/ad`,
    },
    {
      type: 'item',
      id: 'auto-bump',
      label: t('action_teacher_auto_bump'),
      icon: <TrendingUp size={16} />,
      href: `/dashboard/users/teachers/${row.userId}/auto-bump`,
    },
    {
      type: 'item',
      id: 'wallet',
      label: t('action_view_wallet'),
      icon: <Wallet size={16} />,
      onClick: () => showWallet(row),
    },
    {
      type: 'item',
      id: 'assign',
      label: t('action_assign_students'),
      icon: <UserPlus size={16} />,
      onClick: () => setAssignTarget(row),
    },
    {
      type: 'item',
      id: 'remote-assist',
      label: t('action_remote_assist_history'),
      icon: <MonitorSmartphone size={16} />,
      href: `/dashboard/remote-assist?teacherUserId=${row.userId}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('users_teachers_title')}</h1>
          <p className="text-sm text-muted-foreground">{t('users_teachers_description')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setBulkEmailOpen(true)} disabled={selectedIds.length === 0}>
            <Mail className="mr-2 h-4 w-4" />
            {t('bulk_send_email_button')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setBulkSmsOpen(true)} disabled={selectedIds.length === 0}>
            <MessageSquare className="mr-2 h-4 w-4" />
            {t('bulk_send_sms_button')}
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('add_teacher_button')}
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('users_teachers_search_placeholder')}
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <AdminTableShell
        title={t('users_teachers_table_title')}
        description={t('users_teachers_table_description')}
        locale={locale}
        t={t}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="teachers"
        exportTitle={t('users_teachers_table_title')}
        exportColumns={exportColumns}
        exportRows={list}
        fetchAllExportRows={fetchAllTeachers}
        loading={loading}
        isEmpty={!loading && list.length === 0}
        emptyMessage={t('users_teachers_empty')}
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                    checked={list.length > 0 && selected.size === list.length}
                    onCheckedChange={(v) => toggleAll(v === true)}
                    aria-label={t('select_all')}
                />
              </TableHead>
              <TableHead className="font-semibold text-foreground" style={{ textAlign }}>
                {t('userTable_col_name')}
              </TableHead>
              <TableHead className="hidden font-semibold text-foreground md:table-cell" style={{ textAlign }}>
                {t('userTable_col_email')}
              </TableHead>
              <TableHead className="hidden font-semibold text-foreground lg:table-cell" style={{ textAlign }}>
                {t('users_teachers_col_category')}
              </TableHead>
              <TableHead className="font-semibold text-foreground" style={{ textAlign }}>
                {t('students_col_status')}
              </TableHead>
              <TableHead className="w-16 text-end font-semibold text-foreground">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                    {t('users_teachers_empty')}
                  </TableCell>
                </TableRow>
            ) : (
                list.map((row) => {
                  const displayName = row.displayName || row.userName || '—';
                  const isSelected = selected.has(row.userId);

                  return (
                      <TableRow
                          key={row.teacherId}
                          data-state={isSelected ? 'selected' : undefined}
                          className="group transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <TableCell>
                          <Checkbox
                              className="mr-5"
                              checked={isSelected}
                              onCheckedChange={(v) => toggleRow(row.userId, v === true)}
                              aria-label={t('select_row')}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {getInitials(displayName)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{displayName}</p>
                              <p className="text-xs text-muted-foreground tabular-nums">
                                {t("ID")}:{fmt(row.userId)}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="hidden md:table-cell">
              <span className="block max-w-[220px] truncate text-muted-foreground">
                {row.email || '—'}
              </span>
                        </TableCell>

                        <TableCell className="hidden lg:table-cell">
                          {row.teachingCategoryName ? (
                              <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                  {row.teachingCategoryName}
                </span>
                          ) : (
                              <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell>
              <span
                  className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                      row.isUserBlocked
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : 'bg-green-500/10 text-green-700 dark:text-green-400'
                  )}
              >
                <span
                    className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        row.isUserBlocked ? 'bg-amber-500' : 'bg-green-500'
                    )}
                />
                {row.isUserBlocked ? t('status_blocked') : t('status_active')}
              </span>
                        </TableCell>

                        <TableCell className="text-end">
                          <UserActionMenu
                              items={buildTeacherMenuItems(row)}
                              loading={menuLoadingId === row.userId}
                              onItemActivate={(itemId) => handleMenuItemActivate(row.userId, itemId)}
                              disabled={statusBusyId === row.userId || menuLoadingId === row.userId}
                              ariaLabel={t('actions_toggle_menu')}
                              isRtl={isRtl}
                          />
                        </TableCell>
                      </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>

      </AdminTableShell>

      <AddPortalUserModal open={addOpen} onOpenChange={setAddOpen} role="TEACHER" onCreated={() => void load()} />
      <BulkNotifyModal open={bulkEmailOpen} onOpenChange={setBulkEmailOpen} userIds={selectedIds} channel="email" />
      <BulkNotifyModal open={bulkSmsOpen} onOpenChange={setBulkSmsOpen} userIds={selectedIds} channel="sms" />
      <AdminMessageModal
        open={!!messageTarget}
        onOpenChange={(o) => !o && setMessageTarget(null)}
        userIds={messageTarget ? [messageTarget.userId] : []}
        recipientName={messageTarget?.displayName || messageTarget?.userName || ''}
      />
      <AssignStudentsToTeacherModal
        open={!!assignTarget}
        onOpenChange={(o) => !o && setAssignTarget(null)}
        teacherUserId={assignTarget?.userId ?? null}
        teacherName={assignTarget?.displayName || assignTarget?.userName || ''}
      />
      <EditUserModal
        user={userToEdit}
        open={!!userToEdit}
        onOpenChangeAction={(o) => !o && setUserToEdit(null)}
        onSavedAction={() => void load()}
      />
      <AlertDialog open={!!userToDelete} onOpenChange={(o) => !o && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete
                ? t('users_delete_description', {
                    name: `${userToDelete.displayName || userToDelete.userName} (${userToDelete.email || ''})`,
                  })
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>{t('actions_cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteBusy}
              className={cn(buttonVariants({ variant: 'destructive' }))}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleteBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('actions_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
