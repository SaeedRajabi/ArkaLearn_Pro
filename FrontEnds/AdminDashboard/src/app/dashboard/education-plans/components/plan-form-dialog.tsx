'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LocalizedDatePicker } from '@/components/ui/localized-date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import type { TrainingPlan } from '@/lib/types';
import {
  createTrainingPlan,
  updateTrainingPlan,
  getTrainingPlanById,
  type CreateEducationPlanPayload,
  applyInstallmentMarkup,
  buildDefaultInstallmentRows,
  mapPlanInstallmentsToFormRows,
} from '@/services/training-plan-service';
import { searchManagedRoomStudents, type ManagedRoomStudentRow } from '@/services/managed-room-students-service';
import { getRoomsByOwnerId } from '@/services/room-service';
import {
  apiIsoToLocalDate,
  dateToUtcEndIso,
  dateToUtcStartIso,
} from '@/lib/utils/localized-dates';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: TrainingPlan | null;
  onSaved: () => void | Promise<void>;
};

export function PlanFormDialog({ open, onOpenChange, plan, onSaved }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEdit = Boolean(plan?.id);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<ManagedRoomStudentRow[]>([]);
  const [rooms, setRooms] = useState<{ roomId: number; title: string }[]>([]);
  const [paymentType, setPaymentType] = useState<'cash' | 'installment'>('cash');
  const [installmentCount, setInstallmentCount] = useState(3);
  const [installmentRows, setInstallmentRows] = useState<
    { installmentNumber: number; dueDate: Date; amountToman: number; isPaid?: boolean }[]
  >([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [hasPaidInstallments, setHasPaidInstallments] = useState(false);
  const skipAutoInstallmentsRef = useRef(false);
  const skipAutoTotalRef = useRef(false);

  const applyPaymentFromPlan = useCallback((loaded: TrainingPlan) => {
    skipAutoInstallmentsRef.current = true;
    const type = loaded.paymentType === 'installment' ? 'installment' : 'cash';
    setPaymentType(type);
    if (type === 'installment' && loaded.installments?.length) {
      const rows = mapPlanInstallmentsToFormRows(loaded.installments);
      setInstallmentRows(rows);
      setInstallmentCount(rows.length);
      setHasPaidInstallments(rows.some((row) => row.isPaid));
    } else {
      setInstallmentRows([]);
      setInstallmentCount(3);
      setHasPaidInstallments(false);
    }
  }, []);

  const resetPaymentDefaults = useCallback(() => {
    skipAutoInstallmentsRef.current = false;
    setPaymentType('cash');
    setInstallmentCount(3);
    setInstallmentRows([]);
    setHasPaidInstallments(false);
  }, []);

  const schema = useMemo(
    () =>
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        hourlyRate: z.coerce.number().positive(),
        totalHours: z.coerce.number().int().positive(),
        totalAmount: z.coerce.number().positive(),
        managedRoomStudentId: z.string().min(1),
        roomId: z.string().min(1),
        startDate: z.date({ required_error: 'required' }),
        endDate: z.date({ required_error: 'required' }),
      }),
    []
  );

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      hourlyRate: 0,
      totalHours: 0,
      totalAmount: 0,
      managedRoomStudentId: '',
      roomId: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 86400000),
    },
  });

  const loadOptions = useCallback(async () => {
    const [studentRes, roomRes] = await Promise.all([
      searchManagedRoomStudents({ pageNumber: 1, pageSize: 300, inputValue: '' }),
      user?.id
        ? getRoomsByOwnerId({ userId: Number(user.id), pageNumber: 1, pageSize: 200 })
        : Promise.resolve({ queryResult: [] as { roomId: number; title: string }[], totalCount: 0 }),
    ]);
    setStudents(studentRes.list);
    setRooms(
      (roomRes.queryResult ?? []).map((r) => ({
        roomId: r.roomId,
        title: r.title ?? `Room ${r.roomId}`,
      }))
    );
  }, [user?.id]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const init = async () => {
      skipAutoTotalRef.current = true;
      await loadOptions();

      if (plan?.id) {
        setLoadingPlan(true);
        try {
          const loaded = await getTrainingPlanById(Number(plan.id), true);
          const source = loaded ?? plan;
          if (cancelled) return;

          form.reset({
            title: source.title,
            description: source.description,
            hourlyRate: source.hourlyRate,
            totalHours: source.totalHours,
            totalAmount: source.totalAmount,
            managedRoomStudentId: String(source.managedRoomStudentId ?? ''),
            roomId: String(source.roomId ?? ''),
            startDate: apiIsoToLocalDate(source.startDateUtc) ?? new Date(),
            endDate: apiIsoToLocalDate(source.endDateUtc) ?? new Date(),
          });
          applyPaymentFromPlan(source);
        } finally {
          if (!cancelled) setLoadingPlan(false);
        }
      } else {
        form.reset({
          title: '',
          description: '',
          hourlyRate: '' as unknown as number,
          totalHours: '' as unknown as number,
          totalAmount: '' as unknown as number,
          managedRoomStudentId: '',
          roomId: '',
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 86400000),
        });
        resetPaymentDefaults();
      }

      skipAutoTotalRef.current = false;
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [open, plan, form, loadOptions, applyPaymentFromPlan, resetPaymentDefaults]);

  const hourlyRate = form.watch('hourlyRate');
  const totalHours = form.watch('totalHours');
  const totalAmount = form.watch('totalAmount');
  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');
  useEffect(() => {
    if (skipAutoTotalRef.current) return;
    const rate = Number(hourlyRate);
    const hours = Number(totalHours);
    if (rate > 0 && hours > 0) {
      form.setValue('totalAmount', rate * hours, { shouldValidate: true });
    }
  }, [hourlyRate, totalHours, form]);

  useEffect(() => {
    if (paymentType !== 'installment') return;
    if (skipAutoInstallmentsRef.current) {
      skipAutoInstallmentsRef.current = false;
      return;
    }
    const base = Number(totalAmount);
    if (base <= 0 || !startDate || !endDate) return;

    setInstallmentRows((prev) => {
      const paidRows = prev.filter((row) => row.isPaid);
      if (paidRows.length > 0) {
        const generated = buildDefaultInstallmentRows(base, installmentCount, startDate, endDate);
        const merged = generated.map((row) => {
          const paid = paidRows.find((item) => item.installmentNumber === row.installmentNumber);
          return paid ?? row;
        });
        paidRows.forEach((paid) => {
          if (!merged.some((row) => row.installmentNumber === paid.installmentNumber)) {
            merged.push(paid);
          }
        });
        return merged.sort((a, b) => a.installmentNumber - b.installmentNumber);
      }
      return buildDefaultInstallmentRows(base, installmentCount, startDate, endDate);
    });
  }, [paymentType, installmentCount, totalAmount, startDate, endDate]);

  const onSubmit = async (values: z.infer<typeof schema>) => {
    const ownerUserId = Number(user?.id);
    if (!ownerUserId) {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('toast_error_description') });
      return;
    }

    if (paymentType === 'installment' && installmentRows.length === 0) {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('education_plan_installment_required') });
      return;
    }

    const payload: CreateEducationPlanPayload = {
      title: values.title,
      description: values.description,
      hourlyRate: values.hourlyRate,
      totalHours: values.totalHours,
      totalCost: values.totalAmount,
      managedRoomStudentId: Number(values.managedRoomStudentId),
      roomId: Number(values.roomId),
      ownerUserId,
      startDateUtc: dateToUtcStartIso(values.startDate),
      endDateUtc: dateToUtcEndIso(values.endDate),
      paymentType,
      installments:
        paymentType === 'installment'
          ? installmentRows.map((row) => ({
              installmentNumber: row.installmentNumber,
              dueDateUtc: dateToUtcStartIso(row.dueDate),
              amountToman: row.amountToman,
            }))
          : [],
    };

    setSaving(true);
    try {
      if (isEdit && plan) {
        await updateTrainingPlan(Number(plan.id), payload);
      } else {
        await createTrainingPlan(payload);
      }
      toast({ title: t('toast_settings_saved_title'), description: t('education_plan_save_success') });
      await onSaved();
      onOpenChange(false);
    } catch {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('toast_error_description') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('editPlan_title') : t('addPlan_title')}</DialogTitle>
          <DialogDescription>{t('education_plan_form_description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {loadingPlan ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('loading')}
              </div>
            ) : null}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('planTable_col_title')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="managedRoomStudentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('education_plan_student_label')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('education_plan_student_placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.firstName} {s.lastName} — {s.userName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('education_plan_room_label')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('education_plan_room_placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map((r) => (
                          <SelectItem key={r.roomId} value={String(r.roomId)}>
                            {r.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('education_plan_start_date')}</FormLabel>
                    <FormControl>
                      <LocalizedDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t('education_plan_start_date')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('education_plan_end_date')}</FormLabel>
                    <FormControl>
                      <LocalizedDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t('education_plan_end_date')}
                        disableDate={(date) => {
                          const start = form.getValues('startDate');
                          return start ? date < start : false;
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('planTable_col_hourly_rate')}</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
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
                    <FormLabel>{t('planTable_col_total_hours')}</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
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
                    <FormLabel>{t('planTable_col_total_amount')}</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium">{t('education_plan_payment_title')}</h4>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="payment-cash">{t('education_plan_payment_cash')}</Label>
                <Switch
                  id="payment-type"
                  checked={paymentType === 'installment'}
                  disabled={hasPaidInstallments}
                  onCheckedChange={(checked) => setPaymentType(checked ? 'installment' : 'cash')}
                />
                <Label htmlFor="payment-type">{t('education_plan_payment_installment')}</Label>
              </div>
              {hasPaidInstallments ? (
                <p className="text-xs text-muted-foreground">{t('education_plan_paid_installment_lock_hint')}</p>
              ) : null}
              {paymentType === 'installment' ? (
                <div className="space-y-3">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t('education_plan_installment_count')}</Label>
                      <Select
                        value={String(installmentCount)}
                        onValueChange={(value) => setInstallmentCount(Number(value))}
                        disabled={hasPaidInstallments}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2, 3, 4, 6].map((count) => (
                            <SelectItem key={count} value={String(count)}>
                              {count}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('education_plan_final_amount')}</Label>
                      <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                        {applyInstallmentMarkup(Number(totalAmount) || 0).toLocaleString()} {t('education_plan_currency')}
                      </div>
                      <p className="text-xs text-muted-foreground">{t('education_plan_installment_markup_hint')}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {installmentRows.map((row, index) => (
                      <div key={row.installmentNumber} className="grid gap-3 rounded-md border p-3 sm:grid-cols-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {t('education_plan_installment_label', { number: row.installmentNumber })}
                          {row.isPaid ? <Badge variant="secondary">{t('education_plan_installment_paid')}</Badge> : null}
                        </div>
                        <LocalizedDatePicker
                          value={row.dueDate}
                          onChange={(date) => {
                            if (!date || row.isPaid) return;
                            setInstallmentRows((prev) =>
                              prev.map((item, i) => (i === index ? { ...item, dueDate: date } : item))
                            );
                          }}
                          placeholder={t('education_plan_installment_due_date')}
                          disabled={row.isPaid}
                        />
                        <Input
                          type="number"
                          min={1}
                          value={row.amountToman}
                          disabled={row.isPaid}
                          onChange={(e) => {
                            if (row.isPaid) return;
                            const amountToman = Number(e.target.value);
                            setInstallmentRows((prev) =>
                              prev.map((item, i) => (i === index ? { ...item, amountToman } : item))
                            );
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('plan_details_description')}</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('actions_cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t('save_changes')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
