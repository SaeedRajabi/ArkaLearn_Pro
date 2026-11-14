'use client';

import * as React from 'react';
import {
  Copy,
  Loader2,
  Mail,
  MessageSquare,
  PlusCircle,
  Search,
  BookOpen,
  MessageCircle,
  HelpCircle,
  Pencil,
  Ban,
  Trash2,
  FolderOpen,
  DoorOpen,
  Headphones,
  MonitorSmartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  searchPortalStudents,
  type PortalStudentRow,
} from '@/services/portal-students-api.service';
import {
  deleteUser,
  getUserDeleteErrorMessage,
  pickUserId,
  setUserBlocked,
} from '@/services/user-service';
import type { User } from '@/lib/types';
import { EditUserModal } from '../components/edit-user-modal';
import { AddPortalUserModal } from '../components/add-portal-user-modal';
import { BulkNotifyModal, GrantSupportModal } from '../components/user-management-modals';
import { AssignStudentRoomsModal } from '../components/assign-student-rooms-modal';
import { UserActionMenu, type UserActionMenuItem } from '../components/user-action-menu';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';
import { toPersianDigits } from '@/lib/utils/format/digits';


const getInitials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || '?';



const STUDENT_NAV_MENU_IDS = new Set(['courses', 'comments', 'qa', 'files', 'remote-assist']);

type ActiveFilter = 'all' | 'active' | 'inactive';

function portalRowToUser(row: PortalStudentRow): User {
  const id = String(row.userId);
  const name = row.fullName || row.userName || id;
  return {
    id,
    name,
    email: row.email || '',
    avatarUrl: '',
    initials: name.slice(0, 2).toUpperCase() || '?',
    status: row.isActive ? 'Active' : 'Blocked',
    registrationDate: row.registeredAt ? new Date(row.registeredAt) : new Date(),
    lastLogin: new Date(),
    role: 'User',
  };
}

export default function UsersStudentsPage() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<ActiveFilter>('all');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [list, setList] = React.useState<PortalStudentRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = React.useState(false);
  const [bulkEmailOpen, setBulkEmailOpen] = React.useState(false);
  const [bulkSmsOpen, setBulkSmsOpen] = React.useState(false);
  const [userToEdit, setUserToEdit] = React.useState<User | null>(null);
  const [userToDelete, setUserToDelete] = React.useState<PortalStudentRow | null>(null);
  const [grantTarget, setGrantTarget] = React.useState<PortalStudentRow | null>(null);
  const [roomsTarget, setRoomsTarget] = React.useState<PortalStudentRow | null>(null);
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
  }, [debouncedSearch, activeFilter, pageSize]);

  const fmt = (value: string | number) => (isRtl ? toPersianDigits(value) : String(value));

  const exportColumns = React.useMemo<TableExportColumn<PortalStudentRow>[]>(
    () => [
      { header: t('userTable_col_name'), accessor: (row) => row.fullName || row.userName || '—' },
      { header: t('userTable_col_email'), accessor: (row) => row.email || '—' },
      { header: t('portal_students_col_phone'), accessor: (row) => row.phoneNumber || '—' },
      {
        header: t('students_col_status'),
        accessor: (row) => (row.isActive ? t('status_active') : t('status_inactive')),
      },
      { header: t('portal_students_col_courses'), accessor: (row) => row.courseEnrollmentCount },
    ],
    [t]
  );

  const fetchAllStudents = React.useCallback(async () => {
    const isActive = activeFilter === 'all' ? null : activeFilter === 'active';
    const res = await searchPortalStudents({
      inputValue: debouncedSearch,
      isActive,
      pageNumber: 1,
      pageSize: Math.max(totalCount, 1000),
    });
    return res.items;
  }, [activeFilter, debouncedSearch, totalCount]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const isActive = activeFilter === 'all' ? null : activeFilter === 'active';
      const res = await searchPortalStudents({
        inputValue: debouncedSearch,
        isActive,
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
        description: t('portal_students_load_failed'),
      });
    } finally {
      setLoading(false);
    }
  }, [activeFilter, debouncedSearch, page, pageSize, t, toast]);

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
    if (!STUDENT_NAV_MENU_IDS.has(itemId)) {
      window.setTimeout(() => {
        setMenuLoadingId((current) => (current === rowUserId ? null : current));
      }, 400);
    }
  }, []);

  const handleToggleBlock = async (row: PortalStudentRow) => {
    const blocked = row.isActive;
    setStatusBusyId(row.userId);
    try {
      await setUserBlocked(pickUserId({ userId: row.userId }), blocked);
      toast({
        title: blocked ? t('toast_user_blocked_title') : t('toast_user_unblocked_title'),
        description: (blocked ? t('toast_user_blocked_desc') : t('toast_user_unblocked_desc')).replace(
          '{name}',
          row.fullName || row.userName || String(row.userId)
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
        description: t('users_deleted_desc').replace('{name}', userToDelete.fullName || userToDelete.userName || ''),
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

  const buildStudentMenuItems = (row: PortalStudentRow): UserActionMenuItem[] => [
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
      id: 'courses',
      label: t('action_view_courses'),
      icon: <BookOpen size={16} />,
      href: `/dashboard/users/students/${row.userId}/courses`,
    },
    {
      type: 'item',
      id: 'comments',
      label: t('action_view_comments'),
      icon: <MessageCircle size={16} />,
      href: `/dashboard/users/students/${row.userId}/comments`,
    },
    {
      type: 'item',
      id: 'qa',
      label: t('action_view_qa'),
      icon: <HelpCircle size={16} />,
      href: `/dashboard/users/students/${row.userId}/qa`,
    },
    {
      type: 'item',
      id: 'edit',
      label: t('actions_edit'),
      icon: <Pencil size={16} />,
      onClick: () => setUserToEdit(portalRowToUser(row)),
    },
    { type: 'separator' },
    {
      type: 'item',
      id: 'block',
      label: row.isActive ? t('actions_block') : t('actions_unblock'),
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
      id: 'files',
      label: t('action_manage_files'),
      icon: <FolderOpen size={16} />,
      href: `/dashboard/students/${row.managedRoomStudentId ?? row.userId}/files`,
    },
    {
      type: 'item',
      id: 'rooms',
      label: t('action_manage_rooms'),
      icon: <DoorOpen size={16} />,
      onClick: () => setRoomsTarget(row),
    },
    {
      type: 'item',
      id: 'support',
      label: t('action_grant_support'),
      icon: <Headphones size={16} />,
      onClick: () => setGrantTarget(row),
    },
    {
      type: 'item',
      id: 'remote-assist',
      label: t('action_remote_assist_history'),
      icon: <MonitorSmartphone size={16} />,
      href: `/dashboard/remote-assist?studentUserId=${row.userId}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('users_students_title')}</h1>
          <p className="text-sm text-muted-foreground">{t('users_students_description')}</p>
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
            {t('add_student_button')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('portal_students_search_placeholder')}
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as ActiveFilter)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t('portal_students_filter_status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('portal_students_filter_all')}</SelectItem>
            <SelectItem value="active">{t('status_active')}</SelectItem>
            <SelectItem value="inactive">{t('status_inactive')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AdminTableShell
        title={t('users_students_table_title')}
        description={t('users_students_table_description')}
        locale={locale}
        t={t}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="students"
        exportTitle={t('users_students_table_title')}
        exportColumns={exportColumns}
        exportRows={list}
        fetchAllExportRows={fetchAllStudents}
        loading={loading}
        isEmpty={!loading && list.length === 0}
        emptyMessage={t('students_no_data')}
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                    className="mr-2.5"
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
                {t('portal_students_col_phone')}
              </TableHead>
              <TableHead className="font-semibold text-foreground" style={{ textAlign }}>
                {t('students_col_status')}
              </TableHead>
              <TableHead className="hidden font-semibold text-foreground sm:table-cell" style={{ textAlign }}>
                {t('portal_students_col_courses')}
              </TableHead>
              <TableHead className="w-16 text-end font-semibold text-foreground">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                    {t('students_no_data')}
                  </TableCell>
                </TableRow>
            ) : (
                list.map((row) => {
                  const displayName = row.fullName || row.userName || '—';
                  const isSelected = selected.has(row.userId);

                  return (
                      <TableRow
                          key={row.userId}
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
                          <bdi className="tabular-nums text-muted-foreground">
                            {row.phoneNumber ? fmt(row.phoneNumber) : '—'}
                          </bdi>
                        </TableCell>

                        <TableCell>
              <span
                  className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                      row.isActive
                          ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                  )}
              >
                <span
                    className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        row.isActive ? 'bg-green-500' : 'bg-amber-500'
                    )}
                />
                {row.isActive ? t('status_active') : t('status_inactive')}
              </span>
                        </TableCell>

                        <TableCell className="hidden sm:table-cell">
              <span className="inline-flex min-w-8 justify-center rounded-md bg-muted px-2 py-0.5 text-sm font-medium tabular-nums">
                {fmt(row.courseEnrollmentCount)}
              </span>
                        </TableCell>

                        <TableCell className="text-end">
                          <UserActionMenu
                              items={buildStudentMenuItems(row)}
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

      <AddPortalUserModal open={addOpen} onOpenChange={setAddOpen} role="STUDENT" onCreated={() => void load()} />
      <BulkNotifyModal
        open={bulkEmailOpen}
        onOpenChange={setBulkEmailOpen}
        userIds={selectedIds}
        channel="email"
        onSent={() => setSelected(new Set())}
      />
      <BulkNotifyModal
        open={bulkSmsOpen}
        onOpenChange={setBulkSmsOpen}
        userIds={selectedIds}
        channel="sms"
        onSent={() => setSelected(new Set())}
      />
      <GrantSupportModal
        open={!!grantTarget}
        onOpenChange={(o) => !o && setGrantTarget(null)}
        studentUserId={grantTarget?.userId ?? null}
        studentName={grantTarget?.fullName || grantTarget?.userName || ''}
      />
      <AssignStudentRoomsModal
        open={!!roomsTarget}
        onOpenChange={(o) => !o && setRoomsTarget(null)}
        portalUserId={roomsTarget?.userId ?? null}
        studentName={roomsTarget?.fullName || roomsTarget?.userName || ''}
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
                    name: `${userToDelete.fullName || userToDelete.userName} (${userToDelete.email || ''})`,
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
