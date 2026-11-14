'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Mail, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import getInitials, { avatarColors } from '@/components/shared/avatar-initializer';
import { resolveUserProfileImageUrl } from '@/lib/utils/image-url';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
interface ProfileCardProps {
  dict: {
    title: string;
    subtitle: string;
    fullName: string;
    email: string;
    username: string;
    role: string;
    mySeminars: string;
    logout: string;
    loginRequired: string;
    loginButton: string;
  };
}

export function ProfileCard({ dict }: ProfileCardProps) {
  const { user, isLoading, logout: authLogout } = useAuth();
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";
  function handleLogout() {
    void authLogout();
  }

  if (isLoading && !user) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>{dict.title}</CardTitle>
          <CardDescription>{dict.loginRequired}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login?returnUrl=/account">{dict.loginButton}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const avatarSrc = resolveUserProfileImageUrl(user.profileImage);
  const displayName = (user.fullName && user.fullName.trim() !== '' && user.fullName !== 'Not Name Not Family') ? user.fullName : (user.userName || user.email || '—');
  const roleLabel = user.role ? String(user.role) : '—';

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-muted">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20">
              <AvatarImage src={avatarSrc} alt={displayName} className="object-cover" />
              <AvatarFallback style={avatarColors(displayName, mode)} className={cn('text-3xl font-bold', 'font-persian')}>
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 text-center sm:text-start">
            <CardTitle className="text-xl">{displayName}</CardTitle>
            <CardDescription>{dict.subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{dict.username}:</span>
            <span>{user.userName ?? '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{dict.email}:</span>
            <span>{user.email ?? '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{dict.role}:</span>
            <span className="capitalize">{roleLabel}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-4">
          <Button variant="outline" asChild className="w-full">
            <Link href="/account/seminars">{dict.mySeminars}</Link>
          </Button>
          <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {dict.logout}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
