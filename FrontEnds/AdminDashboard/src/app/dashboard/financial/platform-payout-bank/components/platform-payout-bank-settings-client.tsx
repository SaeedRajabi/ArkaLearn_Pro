'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  fetchPlatformPayoutBankSettings,
  savePlatformPayoutBankSettings,
} from '@/services/platform-payout-bank-api.service';

export function PlatformPayoutBankSettingsClient() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [sheba, setSheba] = React.useState('');
  const [cardNumber, setCardNumber] = React.useState('');
  const [zarinPalBankAccountId, setZarinPalBankAccountId] = React.useState('');

  React.useEffect(() => {
    void fetchPlatformPayoutBankSettings()
      .then((row) => {
        setSheba(row.platformPayoutSheba ?? '');
        setCardNumber(row.platformPayoutCardNumber ?? '');
        setZarinPalBankAccountId(row.zarinPalPlatformBankAccountId ?? '');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePlatformPayoutBankSettings({
        platformPayoutSheba: sheba.trim(),
        platformPayoutCardNumber: cardNumber.trim(),
        zarinPalPlatformBankAccountId: zarinPalBankAccountId.trim() || undefined,
      });
      toast({ title: t('platform_payout_bank_saved') });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: err instanceof Error ? err.message : t('platform_payout_bank_save_failed'),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">{t('loading')}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('platform_payout_bank_title')}</CardTitle>
        <CardDescription>{t('platform_payout_bank_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-xl gap-4">
        <div className="space-y-1">
          <Label>{t('platform_payout_bank_sheba')}</Label>
          <Input dir="ltr" className="font-mono" value={sheba} onChange={(e) => setSheba(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t('platform_payout_bank_card')}</Label>
          <Input
            dir="ltr"
            className="font-mono"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
          />
        </div>
        <div className="space-y-1">
          <Label>{t('platform_payout_bank_zarinpal_id')}</Label>
          <Input
            dir="ltr"
            value={zarinPalBankAccountId}
            onChange={(e) => setZarinPalBankAccountId(e.target.value)}
            placeholder={t('platform_payout_bank_zarinpal_id_hint')}
          />
        </div>
        <Button onClick={() => void handleSave()} disabled={saving}>
          {t('platform_payout_bank_save')}
        </Button>
      </CardContent>
    </Card>
  );
}
