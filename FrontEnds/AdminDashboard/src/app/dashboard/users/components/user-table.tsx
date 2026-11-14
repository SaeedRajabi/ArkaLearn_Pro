'use client';

import * as React from 'react';
import { Loader2, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
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
import Link from 'next/link';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  deleteUser,
  getUserDeleteErrorMessage,
  mapSearchRowToUser,
  pickUserId,
  searchUsers,
  setUserBlocked,
} from '@/services/user-service';
import type { User } from '@/lib/types';
import { EditUserModal } from './edit-user-modal';
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
import { cn } from '@/lib/utils';
import { resolveUserAvatarUrl } from '@/lib/default-user-avatar';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

export function UserTable({ searchTerm }: { searchTerm: string }) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [users, setUsers] = React.useState<User[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [userToEdit, setUserToEdit] = React.useState<User | null>(null);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [statusBusyId, setStatusBusyId] = React.useState<string | null>(null);
  const loadSeqRef = React.useRef(0);

  React.useEffect(() => {
    const tmr = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => window.clearTimeout(tmr);
  }, [searchTerm]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const exportColumns = React.useMemo<TableExportColumn<User>[]>(
    () => [
      { header: t('userTable_col_name'), accessor: (row) => row.name },
      { header: t('userTable_col_email'), accessor: (row) => row.email },
      { header: t('userTable_col_status'), accessor: (row) => t(`status_${row.status.toLowerCase()}`) },
      {
        header: t('userTable_col_registered'),
        accessor: (row) =>
          row.registrationDate instanceof Date && !Number.isNaN(row.registrationDate.getTime())
            ? row.registrationDate.toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US')
            : String(row.registrationDate ?? ''),
      },
    ],
    [t, locale]
  );

  const fetchAllUsers = React.useCallback(async () => {
    const res = await searchUsers({
      inputValue: debouncedSearch,
      pageNumber: 1,
      pageSize: Math.max(totalCount, 1000),
      cacheBust: true,
    });
    return res.list.map(mapSearchRowToUser);
  }, [debouncedSearch, totalCount]);

  const load = React.useCallback(async (cacheBust = true) => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    try {
      const res = await searchUsers({
        inputValue: debouncedSearch,
        pageNumber: page,
        pageSize,
        cacheBust,
      });
      if (seq !== loadSeqRef.current) return;
      setUsers(res.list.map(mapSearchRowToUser));
      setTotalCount(res.totalCount);
    } catch {
      if (seq !== loadSeqRef.current) return;
      setUsers([]);
      setTotalCount(0);
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('users_load_failed'),
      });
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, t, toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleToggleBlock = async (user: User) => {
    const blocked = user.status === 'Active';
    setStatusBusyId(user.id);
    try {
      await setUserBlocked(pickUserId({ id: user.id }), blocked);
      toast({
        title: blocked ? t('toast_user_blocked_title') : t('toast_user_unblocked_title'),
        description: (blocked ? t('toast_user_blocked_desc') : t('toast_user_unblocked_desc')).replace(
          '{name}',
          user.name
        ),
      });
      void load();
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('users_status_failed'),
      });
    } finally {
      setStatusBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeleteBusy(true);
    try {
      const deletedId = userToDelete.id;
      const deletedName = userToDelete.name;
      await deleteUser(pickUserId({ id: deletedId }));
      setUsers((prev) => prev.filter((u) => u.id !== deletedId));
      setTotalCount((c) => Math.max(0, c - 1));
      toast({
        title: t('users_deleted_title'),
        description: t('users_deleted_desc').replace('{name}', deletedName),
      });
      setUserToDelete(null);
      await load(true);
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

  return (
    <>
      <AdminTableShell
        title={t('userTable_title')}
        description={t('userTable_description')}
        locale={locale}
        t={t}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="users"
        exportTitle={t('userTable_title')}
        exportColumns={exportColumns}
        exportRows={users}
        fetchAllExportRows={fetchAllUsers}
        loading={loading}
        isEmpty={!loading && users.length === 0}
        emptyMessage={t('users_empty')}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('userTable_col_name')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('userTable_col_email')}</TableHead>
              <TableHead>{t('userTable_col_status')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('userTable_col_registered')}</TableHead>
              <TableHead>
                <span className="sr-only">{t('actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const avatar = resolveUserAvatarUrl(user.avatarUrl);
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={avatar} alt={user.name} />
                        <AvatarFallback>{user.initials}</AvatarFallback>
                      </Avatar>
                      <Link href={`/dashboard/users/${user.id}`} className="font-medium hover:underline">
                        {user.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                      {t(`status_${user.status.toLowerCase()}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {user.registrationDate instanceof Date && !Number.isNaN(user.registrationDate.getTime())
                      ? user.registrationDate.toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US')
                      : String(user.registrationDate ?? '')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                          disabled={statusBusyId === user.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t('actions_toggle_menu')}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/users/${user.id}`}>{t('actions_view')}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setUserToEdit(user)}>{t('actions_edit')}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => void handleToggleBlock(user)}>
                          {user.status === 'Active' ? t('actions_block') : t('actions_unblock')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setUserToDelete(user)}
                        >
                          {t('actions_delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminTableShell>

      <EditUserModal
        user={userToEdit}
        open={!!userToEdit}
        onOpenChangeAction={(o) => {
          if (!o) setUserToEdit(null);
        }}
        onSavedAction={() => void load()}
      />

      <AlertDialog open={!!userToDelete} onOpenChange={(o) => !o && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete
                ? t('users_delete_description', { name: `${userToDelete.name} (${userToDelete.email})` })
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
    </>
  );
}
