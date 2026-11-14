'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { SeminarUser } from '@/lib/types';
import { MultiSelect } from '@/components/ui/multi-select';
import { useLanguage } from '@/components/language-provider';

interface AddUserToRoomDialogProps {
  isOpen: boolean;
  onOpenChangeAction: (open: boolean) => void;
  users: SeminarUser[];
  onAddUsersAction: (userIds: string[]) => void;
}

export function AddUserToRoomDialog({
  isOpen,
  onOpenChangeAction,
  users,
  onAddUsersAction,
}: AddUserToRoomDialogProps) {
  const { t } = useLanguage();
  const onOpenChange = onOpenChangeAction;
  const onAddUsers = onAddUsersAction;
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const userOptions = users.map((user) => ({
    value: user.id,
    label: `${user.name} (${user.email})`,
  }));

  const handleSave = () => {
    onAddUsers(selectedUsers);
    setSelectedUsers([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
          <DialogTitle>{t('seminar_add_users_to_room_title')}</DialogTitle>
          <DialogDescription>
            {t('seminar_add_users_to_room_description')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <MultiSelect
            options={userOptions}
            selected={selectedUsers}
            onChangeAction={setSelectedUsers}
            placeholder={t('seminar_add_users_to_room_placeholder')}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('actions_cancel')}
          </Button>
          <Button onClick={handleSave} disabled={selectedUsers.length === 0}>
            {t('seminar_add_to_room')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
