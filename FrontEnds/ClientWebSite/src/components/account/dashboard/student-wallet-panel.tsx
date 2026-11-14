'use client';

import * as React from 'react';
import { Wallet, Loader2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import type { Dictionary } from '@/types';
import {
  getMyWallet,
  getMyWalletTransactions,
  requestWalletTopUp,
  type MyWallet,
  type WalletTransaction,
} from '@/lib/api/wallet';
import { ApiError } from '@/lib/api/client';

export function StudentWalletPanel({ dict }: { dict: Dictionary }) {
  const { locale } = useLanguage();
  const isFa = locale === 'fa';
  const { toast } = useToast();
  const [wallet, setWallet] = React.useState<MyWallet | null>(null);
  const [transactions, setTransactions] = React.useState<WalletTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [topUpAmount, setTopUpAmount] = React.useState('');
  const [toppingUp, setToppingUp] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [w, tx] = await Promise.all([getMyWallet(), getMyWalletTransactions(30)]);
      setWallet(w);
      setTransactions(tx);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const formatMoney = (n: number) =>
    new Intl.NumberFormat(isFa ? 'fa-IR' : 'en-US', { maximumFractionDigits: 0 }).format(n);

  const handleTopUp = async () => {
    const amount = Number(topUpAmount.replace(/\D/g, ''));
    if (!amount || amount < 10000) {
      toast({
        variant: 'destructive',
        title: isFa ? 'مبلغ نامعتبر' : 'Invalid amount',
        description: isFa ? 'حداقل ۱۰٬۰۰۰ تومان وارد کنید.' : 'Enter at least 10,000 Toman.',
      });
      return;
    }
    setToppingUp(true);
    try {
      await requestWalletTopUp(amount);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: isFa ? 'خطا' : 'Error',
        description: err instanceof ApiError ? err.message : isFa ? 'شارژ کیف پول ناموفق بود.' : 'Top-up failed.',
      });
      setToppingUp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {isFa ? 'کیف پول' : 'Wallet'}
          </CardTitle>
          <CardDescription>
            {isFa
              ? 'ابتدا کیف پول را شارژ کنید، سپس دوره و سمینار را از موجودی پرداخت کنید.'
              : 'Top up your wallet first, then pay for courses and seminars from your balance.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {wallet?.profileCompletionHint ? (
            <p className="text-sm text-amber-600">{wallet.profileCompletionHint}</p>
          ) : null}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">{isFa ? 'موجودی قابل استفاده' : 'Available balance'}</p>
            <p className="text-3xl font-bold text-primary">{formatMoney(wallet?.availableBalanceToman ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">{isFa ? 'تومان' : 'Toman'}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">{isFa ? 'مبلغ شارژ (تومان)' : 'Top-up amount (Toman)'}</label>
              <Input
                dir="ltr"
                inputMode="numeric"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="100000"
              />
            </div>
            <Button onClick={() => void handleTopUp()} disabled={toppingUp || !wallet?.profileCompleteForWallet}>
              {toppingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              {isFa ? 'شارژ با زیبال' : 'Top up via Zibal'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isFa ? 'تراکنش‌های اخیر' : 'Recent transactions'}</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{isFa ? 'تراکنشی ثبت نشده.' : 'No transactions yet.'}</p>
          ) : (
            <ul className="divide-y">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex justify-between gap-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{tx.description ?? tx.type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAtUtc).toLocaleString(isFa ? 'fa-IR' : 'en-US')}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-mono font-semibold">{formatMoney(tx.amountToman)}</p>
                    <p className="text-xs text-muted-foreground">{formatMoney(tx.balanceAfterToman)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
