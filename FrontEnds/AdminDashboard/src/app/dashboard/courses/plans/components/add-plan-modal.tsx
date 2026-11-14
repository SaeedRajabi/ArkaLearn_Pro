
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { CustomRichTextEditor } from '@/components/ui/custom-rich-text-editor';
import { useStore } from '@/lib/store';
import type { TrainingPlan } from '@/lib/types';

const planSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  hourlyRate: z.coerce.number().positive('Amount must be positive.'),
  totalHours: z.coerce.number().int().positive('Hours must be a positive integer.'),
  totalAmount: z.coerce.number().positive('Amount must be positive.'),
  description: z.string().min(1, 'Description is required.'),
});

type PlanForm = z.infer<typeof planSchema>;

export function AddPlanModal({
  open,
  onOpenChangeAction,
  plan,
}: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  plan?: TrainingPlan | null;
}) {
  const { t } = useLanguage();
  const onOpenChange = onOpenChangeAction;
  const { addPlan, updatePlan } = useStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const isEditMode = !!plan;

  const form = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
  });

  React.useEffect(() => {
    if (open) {
      if (isEditMode && plan) {
        form.reset({
          title: plan.title,
          description: plan.description,
          hourlyRate: plan.hourlyRate,
          totalHours: plan.totalHours,
          totalAmount: plan.totalAmount,
        });
      } else {
        form.reset({
          title: '',
          description: '',
          hourlyRate: '' as any,
          totalHours: '' as any,
          totalAmount: '' as any,
        });
      }
    }
  }, [open, isEditMode, plan, form]);

  const handleSave = (values: PlanForm) => {
    setIsLoading(true);
    
    if (isEditMode && plan) {
      updatePlan(plan.id, values);
      toast({
        title: t('editPlan_toast_success_title'),
        description: t('editPlan_toast_success_description').replace('{name}', values.title),
      });
    } else {
      addPlan(values);
      toast({
        title: t('addPlan_toast_success_title'),
        description: t('addPlan_toast_success_description').replace('{name}', values.title),
      });
    }

    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('editPlan_title') : t('addPlan_title')}</DialogTitle>
          <DialogDescription>{isEditMode ? t('editPlan_description') : t('addPlan_description')}</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto pr-6 -mr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('addPlan_title_label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('addPlan_title_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addPlan_hourly_rate_label')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder={t('addPlan_hourly_rate_placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addPlan_total_hours_label')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder={t('addPlan_total_hours_placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addPlan_total_amount_label')}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder={t('addPlan_total_amount_placeholder')} {...field} />
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
                    <FormLabel>{t('addPlan_description_label')}</FormLabel>
                    <FormControl>
                      <CustomRichTextEditor
                        content={field.value}
                        onChangeAction={field.onChange}
                        placeholder={t('addPlan_description_placeholder')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4 mt-auto border-t">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? t('editPlan_save_button') : t('addPlan_save_button')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
