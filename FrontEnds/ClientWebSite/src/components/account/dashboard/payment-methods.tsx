 'use client';

import { CreditCard, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { useLanguage } from '@/contexts/language-context';

export function PaymentMethods({ dict }: { dict: Dictionary }) {
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const mockCards = [
    { id: '1', type: 'Visa', last4: '4242', expiry: '08/26', isDefault: true },
    { id: '2', type: 'Mastercard', last4: '5555', expiry: '11/27', isDefault: false },
  ];

  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('dashboard.payment.title', 'Payment Methods')}</CardTitle>
          <CardDescription>{t('dashboard.payment.subtitle', 'Manage your saved payment methods.')}</CardDescription>
        </div>
        <Button>{t('dashboard.payment.addNewCard', 'Add New Card')}</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockCards.map(card => (
            <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-semibold">{card.type} {t('dashboard.payment.endingIn', 'ending in')} {card.last4}</p>
                  <p className="text-sm text-muted-foreground">{t('dashboard.payment.expires', 'Expires')} {card.expiry}</p>
                </div>
                {card.isDefault && <Badge>{t('dashboard.payment.default', 'Default')}</Badge>}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRtl ? "start" : "end"}>
                  <DropdownMenuItem>{t('dashboard.payment.makeDefault', 'Make Default')}</DropdownMenuItem>
                  <DropdownMenuItem>{t('dashboard.payment.edit', 'Edit')}</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">{t('dashboard.payment.delete', 'Delete')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
