'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { cn } from '@/lib/utils';
import { EmailStatusBadge } from './email-verify-form';
import { updateUserFullName, uploadProfileImage } from '@/lib/api/account';
import { ApiError } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { saveAuthData, getAuthToken } from '@/lib/auth';
import type { CurrentUser } from '@/lib/api/account';

interface ProfileFormProps {
  dict: Dictionary;
  user: CurrentUser | null;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const body = err.body;
    if (typeof body === 'object' && body !== null && 'message' in body) {
      return String((body as { message?: string }).message);
    }
    return err.message || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function ProfileForm({ dict, user }: ProfileFormProps) {
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const { refetch } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  useEffect(() => {
    setFullName(user?.fullName?.trim() || user?.userName?.trim() || '');
    setEmail(user?.email?.trim() || '');
    setAvatarPreview(user?.profileImage || null);
    setPendingFile(null);
  }, [user?.id, user?.fullName, user?.email, user?.profileImage, user?.userName]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: t('dashboard.profile.saveFailed', 'Could not save profile'),
        description: t('dashboard.profile.invalidImage', 'Please choose an image file (PNG, JPG, GIF).'),
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: t('dashboard.profile.saveFailed', 'Could not save profile'),
        description: t('dashboard.profile.imageTooLarge', 'Image must be 10MB or smaller.'),
      });
      return;
    }

    if (avatarPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setPendingFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        variant: 'destructive',
        title: t('dashboard.profile.saveFailed', 'Could not save profile'),
        description: t('dashboard.profile.notLoggedIn', 'You must be logged in to update your profile.'),
      });
      return;
    }

    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      toast({
        variant: 'destructive',
        title: t('dashboard.profile.saveFailed', 'Could not save profile'),
        description: t('dashboard.profile.nameRequired', 'Full name must be at least 2 characters.'),
      });
      return;
    }

    setSaving(true);
    try {
      let nextProfileImage = user.profileImage;

      if (pendingFile) {
        nextProfileImage = await uploadProfileImage(pendingFile);
      }

      await updateUserFullName({ userId: user.id, fullName: trimmedName });

      const token = getAuthToken() ?? 'session';
      saveAuthData(token, {
        ...user,
        fullName: trimmedName,
        profileImage: nextProfileImage,
      });

      setPendingFile(null);
      await refetch();

      toast({
        title: t('dashboard.profile.saveSuccess', 'Profile updated'),
        description: t('dashboard.profile.saveSuccessDesc', 'Your changes have been saved.'),
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('dashboard.profile.saveFailed', 'Could not save profile'),
        description: getErrorMessage(err, t('dashboard.profile.saveFailedDesc', 'Please try again.')),
      });
    } finally {
      setSaving(false);
    }
  };

  const initials =
    fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ||
    user?.userName?.slice(0, 2).toUpperCase() ||
    'U';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.profile.title', 'Edit Profile')}</CardTitle>
        <CardDescription>
          {t('dashboard.profile.subtitle', 'Update your personal information and profile picture.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <Avatar className="h-24 w-24 border-4 border-primary">
            <AvatarImage
              src={avatarPreview || undefined}
              alt={fullName || 'User'}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="grid gap-2">
            <Label htmlFor="picture">{t('dashboard.profile.profilePicture', 'Profile Picture')}</Label>
            <Input
              id="picture"
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
            >
              <Upload className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
              {t('dashboard.profile.uploadImage', 'Upload Image')}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.profile.imageHint', 'PNG, JPG, GIF up to 10MB.')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                'dashboard.profile.headerImageHint',
                'Profile photo and dashboard cover are separate. Use the "Change cover" button at the top of your dashboard for the banner.'
              )}
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="full-name">{t('dashboard.profile.fullName', 'Full Name')}</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={saving}
              autoComplete="name"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="email">{t('dashboard.profile.email', 'Email Address')}</Label>
              <EmailStatusBadge verified={Boolean(user?.emailVerified)} />
            </div>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              disabled
              className={cn(
                'bg-muted',
                user?.emailVerified ? 'border-green-500/50 text-green-700 dark:text-green-400' : 'border-destructive/50 text-destructive'
              )}
              dir="ltr"
            />
            <p
              className={cn(
                'text-xs',
                user?.emailVerified ? 'text-green-600 dark:text-green-400' : 'text-destructive'
              )}
            >
              {user?.emailVerified
                ? t('dashboard.email.verifiedHint', 'Your email is verified.')
                : t(
                    'dashboard.email.unverifiedHint',
                    'Your email is not verified. Go to the verification section below to verify it and unlock comments, Q&A, and content creation.'
                  )}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button type="button" onClick={() => void handleSave()} disabled={saving || !user?.id}>
          {saving && <Loader2 className={cn('h-4 w-4 animate-spin', isRtl ? 'ml-2' : 'mr-2')} />}
          {saving
            ? t('dashboard.profile.saving', 'Saving...')
            : t('dashboard.profile.saveChanges', 'Save Changes')}
        </Button>
      </CardFooter>
    </Card>
  );
}
