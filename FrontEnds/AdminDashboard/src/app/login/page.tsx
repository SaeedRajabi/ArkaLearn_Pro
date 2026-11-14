import { Suspense } from 'react';
import { LoginPage } from '@/components/auth/login-page';

export default function LoginRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
