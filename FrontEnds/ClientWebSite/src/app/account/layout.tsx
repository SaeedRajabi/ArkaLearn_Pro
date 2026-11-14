'use client';

import { AuthGuard } from '@/contexts/auth-guard';
import { AccountRoleGuard } from '@/components/account/account-role-guard';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AccountRoleGuard>{children}</AccountRoleGuard>
    </AuthGuard>
  );
}
