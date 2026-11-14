'use client';

import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { StudentWalletPanel } from '@/components/account/dashboard/student-wallet-panel';

type Props = { dict: Dictionary };

export function ProfessorWalletPageClient({ dict }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold font-headline">
          {getDictValue(dict, 'professorDashboard.menu.wallet', 'Wallet')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {getDictValue(
            dict,
            'professorDashboard.wallet.pageDescription',
            'Top up your wallet and pay for platform services from your balance.'
          )}
        </p>
      </div>
      <StudentWalletPanel dict={dict} />
    </div>
  );
}
