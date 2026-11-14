'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BellPlus, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { followTeacher, unfollowTeacher } from '@/lib/api/teacher-follow';
import { getApiErrorMessage } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { buildLoginHref } from '@/lib/auth/login-links';

type Props = {
  teacherId: number;
  teacherUserId?: number;
  initialIsFollowing?: boolean;
  lang: 'en' | 'fa';
  labels?: {
    follow?: string;
    unfollow?: string;
    following?: string;
  };
  size?: 'sm' | 'default';
  className?: string;
};

export function FollowTeacherButton({
  teacherId,
  teacherUserId,
  initialIsFollowing = false,
  lang,
  labels,
  size = 'default',
  className,
}: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const followLabel = labels?.follow ?? (lang === 'fa' ? 'دنبال کردن' : 'Follow');
  const unfollowLabel = labels?.unfollow ?? (lang === 'fa' ? 'لغو دنبال کردن' : 'Unfollow');
  const followingLabel = labels?.following ?? (lang === 'fa' ? 'دنبال می‌کنید' : 'Following');

  if (!teacherId || teacherId <= 0) return null;
  if (user && teacherUserId && Number(user.id) === teacherUserId) return null;

  const loginHref = buildLoginHref(pathname);

  const handleToggle = async () => {
    if (!user) {
      router.push(loginHref);
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        await unfollowTeacher(teacherId);
        setIsFollowing(false);
      } else {
        await followTeacher(teacherId);
        setIsFollowing(true);
      }
    } catch (err) {
      toast({ variant: 'destructive', description: getApiErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={isFollowing ? 'secondary' : 'default'}
      size={size}
      className={cn('gap-2', className)}
      disabled={loading}
      onClick={handleToggle}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <BellOff className="h-4 w-4" />
      ) : (
        <BellPlus className="h-4 w-4" />
      )}
      {loading ? (lang === 'fa' ? 'لطفاً صبر کنید…' : 'Please wait…') : isFollowing ? followingLabel : followLabel}
    </Button>
  );
}
