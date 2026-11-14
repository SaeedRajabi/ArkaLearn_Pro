'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { assignManagedStudentsToRoom } from '@/services/room-service';
import { searchManagedRoomStudents, type ManagedRoomStudentRow } from '@/services/managed-room-students-service';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: number;
  assignedManagedStudentIds: number[];
  onAssigned: () => void | Promise<void>;
};

export function RoomAssignStudentsDialog({
  open,
  onOpenChange,
  roomId,
  assignedManagedStudentIds,
  onAssigned,
}: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [catalogStudents, setCatalogStudents] = useState<ManagedRoomStudentRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'available'>('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchManagedRoomStudents({ pageNumber: 1, pageSize: 300, inputValue: '' });
      setCatalogStudents(result.list);
    } catch {
      setCatalogStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSelectedIds([...assignedManagedStudentIds]);
    void loadCatalog();
  }, [open, assignedManagedStudentIds, loadCatalog]);

  const filteredStudents = useMemo(() => {
    if (filter === 'assigned') {
      return catalogStudents.filter((s) => selectedIds.includes(s.id));
    }
    if (filter === 'available') {
      return catalogStudents.filter((s) => !selectedIds.includes(s.id));
    }
    return catalogStudents;
  }, [catalogStudents, filter, selectedIds]);

  const toggleStudent = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await assignManagedStudentsToRoom(roomId, selectedIds);
      toast({
        title: t('toast_settings_saved_title'),
        description: t('room_details_members_assign_success'),
      });
      await onAssigned();
      onOpenChange(false);
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('rooms_dashboard_save_failed'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden flex flex-col" dir={undefined}>
        <DialogHeader>
          <DialogTitle>{t('room_details_add_members_title')}</DialogTitle>
          <DialogDescription>{t('room_api_assign_students_description')}</DialogDescription>
        </DialogHeader>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              {t('room_api_students_tab_all')}
            </TabsTrigger>
            <TabsTrigger value="assigned" className="text-xs sm:text-sm">
              {t('room_details_members_tab_assigned')}
            </TabsTrigger>
            <TabsTrigger value="available" className="text-xs sm:text-sm">
              {t('room_details_members_tab_available')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="min-h-0 flex-1 overflow-y-auto space-y-2 py-2 pr-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">{t('room_api_assign_students_empty')}</p>
          ) : (
            filteredStudents.map((s) => {
              const checked = selectedIds.includes(s.id);
              return (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 hover:bg-muted/50"
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggleStudent(s.id)} />
                  <span className="text-sm">
                    {s.firstName} {s.lastName} — {s.userName}
                  </span>
                </label>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('actions_cancel')}
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('room_details_members_assign_save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
