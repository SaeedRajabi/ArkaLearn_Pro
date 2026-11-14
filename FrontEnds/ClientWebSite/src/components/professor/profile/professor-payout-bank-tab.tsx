'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getDictValue } from '@/lib/i18n-client';
import {
  fetchTeacherPayoutBankInfo,
  updateTeacherPayoutBankInfo,
} from '@/lib/api/teacher-finance';
import type { Dictionary } from '@/types';

function t(dict: Dictionary, key: string, fb: string) {
  return getDictValue(dict, key, fb);
}

export function ProfessorPayoutBankTab({ dict }: { dict: Dictionary }) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [sheba, setSheba] = React.useState('');
  const [cardNumber, setCardNumber] = React.useState('');

  React.useEffect(() => {
    void fetchTeacherPayoutBankInfo()
      .then((info) => {
        setSheba(info.payoutSheba ?? '');
        setCardNumber(info.payoutCardNumber ?? '');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateTeacherPayoutBankInfo({ payoutSheba: sheba.trim(), payoutCardNumber: cardNumber.trim() });
      toast({ title: t(dict, 'professorDashboard.payoutBank.saved', 'Bank info saved') });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t(dict, 'professorDashboard.payoutBank.saveFailed', 'Could not save bank info'),
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(dict, 'professorDashboard.payoutBank.title', 'Payout bank account')}</CardTitle>
        <CardDescription>
          {t(
            dict,
            'professorDashboard.payoutBank.desc',
            'Sheba (IBAN) and card number are required before you can withdraw your earnings.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="mx-auto max-w-lg space-y-4" onSubmit={(e) => void handleSave(e)}>
          <div className="space-y-1">
            <Label htmlFor="payout-sheba">{t(dict, 'professorDashboard.payoutBank.sheba', 'Sheba (IBAN)')}</Label>
            <Input
              id="payout-sheba"
              dir="ltr"
              className="font-mono"
              placeholder="IR120170000000123456789012"
              value={sheba}
              onChange={(e) => setSheba(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="payout-card">{t(dict, 'professorDashboard.payoutBank.card', 'Card number')}</Label>
            <Input
              id="payout-card"
              dir="ltr"
              className="font-mono"
              placeholder="6037991234567890"
              inputMode="numeric"
              maxLength={19}
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            {t(dict, 'professorDashboard.payoutBank.save', 'Save bank info')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ProfessorPayoutBankAlert({ dict }: { dict: Dictionary }) {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
      <p className="font-medium">
        {t(dict, 'professorDashboard.payoutBank.requiredTitle', 'Bank info required for payout')}
      </p>
      <p className="mt-1 text-muted-foreground">
        {t(
          dict,
          'professorDashboard.payoutBank.requiredDesc',
          'Enter your Sheba and card number in your profile before requesting a withdrawal.'
        )}{' '}
        <Link href="/professor/profile" className="font-medium text-primary underline-offset-4 hover:underline">
          {t(dict, 'professorDashboard.payoutBank.goToProfile', 'Go to profile')}
        </Link>
      </p>
    </div>
  );
}
