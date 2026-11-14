'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { SeminarUser, SeminarPaymentPlan } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/components/language-provider';
import { formatLocalizedCurrency } from '@/lib/utils/localized-ui';

const packagePlans = [
  { id: 'package-15', translationKey: 'manage_plan_package_15_name', price: 10500000, hours: 15 },
  { id: 'package-30', translationKey: 'manage_plan_package_30_name', price: 19000000, hours: 30 },
  { id: 'package-60', translationKey: 'manage_plan_package_60_name', price: 28000000, hours: 60 },
  { id: 'package-120', translationKey: 'manage_plan_package_120_name', price: 43000000, hours: 120 },
];

const BASE_HOURLY_RATE = 1000000;

type ManagePlanDialogProps = {
  isOpen: boolean;
  onOpenChangeAction: (open: boolean) => void;
  student: SeminarUser;
  onSaveAction: (plan: SeminarPaymentPlan) => void;
};

export function ManagePlanDialog({
  isOpen,
  onOpenChangeAction,
  student,
  onSaveAction,
}: ManagePlanDialogProps) {
  const onOpenChange = onOpenChangeAction;
  const onSave = onSaveAction;
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const localizedPackagePlans = useMemo(
    () =>
      packagePlans.map((plan) => ({
        ...plan,
        name: t(plan.translationKey),
      })),
    [t]
  );

  const [activeTab, setActiveTab] = useState<'package' | 'hourly'>(
    student.paymentPlan?.type || 'package'
  );

  const [selectedPlanId, setSelectedPlanId] = useState(
    student.paymentPlan?.planId || 'package-15'
  );
  const [customHours, setCustomHours] = useState(1);

  const [hourlyRate, setHourlyRate] = useState(
    student.paymentPlan?.type === 'hourly'
      ? student.paymentPlan.price / student.paymentPlan.totalHours
      : BASE_HOURLY_RATE
  );
  const [totalHours, setTotalHours] = useState(
    student.paymentPlan?.type === 'hourly' ? student.paymentPlan.totalHours : 1
  );

  const [paymentType, setPaymentType] = useState<'cash' | 'installment'>(
    student.paymentPlan?.paymentType || 'cash'
  );
  const [totalInstallments, setTotalInstallments] = useState(
    student.paymentPlan?.totalInstallments || 1
  );
  const [paymentConfirmed, setPaymentConfirmed] = useState(
    student.paymentPlan?.paymentConfirmed || false
  );

  const currentPlanPrice = useMemo(() => {
    if (activeTab === 'package') {
      if (selectedPlanId === 'personalized') {
        return calculateDiscountedPrice(customHours);
      }
      return localizedPackagePlans.find((p) => p.id === selectedPlanId)?.price || 0;
    }
    return hourlyRate * totalHours;
  }, [activeTab, selectedPlanId, customHours, hourlyRate, totalHours, localizedPackagePlans]);

  useEffect(() => {
    if (isOpen) {
      const plan = student.paymentPlan;
      setActiveTab(plan?.type || 'package');
      setPaymentType(plan?.paymentType || 'cash');
      setTotalInstallments(plan?.totalInstallments || 1);
      setPaymentConfirmed(plan?.paymentConfirmed ?? false);

      if (plan?.type === 'package') {
        setSelectedPlanId(plan.planId);
        if (plan.planId === 'personalized') {
          setCustomHours(plan.totalHours);
        }
      } else if (plan?.type === 'hourly') {
        setHourlyRate(plan.price / plan.totalHours);
        setTotalHours(plan.totalHours);
      } else {
        setSelectedPlanId('package-15');
      }
    }
  }, [isOpen, student.paymentPlan]);

  useEffect(() => {
    if (paymentType === 'cash') {
      setTotalInstallments(1);
    }
  }, [paymentType]);

  const calculateDiscountedPrice = (hours: number): number => {
    if (hours <= 0) return 0;
    if (hours < 15) return hours * BASE_HOURLY_RATE;
    if (hours < 30) return hours * 700000;
    if (hours < 60) return hours * 633333;
    if (hours < 120) return hours * 358333;
    return hours * 358333;
  };

  const selectedPackage = useMemo(() => {
    if (selectedPlanId === 'personalized') {
      const price = calculateDiscountedPrice(customHours);
      return {
        id: 'personalized',
        name: t('manage_plan_personalized_plan_name', { hours: customHours }),
        price,
        hours: customHours,
      };
    }
    return localizedPackagePlans.find((p) => p.id === selectedPlanId);
  }, [selectedPlanId, customHours, localizedPackagePlans, t]);

  const originalPackagePrice = selectedPackage
    ? BASE_HOURLY_RATE * selectedPackage.hours
    : 0;
  const discountAmount = selectedPackage
    ? originalPackagePrice - selectedPackage.price
    : 0;
  const discountPercentage =
    originalPackagePrice > 0
      ? Math.round((discountAmount / originalPackagePrice) * 100)
      : 0;

  const totalHourlyCost = hourlyRate * totalHours;

  const handleSave = () => {
    setIsLoading(true);

    let newPlan: SeminarPaymentPlan;

    if (activeTab === 'package') {
      if (!selectedPackage || selectedPackage.hours <= 0) {
        toast({
          variant: 'destructive',
          title: t('validation_error_title'),
          description: t('manage_plan_invalid_selection'),
        });
        setIsLoading(false);
        return;
      }
      newPlan = {
        type: 'package',
        paymentType,
        planId: selectedPackage.id,
        planName: selectedPackage.name,
        totalHours: selectedPackage.hours,
        price: selectedPackage.price,
        paidInstallments: paymentConfirmed ? 1 : 0,
        totalInstallments,
        paymentConfirmed,
        status: paymentConfirmed ? 'Active' : 'Pending Payment',
        nextPaymentDue: '',
      };
    } else {
      newPlan = {
        type: 'hourly',
        paymentType,
        planId: 'hourly',
        planName: t('manage_plan_hourly_plan_name', { rate: formatCurrency(hourlyRate) }),
        totalHours,
        price: totalHourlyCost,
        paidInstallments: paymentConfirmed ? 1 : 0,
        totalInstallments,
        paymentConfirmed,
        status: paymentConfirmed ? 'Active' : 'Pending Payment',
        nextPaymentDue: '',
      };
    }

    setTimeout(() => {
      onSave(newPlan);
      setIsLoading(false);
      onOpenChange(false);
      toast({
        title: t('manage_plan_updated_title'),
        description: t('manage_plan_updated_description', { name: student.name, planName: newPlan.planName }),
      });
    }, 500);
  };

  const formatCurrency = (amount: number) => {
    return formatLocalizedCurrency(amount, locale, t);
  };

  const perInstallmentAmount =
    totalInstallments > 0 ? currentPlanPrice / totalInstallments : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('manage_plan_title', { name: student.name })}</DialogTitle>
          <DialogDescription>
            {t('manage_plan_description')}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'package' | 'hourly')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="package">{t('manage_plan_package_tab')}</TabsTrigger>
            <TabsTrigger value="hourly">{t('manage_plan_hourly_tab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="package" className="mt-4 space-y-4">
            <RadioGroup
              value={selectedPlanId}
              onValueChange={setSelectedPlanId}
              className="grid grid-cols-2 gap-4"
            >
              {localizedPackagePlans.map((plan) => (
                <Label
                  key={plan.id}
                  htmlFor={plan.id}
                  className={cn(
                    'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer',
                    selectedPlanId === plan.id && 'border-primary'
                  )}
                >
                  <RadioGroupItem
                    value={plan.id}
                    id={plan.id}
                    className="sr-only"
                  />
                  <span className="font-bold text-center text-sm">{plan.name}</span>
                </Label>
              ))}
              <Label
                htmlFor="personalized"
                className={cn(
                  'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer col-span-2',
                  selectedPlanId === 'personalized' && 'border-primary'
                )}
              >
                <RadioGroupItem
                  value="personalized"
                  id="personalized"
                  className="sr-only"
                />
                <span className="font-bold text-center text-sm">
                  {t('manage_plan_personalized_label')}
                </span>
              </Label>
            </RadioGroup>

            {selectedPlanId === 'personalized' && (
              <div className="space-y-2">
                <Label htmlFor="custom-hours">{t('manage_plan_custom_hours_label')}</Label>
                <Input
                  id="custom-hours"
                  type="number"
                  value={customHours}
                  onChange={(e) =>
                    setCustomHours(Math.max(1, Number(e.target.value)))
                  }
                  min={1}
                  placeholder={t('manage_plan_custom_hours_placeholder')}
                />
              </div>
            )}
            {selectedPackage && selectedPackage.hours > 0 && (
              <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{t('manage_plan_original_price')}</span>
                  <del>{formatCurrency(originalPackagePrice)}</del>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-destructive">
                  <span>{t('manage_plan_discount')}</span>
                  <span>
                    -{formatCurrency(discountAmount)} ({discountPercentage}%)
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold text-foreground">
                  <span>{t('manage_plan_final_price')}</span>
                  <span>{formatCurrency(selectedPackage.price)}</span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="hourly" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourly-rate">{t('manage_plan_hourly_rate_label')}</Label>
                <Input
                  id="hourly-rate"
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  placeholder={t('manage_plan_hourly_rate_placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total-hours">{t('manage_plan_total_hours_label')}</Label>
                <Input
                  id="total-hours"
                  type="number"
                  value={totalHours}
                  onChange={(e) => setTotalHours(Number(e.target.value))}
                  min={1}
                />
              </div>
            </div>
            <div className="text-sm text-center font-bold text-lg text-foreground p-3 bg-muted rounded-lg">
              {t('manage_plan_total_cost', { amount: formatCurrency(totalHourlyCost) })}
            </div>
          </TabsContent>
        </Tabs>

        <Card>
          <CardContent className="p-4 space-y-4">
            <h4 className="font-medium text-center text-base">
              {t('manage_plan_payment_details')}
            </h4>
            <div className="flex items-center space-x-2 rounded-lg border p-3 shadow-sm bg-background">
              <Label htmlFor="payment-type">{t('manage_plan_cash')}</Label>
              <Switch
                id="payment-type"
                checked={paymentType === 'installment'}
                onCheckedChange={(checked) =>
                  setPaymentType(checked ? 'installment' : 'cash')
                }
              />
              <Label htmlFor="payment-type">{t('manage_plan_installment')}</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="installments">{t('manage_plan_installment_plan')}</Label>
                <Select
                  value={String(totalInstallments)}
                  onValueChange={(v) => setTotalInstallments(Number(v))}
                  disabled={paymentType === 'cash'}
                >
                  <SelectTrigger id="installments">
                    <SelectValue placeholder={t('manage_plan_select_plan')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('manage_plan_installment_full')}</SelectItem>
                    <SelectItem value="2">{t('manage_plan_installment_months', { months: 2 })}</SelectItem>
                    <SelectItem value="3">{t('manage_plan_installment_months', { months: 3 })}</SelectItem>
                    <SelectItem value="6">{t('manage_plan_installment_months', { months: 6 })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentType === 'installment' && perInstallmentAmount > 0 && (
                <div className="space-y-2">
                  <Label>{t('manage_plan_each_installment')}</Label>
                  <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                    {formatCurrency(perInstallmentAmount)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
              <div className="space-y-0.5">
                <Label htmlFor="payment-confirmed" className="text-base">
                  {t('manage_plan_payment_confirmed')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('manage_plan_payment_confirmed_description')}
                </p>
              </div>
              <Switch
                id="payment-confirmed"
                checked={paymentConfirmed}
                onCheckedChange={setPaymentConfirmed}
              />
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="pt-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('actions_cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? t('manage_plan_saving') : t('manage_plan_save_and_register')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
