'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FlatpickrDateTimePicker } from '@/components/shared/flatpickr-datetime-picker';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  createProfessorEducationPlan,
  updateProfessorEducationPlan,
  getProfessorEducationPlanById,
  applyInstallmentMarkup,
  buildDefaultInstallmentRows,
  redistributeInstallmentAmounts,
  installmentRowsSum,
  mapPlanInstallmentsToFormRows,
  type CreateEducationPlanPayload,
  type ProfessorEducationPlan,
} from '@/lib/api/professor-education-plans';
import { cn } from '@/lib/utils';
import { searchMyManagedRoomStudents } from '@/lib/api/professor-managed-students';
import { getProfessorRooms } from '@/lib/api/professor-rooms';
import { apiIsoToLocalDate, dateToUtcEndIso, dateToUtcStartIso } from '@/lib/utils/localized-dates';
import type { Dictionary } from '@/types';

type InstallmentRow = {
  installmentNumber: number;
  dueDate: Date;
  amountToman: number;
  isPaid?: boolean;
};

type Props = {
  dict: Dictionary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: ProfessorEducationPlan | null;
  onSaved: () => void | Promise<void>;
};

export function ProfessorPlanFormDialog({ dict, open, onOpenChange, plan, onSaved }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const t = (key: string, fb: string) => getDictValue(dict, key, fb);

  const isEdit = Boolean(plan?.id);
  const [saving, setSaving] = React.useState(false);
  const [loadingOptions, setLoadingOptions] = React.useState(false);
  const [students, setStudents] = React.useState<{ id: number; label: string }[]>([]);
  const [rooms, setRooms] = React.useState<{ id: number; label: string }[]>([]);

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [hourlyRate, setHourlyRate] = React.useState('');
  const [totalHours, setTotalHours] = React.useState('');
  const [totalCost, setTotalCost] = React.useState('');
  const [managedRoomStudentId, setManagedRoomStudentId] = React.useState('');
  const [roomId, setRoomId] = React.useState('');
  const [startDate, setStartDate] = React.useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = React.useState<Date | undefined>(
    new Date(Date.now() + 90 * 86400000)
  );
  const [paymentType, setPaymentType] = React.useState<'cash' | 'installment'>('cash');
  const [installmentCount, setInstallmentCount] = React.useState(3);
  const [installmentRows, setInstallmentRows] = React.useState<InstallmentRow[]>([]);
  const [loadingPlan, setLoadingPlan] = React.useState(false);
  const [hasPaidInstallments, setHasPaidInstallments] = React.useState(false);
  const skipAutoInstallmentsRef = React.useRef(false);
  const skipAutoTotalRef = React.useRef(false);
  const skipAmountRedistributeRef = React.useRef(false);

  const finalInstallmentTotal = applyInstallmentMarkup(Number(totalCost) || 0);
  const installmentSum = installmentRowsSum(installmentRows);
  const installmentSumMismatch =
    paymentType === 'installment' &&
    installmentRows.length > 0 &&
    Math.abs(installmentSum - finalInstallmentTotal) > 0.5;

  const mergeWithPaidRows = React.useCallback((generated: InstallmentRow[], previous: InstallmentRow[]) => {
    const paidRows = previous.filter((row) => row.isPaid);
    if (paidRows.length === 0) return generated;
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
  }, []);

  const createInstallmentSchedule = React.useCallback(
    (count: number, previous: InstallmentRow[] = []) => {
      const base = Number(totalCost);
      if (base <= 0 || !startDate || !endDate) return [] as InstallmentRow[];
      const generated = buildDefaultInstallmentRows(base, count, startDate, endDate);
      const withPreservedDates = generated.map((row) => {
        const previousRow = previous.find((item) => item.installmentNumber === row.installmentNumber);
        if (!previousRow || previousRow.isPaid) return row;
        return { ...row, dueDate: previousRow.dueDate };
      });
      return mergeWithPaidRows(withPreservedDates, previous);
    },
    [totalCost, startDate, endDate, mergeWithPaidRows]
  );

  const applyPaymentFromPlan = React.useCallback((loaded: ProfessorEducationPlan) => {
    skipAutoInstallmentsRef.current = true;
    skipAmountRedistributeRef.current = true;
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

  const resetPaymentDefaults = React.useCallback(() => {
    skipAutoInstallmentsRef.current = false;
    skipAmountRedistributeRef.current = false;
    setPaymentType('cash');
    setInstallmentCount(3);
    setInstallmentRows([]);
    setHasPaidInstallments(false);
  }, []);

  React.useEffect(() => {
    if (skipAutoTotalRef.current) return;
    const rate = Number(hourlyRate);
    const hours = Number(totalHours);
    if (rate > 0 && hours > 0) {
      setTotalCost(String(rate * hours));
    }
  }, [hourlyRate, totalHours]);

  // Only redistribute amounts when base cost changes — never wipe custom due dates.
  React.useEffect(() => {
    if (paymentType !== 'installment') return;
    if (skipAmountRedistributeRef.current) {
      skipAmountRedistributeRef.current = false;
      return;
    }
    if (skipAutoInstallmentsRef.current) {
      skipAutoInstallmentsRef.current = false;
      return;
    }
    const base = Number(totalCost);
    if (base <= 0) return;

    setInstallmentRows((prev) => {
      if (prev.length === 0) {
        if (!startDate || !endDate) return prev;
        return buildDefaultInstallmentRows(base, installmentCount, startDate, endDate);
      }
      return redistributeInstallmentAmounts(prev, base);
    });
  }, [paymentType, totalCost, installmentCount, startDate, endDate]);

  const handlePaymentTypeChange = (enabled: boolean) => {
    if (hasPaidInstallments && !enabled) return;
    const nextType = enabled ? 'installment' : 'cash';
    setPaymentType(nextType);
    if (!enabled) {
      setInstallmentRows([]);
      return;
    }
    skipAmountRedistributeRef.current = true;
    setInstallmentRows((prev) => createInstallmentSchedule(installmentCount, prev));
  };

  const handleInstallmentCountChange = (value: string) => {
    const count = Number(value);
    setInstallmentCount(count);
    skipAmountRedistributeRef.current = true;
    setInstallmentRows((prev) => createInstallmentSchedule(count, prev));
  };

  const updateInstallmentRow = (index: number, patch: Partial<InstallmentRow>) => {
    setInstallmentRows((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const loadOptions = React.useCallback(async () => {
    const ownerId = Number(user?.id);
    if (!ownerId) return;
    setLoadingOptions(true);
    try {
      const [studentRes, roomRes] = await Promise.all([
        searchMyManagedRoomStudents({ pageSize: 300 }),
        getProfessorRooms({ userId: ownerId, pageSize: 200 }),
      ]);
      setStudents(
        studentRes.list.map((s) => ({
          id: s.id,
          label: `${s.firstName} ${s.lastName} — ${s.userName}`,
        }))
      );
      setRooms(roomRes.rooms.map((r) => ({ id: r.roomId, label: r.title || `Room ${r.roomId}` })));
    } catch {
      setStudents([]);
      setRooms([]);
    } finally {
      setLoadingOptions(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const init = async () => {
      skipAutoTotalRef.current = true;
      await loadOptions();

      if (plan?.id) {
        setLoadingPlan(true);
        try {
          const loaded = await getProfessorEducationPlanById(plan.id);
          const source = loaded ?? plan;
          if (cancelled) return;

          setTitle(source.title);
          setDescription(source.description ?? '');
          setHourlyRate(String(source.hourlyRate));
          setTotalHours(String(source.totalHours));
          setTotalCost(String(source.totalCost));
          setManagedRoomStudentId(String(source.managedRoomStudentId ?? ''));
          setRoomId(String(source.roomId ?? ''));
          setStartDate(apiIsoToLocalDate(source.startDateUtc) ?? new Date());
          setEndDate(apiIsoToLocalDate(source.endDateUtc) ?? new Date());
          applyPaymentFromPlan(source);
        } finally {
          if (!cancelled) setLoadingPlan(false);
        }
      } else {
        setTitle('');
        setDescription('');
        setHourlyRate('');
        setTotalHours('');
        setTotalCost('');
        setManagedRoomStudentId('');
        setRoomId('');
        setStartDate(new Date());
        setEndDate(new Date(Date.now() + 90 * 86400000));
        resetPaymentDefaults();
      }

      skipAutoTotalRef.current = false;
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [open, plan, loadOptions, applyPaymentFromPlan, resetPaymentDefaults]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const ownerUserId = Number(user?.id);
    if (!ownerUserId) return;

    if (!title.trim() || !description.trim() || !managedRoomStudentId || !roomId || !startDate || !endDate) {
      toast({
        title: t('professorDashboard.educationPlans.validationError', isRtl ? 'اطلاعات ناقص' : 'Missing fields'),
        variant: 'destructive',
      });
      return;
    }

    if (paymentType === 'installment') {
      if (installmentRows.length === 0) {
        toast({
          title: t('professorDashboard.educationPlans.validationError', isRtl ? 'اطلاعات ناقص' : 'Missing fields'),
          description: t(
            'professorDashboard.educationPlans.installmentRequired',
            isRtl ? 'حداقل یک قسط تعریف کنید.' : 'Define at least one installment.'
          ),
          variant: 'destructive',
        });
        return;
      }
      if (installmentRows.some((row) => !row.dueDate || !(row.amountToman > 0))) {
        toast({
          title: t('professorDashboard.educationPlans.validationError', isRtl ? 'اطلاعات ناقص' : 'Missing fields'),
          description: t(
            'professorDashboard.educationPlans.installmentRowInvalid',
            isRtl
              ? 'برای هر قسط تاریخ سررسید و مبلغ معتبر وارد کنید.'
              : 'Enter a valid due date and amount for every installment.'
          ),
          variant: 'destructive',
        });
        return;
      }
      if (installmentSumMismatch) {
        toast({
          title: t('professorDashboard.educationPlans.validationError', isRtl ? 'اطلاعات ناقص' : 'Missing fields'),
          description: t(
            'professorDashboard.educationPlans.installmentSumMismatch',
            isRtl
              ? 'جمع مبالغ اقساط باید با مبلغ نهایی برابر باشد.'
              : 'Sum of installment amounts must equal the final amount.'
          ),
          variant: 'destructive',
        });
        return;
      }
    }

    const payload: CreateEducationPlanPayload = {
      title: title.trim(),
      description: description.trim(),
      hourlyRate: Number(hourlyRate),
      totalHours: Number(totalHours),
      totalCost: Number(totalCost),
      managedRoomStudentId: Number(managedRoomStudentId),
      roomId: Number(roomId),
      ownerUserId,
      startDateUtc: dateToUtcStartIso(startDate),
      endDateUtc: dateToUtcEndIso(endDate),
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
        await updateProfessorEducationPlan(plan.id, payload);
      } else {
        await createProfessorEducationPlan(payload);
      }
      toast({
        title: t('professorDashboard.educationPlans.saveSuccess', isRtl ? 'پلن ذخیره شد' : 'Plan saved'),
      });
      await onSaved();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t('professorDashboard.educationPlans.saveFailed', isRtl ? 'ذخیره انجام نشد' : 'Save failed'),
        description: getApiErrorMessage(error, ''),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t('professorDashboard.educationPlans.editPlan', isRtl ? 'ویرایش پلن' : 'Edit plan')
              : t('professorDashboard.educationPlans.addPlan', isRtl ? 'پلن جدید' : 'New plan')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'professorDashboard.educationPlans.formHint',
              isRtl
                ? 'دانشجو و اتاق آنلاین را انتخاب کنید و ساعات آموزشی را تعیین کنید.'
                : 'Select a student and online room, then set teaching hours.'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          {loadingPlan ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('professorDashboard.educationPlans.loadingPlan', isRtl ? 'بارگذاری پلن…' : 'Loading plan…')}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>{t('professorDashboard.educationPlans.titleLabel', isRtl ? 'عنوان پلن' : 'Plan title')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('professorDashboard.educationPlans.studentLabel', isRtl ? 'دانشجو' : 'Student')}</Label>
              <Select value={managedRoomStudentId} onValueChange={setManagedRoomStudentId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      'professorDashboard.educationPlans.studentPlaceholder',
                      isRtl ? 'انتخاب دانشجو' : 'Select student'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('professorDashboard.educationPlans.roomLabel', isRtl ? 'اتاق آنلاین' : 'Online room')}</Label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      'professorDashboard.educationPlans.roomPlaceholder',
                      isRtl ? 'انتخاب اتاق' : 'Select room'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingOptions ? (
            <p className="text-xs text-muted-foreground">
              {t('professorDashboard.educationPlans.loadingOptions', isRtl ? 'بارگذاری گزینه‌ها…' : 'Loading options…')}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('professorDashboard.educationPlans.startDate', isRtl ? 'تاریخ شروع' : 'Start date')}</Label>
              <FlatpickrDateTimePicker
                mode="date"
                value={startDate}
                onChange={setStartDate}
                locale={locale === 'fa' ? 'fa' : 'en'}
                isRtl={isRtl}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('professorDashboard.educationPlans.endDate', isRtl ? 'تاریخ پایان' : 'End date')}</Label>
              <FlatpickrDateTimePicker
                mode="date"
                value={endDate}
                onChange={setEndDate}
                locale={locale === 'fa' ? 'fa' : 'en'}
                isRtl={isRtl}
                disableDate={(date) => (startDate ? date < startDate : false)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('professorDashboard.educationPlans.hourlyRate', isRtl ? 'نرخ ساعتی' : 'Hourly rate')}</Label>
              <Input type="number" min={1} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>{t('professorDashboard.educationPlans.totalHours', isRtl ? 'مجموع ساعات' : 'Total hours')}</Label>
              <Input type="number" min={1} value={totalHours} onChange={(e) => setTotalHours(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>{t('professorDashboard.educationPlans.totalCost', isRtl ? 'مبلغ کل' : 'Total amount')}</Label>
              <Input type="number" min={1} value={totalCost} onChange={(e) => setTotalCost(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <h4 className="font-medium">
              {t('professorDashboard.educationPlans.paymentTitle', isRtl ? 'نحوه پرداخت' : 'Payment method')}
            </h4>
            <div className="flex items-center justify-between gap-3">
              <Label>{t('professorDashboard.educationPlans.paymentCash', isRtl ? 'نقدی' : 'Cash')}</Label>
              <Switch
                checked={paymentType === 'installment'}
                disabled={hasPaidInstallments}
                onCheckedChange={handlePaymentTypeChange}
              />
              <Label>{t('professorDashboard.educationPlans.paymentInstallment', isRtl ? 'اقساطی' : 'Installments')}</Label>
            </div>
            {hasPaidInstallments ? (
              <p className="text-xs text-muted-foreground">
                {t(
                  'professorDashboard.educationPlans.paidInstallmentLockHint',
                  isRtl
                    ? 'به‌دلیل پرداخت یک یا چند قسط، تغییر نوع پرداخت به نقدی امکان‌پذیر نیست.'
                    : 'Payment type cannot be switched to cash because installments are already paid.'
                )}
              </p>
            ) : null}
            {paymentType === 'installment' ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {t(
                    'professorDashboard.educationPlans.installmentPersonalizeHint',
                    isRtl
                      ? 'برای هر قسط می‌توانید تاریخ سررسید و مبلغ را جداگانه مشخص کنید.'
                      : 'You can set a custom due date and amount for each installment.'
                  )}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('professorDashboard.educationPlans.installmentCount', isRtl ? 'تعداد اقساط' : 'Installments')}</Label>
                    <Select
                      value={String(installmentCount)}
                      onValueChange={handleInstallmentCountChange}
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
                    <Label>
                      {t(
                        'professorDashboard.educationPlans.installmentSumLabel',
                        isRtl ? 'جمع اقساط / مبلغ نهایی' : 'Sum / Final'
                      )}
                    </Label>
                    <div
                      className={cn(
                        'flex h-10 items-center rounded-md border px-3 text-sm font-medium',
                        installmentSumMismatch ? 'border-destructive text-destructive' : 'bg-muted'
                      )}
                    >
                      {installmentSum.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
                      {' / '}
                      {finalInstallmentTotal.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}{' '}
                      {t('professorDashboard.educationPlans.currency', isRtl ? 'تومان' : 'Toman')}
                    </div>
                  </div>
                </div>
                {installmentRows.map((row, index) => (
                  <div key={row.installmentNumber} className="space-y-3 rounded-md border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {t('professorDashboard.educationPlans.installmentLabel', isRtl ? 'قسط' : 'Installment')} #
                      {row.installmentNumber}
                      {row.isPaid ? (
                        <Badge variant="secondary">
                          {t('professorDashboard.educationPlans.installmentPaid', isRtl ? 'پرداخت‌شده' : 'Paid')}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          {t(
                            'professorDashboard.educationPlans.installmentDueDate',
                            isRtl ? 'تاریخ سررسید' : 'Due date'
                          )}
                        </Label>
                        <FlatpickrDateTimePicker
                          mode="date"
                          value={row.dueDate}
                          onChange={(date) => {
                            if (!date || row.isPaid) return;
                            updateInstallmentRow(index, { dueDate: date });
                          }}
                          locale={locale === 'fa' ? 'fa' : 'en'}
                          isRtl={isRtl}
                          disabled={row.isPaid}
                          placeholder={t(
                            'professorDashboard.educationPlans.installmentDueDatePlaceholder',
                            isRtl ? 'انتخاب تاریخ سررسید' : 'Select due date'
                          )}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          {t(
                            'professorDashboard.educationPlans.installmentAmount',
                            isRtl ? 'مبلغ قسط (تومان)' : 'Amount (Toman)'
                          )}
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={row.amountToman || ''}
                          disabled={row.isPaid}
                          onChange={(e) => {
                            if (row.isPaid) return;
                            const amountToman = Number(e.target.value);
                            updateInstallmentRow(index, {
                              amountToman: Number.isFinite(amountToman) ? amountToman : 0,
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>{t('professorDashboard.educationPlans.description', isRtl ? 'توضیحات' : 'Description')}</Label>
            <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('professorDashboard.educationPlans.cancel', isRtl ? 'انصراف' : 'Cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('professorDashboard.educationPlans.save', isRtl ? 'ذخیره' : 'Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
