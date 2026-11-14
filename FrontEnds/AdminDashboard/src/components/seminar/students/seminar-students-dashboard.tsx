'use client';

import React, { useState } from 'react';
import { useSeminar } from '@/contexts/seminar-context';
import { mockSeminarUsers, updateMockSeminarUser } from '@/lib/seminar-mock-data';
import type { SeminarUser } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SeminarUserForm } from './seminar-user-form';
import { DeleteSeminarUserDialog } from './delete-seminar-user-dialog';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/language-provider';
import { getSeminarPlanStatusLabel, getSeminarRoleLabel } from '@/lib/utils/localized-ui';

export function SeminarStudentsDashboard() {
  const { user: currentUser } = useSeminar();
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();

  const [users, setUsers] = useState<SeminarUser[]>(
    mockSeminarUsers.filter((u) => u.role !== 'guest' && u.role !== 'organizer')
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SeminarUser | undefined>(undefined);
  const [userToDelete, setUserToDelete] = useState<SeminarUser | null>(null);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('');

  const handleSaveUser = (userData: SeminarUser) => {
    const isNew = !users.some((u) => u.id === userData.id);
    updateMockSeminarUser(userData);
    setUsers([...mockSeminarUsers].filter((u) => u.role !== 'guest' && u.role !== 'organizer'));
    toast({
      title: isNew ? t('seminar_student_created_title') : t('seminar_student_updated_title'),
      description: t('seminar_student_saved_description', { name: userData.name }),
    });
    setIsFormOpen(false);
    setSelectedUser(undefined);
  };

  const handleDelete = () => {
    if (!userToDelete) return;
    const updatedUsers = users.filter((u) => u.id !== userToDelete.id);
    const idx = mockSeminarUsers.findIndex((u) => u.id === userToDelete.id);
    if (idx !== -1) mockSeminarUsers.splice(idx, 1);
    setUsers(updatedUsers);
    toast({
      title: t('seminar_student_deleted_title'),
      description: t('seminar_student_deleted_description', { name: userToDelete.name }),
    });
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const openCreateForm = () => {
    setSelectedUser(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (user: SeminarUser) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (user: SeminarUser) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            {t('seminar_students_dashboard_title')}
          </h1>
          <p className="text-muted-foreground">
            {t('seminar_students_dashboard_description')}
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('seminar_students_create_button')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('seminar_students_table_title')}</CardTitle>
          <CardDescription>
            {t('seminar_students_table_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('userTable_col_name')}</TableHead>
                <TableHead>{t('userTable_col_email')}</TableHead>
                <TableHead>{t('seminar_user_form_role_label')}</TableHead>
                <TableHead>{t('seminar_students_plan_status_label')}</TableHead>
                <TableHead className="text-right">{t('courseTable_col_actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    u.role === 'participant' &&
                    router.push(`/dashboard/seminar-students/${u.id}`)
                  }
                >
                  <TableCell className="flex items-center gap-2 font-medium">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={u.avatar} alt={u.name} />
                      <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                    </Avatar>
                    {u.name}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getSeminarRoleLabel(u.role, t)}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.paymentPlan ? (
                      <Badge
                        variant={
                          u.paymentPlan.status === 'Active' || u.paymentPlan.status === 'Settled'
                            ? 'success'
                            : 'secondary'
                        }
                      >
                        {getSeminarPlanStatusLabel(u.paymentPlan.status, t)}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {t('seminar_students_no_plan')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditForm(u);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {currentUser?.id !== u.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(u);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md md:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? t('seminar_students_edit_title') : t('seminar_students_create_title')}
            </DialogTitle>
            <DialogDescription>
              {t('seminar_students_form_description')}
            </DialogDescription>
          </DialogHeader>
          <SeminarUserForm
            user={selectedUser}
            onSaveAction={handleSaveUser}
            onCancelAction={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {userToDelete && (
        <DeleteSeminarUserDialog
          isOpen={isDeleteDialogOpen}
          onOpenChangeAction={setIsDeleteDialogOpen}
          userName={userToDelete.name}
          onConfirmAction={handleDelete}
        />
      )}
    </div>
  );
}
