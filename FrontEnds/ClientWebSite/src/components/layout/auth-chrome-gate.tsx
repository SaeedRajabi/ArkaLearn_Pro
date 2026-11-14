'use client';

import { usePathname } from 'next/navigation';
import { isAuthPath } from '@/lib/auth/auth-paths';

/** Hides header / chrome on auth routes; updates on client navigation without full reload. */
export function AuthChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isAuthPath(pathname)) return null;
  return children;
}
