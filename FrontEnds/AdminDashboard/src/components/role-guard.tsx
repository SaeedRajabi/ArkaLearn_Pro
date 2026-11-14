
'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ShieldAlert } from 'lucide-react';
import { useLanguage } from './language-provider';
import Loading from '@/app/loading';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return <Loading />;
  }

  const hasPermission = user && allowedRoles.includes(user.role);

  if (!hasPermission) {
    return (
        <div className="flex items-center justify-center w-full h-full p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className='mx-auto bg-destructive/10 p-3 rounded-full w-fit'>
                        <ShieldAlert className="h-10 w-10 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">{t('permission_denied_title')}</CardTitle>
                    <CardDescription>{t('permission_denied_description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {t('permission_denied_user_role')}: <span className="font-semibold text-foreground">{user?.role || t('role_guest')}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                         {t('permission_denied_required_role')}: <span className="font-semibold text-foreground">{allowedRoles.join(', ')}</span>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return <>{children}</>;
}
