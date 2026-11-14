import * as React from 'react';
import { Suspense } from 'react';
import DashboardLoading from './loading';
import { DashboardClientLayout } from './components/dashboard-client-layout';
import { AuthGuard } from '@/components/auth-guard';
import { AdminUserActivityTracker } from '@/components/admin-user-activity-tracker';
import { GlobalUploadDock } from '@/components/uploads/global-upload-dock';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <Suspense fallback={null}>
        <AdminUserActivityTracker />
      </Suspense>
      <DashboardClientLayout>
        <Suspense fallback={<DashboardLoading />}>{children}</Suspense>
        <GlobalUploadDock />
      </DashboardClientLayout>
    </AuthGuard>
  );
}
