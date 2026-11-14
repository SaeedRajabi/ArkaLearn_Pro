'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();

  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <p className="text-muted-foreground">{t('loading_permissions') ?? 'در حال بارگذاری...'}</p>
      </div>
    );
  }

  const userRole = user?.role ?? null;
  const hasPermission = userRole != null && allowedRoles.includes(userRole);

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center w-full min-h-[200px] p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
              <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="mt-4">{t('permission_denied_title') ?? 'دسترسی غیرمجاز'}</CardTitle>
            <CardDescription>{t('permission_denied_description') ?? 'شما به این بخش دسترسی ندارید.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('permission_denied_user_role') ?? 'نقش شما'}: <span className="font-semibold text-foreground">{userRole ?? (t('role_guest') ?? 'مهمان')}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('permission_denied_required_role') ?? 'نقش مورد نیاز'}: <span className="font-semibold text-foreground">{allowedRoles.join(', ')}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
