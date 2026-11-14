'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import type { SeminarRoom } from '@/lib/types';
import { useSeminar } from '@/contexts/seminar-context';
import { useLanguage } from '@/components/language-provider';

type RoomFormProps = {
  room?: SeminarRoom;
  onSaveAction: (data: SeminarRoom) => void;
  onCancelAction: () => void;
};

export function RoomForm({ room, onSaveAction, onCancelAction }: RoomFormProps) {
  const onSave = onSaveAction;
  const onCancel = onCancelAction;
  const { t } = useLanguage();
  const { user } = useSeminar();
  const formSchema = React.useMemo(
    () =>
      z.object({
        name: z.string().min(3, { message: t('room_form_name_min') }),
        duration: z.coerce.number().min(1, { message: t('room_form_duration_min') }),
        allowGuests: z.boolean(),
        guestLimit: z.coerce.number().optional(),
      }),
    [t]
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: room?.name || '',
      duration: room?.duration || 60,
      allowGuests: room?.allowGuests || false,
      guestLimit: room?.guestLimit || 10,
    },
  });

  const allowGuests = form.watch('allowGuests');

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    const newRoomData: SeminarRoom = {
      id: room?.id || `room-${Date.now()}`,
      organizerId: room?.organizerId || user.id,
      participants: room?.participants || [],
      participantRoles: room?.participantRoles || {},
      ...values,
      guestLimit: values.allowGuests ? values.guestLimit : undefined,
    };
    onSave(newRoomData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('room_form_name_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('room_form_name_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('room_form_duration_label')}</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="allowGuests"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t('room_form_allow_guests_label')}</FormLabel>
                <FormDescription>
                  {t('room_form_allow_guests_description')}
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {allowGuests && (
          <FormField
            control={form.control}
            name="guestLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('room_form_guest_limit_label', { value: field.value ?? 10 })}</FormLabel>
                <FormControl>
                  <Slider
                    value={[field.value || 10]}
                    onValueChange={(vals) => field.onChange(vals[0])}
                    min={1}
                    max={50}
                    step={1}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('actions_cancel')}
          </Button>
          <Button type="submit">{t('room_form_save_button')}</Button>
        </div>
      </form>
    </Form>
  );
}
