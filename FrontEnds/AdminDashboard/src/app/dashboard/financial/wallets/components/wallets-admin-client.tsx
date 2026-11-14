'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  adminAdjustWallet,
  fetchAdminUserWallets,
  fetchPlatformWallet,
  type AdminUserWallet,
} from '@/services/wallet-admin-api.service';

export function WalletsAdminClient() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const isFa = locale === 'fa';
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<AdminUserWallet[]>([]);
  const [platform, setPlatform] = React.useState<Record<string, number>>({});
  const [search, setSearch] = React.useState('');
  const [adjustUserId, setAdjustUserId] = React.useState('');
  const [adjustAmount, setAdjustAmount] = React.useState('');
  const [adjustNote, setAdjustNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [list, plat] = await Promise.all([
        fetchAdminUserWallets(search || undefined, 100),
        fetchPlatformWallet(),
      ]);
      setRows(list);
      setPlatform(plat);
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const fmt = (n: number) => new Intl.NumberFormat(isFa ? 'fa-IR' : 'en-US').format(n);

  const handleAdjust = async () => {
    const userId = Number(adjustUserId);
    const amount = Number(adjustAmount);
    if (!userId || !amount) return;
    setSaving(true);
    try {
      await adminAdjustWallet(userId, amount, adjustNote.trim() || undefined);
      toast({ title: isFa ? 'ذخیره شد' : 'Saved' });
      setAdjustAmount('');
      setAdjustNote('');
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: isFa ? 'خطا' : 'Error',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">{t('loading')}</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isFa ? 'کیف پول پلتفرم' : 'Platform wallet'}</CardTitle>
          <CardDescription>{isFa ? 'خلاصه کیف پول اصلی سایت' : 'Main site wallet summary'}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <p>{isFa ? 'موجودی:' : 'Available:'} <strong>{fmt(platform.availableBalanceToman ?? 0)}</strong></p>
          <p>{isFa ? 'واریز کل:' : 'Total deposited:'} <strong>{fmt(platform.totalDepositedToman ?? 0)}</strong></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isFa ? 'تنظیم دستی موجودی' : 'Manual balance adjustment'}</CardTitle>
        </CardHeader>
        <CardContent className="grid max-w-xl gap-3">
          <div className="space-y-1">
            <Label>{isFa ? 'شناسه کاربر' : 'User ID'}</Label>
            <Input dir="ltr" value={adjustUserId} onChange={(e) => setAdjustUserId(e.target.value.replace(/\D/g, ''))} />
          </div>
          <div className="space-y-1">
            <Label>{isFa ? 'مبلغ (تومان، منفی برای کسر)' : 'Amount (Toman, negative to debit)'}</Label>
            <Input dir="ltr" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value.replace(/[^\d-]/g, ''))} />
          </div>
          <div className="space-y-1">
            <Label>{isFa ? 'یادداشت' : 'Note'}</Label>
            <Input value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} />
          </div>
          <Button onClick={() => void handleAdjust()} disabled={saving}>{isFa ? 'اعمال' : 'Apply'}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{isFa ? 'کیف پول کاربران' : 'User wallets'}</CardTitle>
          <Input
            className="max-w-xs"
            placeholder={isFa ? 'جستجو با شناسه کاربر' : 'Search by user ID'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">{isFa ? 'نام' : 'Name'}</th>
                <th className="py-2 pr-4">{isFa ? 'موجودی' : 'Balance'}</th>
                <th className="py-2 pr-4">Zibal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.userId} className="border-b">
                  <td className="py-2 pr-4 font-mono">{r.userId}</td>
                  <td className="py-2 pr-4">{r.fullName || r.userName}</td>
                  <td className="py-2 pr-4 font-mono">{fmt(r.availableBalanceToman)}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{r.zibalSubMerchantId ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
