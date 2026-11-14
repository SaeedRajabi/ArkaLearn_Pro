import type { Metadata } from 'next';
import './../globals.css';

export const metadata: Metadata = {
  title: 'ورود -آموزشگاه آنلاین آرکا نرم افزار',
  description: 'ورود کاربر به آموزشگاه آنلاین آرکا نرم افزار',
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
