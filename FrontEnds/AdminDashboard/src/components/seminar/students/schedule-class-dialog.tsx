'use client';

import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { SeminarClassSchedule } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/components/language-provider';
import { formatLocalizedDate } from '@/lib/utils/localized-ui';

type ScheduleClassDialogProps = {
  isOpen: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onSaveAction: (data: SeminarClassSchedule) => void;
  onDeleteAction: (classId: string) => void;
  classData?: SeminarClassSchedule;
  selectedDate: Date;
};

export function ScheduleClassDialog({
  isOpen,
  onOpenChangeAction,
  onSaveAction,
  onDeleteAction,
  classData,
  selectedDate,
}: ScheduleClassDialogProps) {
  const onOpenChange = onOpenChangeAction;
  const onSave = onSaveAction;
  const onDelete = onDeleteAction;
  const { t, locale } = useLanguage();
  const { toast } = useToast();

  const formSchema = useMemo(
    () =>
      z.object({
        className: z.string().min(1, t('schedule_class_name_required')),
        startTime: z.string().min(1, t('schedule_class_start_required')),
        endTime: z.string().min(1, t('schedule_class_end_required')),
        description: z.string().optional(),
      }),
    [t]
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      className: classData?.className || '',
      startTime: classData?.startTime || '',
      endTime: classData?.endTime || '',
      description: classData?.description || '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        className: classData?.className || '',
        startTime: classData?.startTime || '',
        endTime: classData?.endTime || '',
        description: classData?.description || '',
      });
    }
  }, [classData, form, isOpen]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const isoDateString = format(selectedDate, 'yyyy-MM-dd');

    const newClassSchedule: SeminarClassSchedule = {
      id: classData?.id || `class-${Date.now()}`,
      date: isoDateString,
      status: classData?.status || 'pending',
      ...values,
      description: values.description || '',
    };
    onSave(newClassSchedule);
    toast({
      title: classData ? t('schedule_class_updated_title') : t('schedule_class_created_title'),
      description: t('schedule_class_saved_description', { className: values.className }),
    });
  }

  const handleDelete = () => {
    if (classData) {
      onDelete(classData.id);
      toast({
        variant: 'destructive',
        title: t('schedule_class_deleted_title'),
        description: t('schedule_class_deleted_description', { className: classData.className }),
      });
      onOpenChange(false);
    }
  };

  const selectedDateLabel = formatLocalizedDate(selectedDate, locale, t);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {classData ? t('schedule_class_edit_title') : t('schedule_class_create_title')}
          </DialogTitle>
          <DialogDescription>
            {t('schedule_class_dialog_description', { date: selectedDateLabel })}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="className"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('schedule_class_name_label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('schedule_class_name_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('schedule_class_start_label')}</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('schedule_class_end_label')}</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('schedule_class_description_label')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('schedule_class_description_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              {classData && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="mr-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('actions_delete')}
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t('actions_cancel')}
              </Button>
              <Button type="submit">{t('schedule_class_save_button')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
