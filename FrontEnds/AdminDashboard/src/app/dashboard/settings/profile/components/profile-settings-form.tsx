

'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, PlusCircle, Trash2, UploadCloud } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { Skill } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/components/auth-provider';
import * as authApi from '@/lib/auth/api';
import * as teacherApi from '@/services/teacher-service';

function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function getInitials(name?: string | null): string {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return 'U';
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read selected file.'));
    reader.readAsDataURL(file);
  });
}

function GeneralSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user, authUser, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  const [fullName, setFullName] = React.useState(user?.name ?? '');
  const [bio, setBio] = React.useState('');
  const [imagePreview, setImagePreview] = React.useState<string | null>(user?.avatarUrl ?? null);

  React.useEffect(() => {
    setFullName(user?.name ?? '');
    setImagePreview(user?.avatarUrl ?? null);
  }, [user?.name, user?.avatarUrl]);

  React.useEffect(() => {
    let cancelled = false;
    async function loadTeacherBio() {
      if (!authUser?.userName) {
        setIsLoadingProfile(false);
        return;
      }
      setIsLoadingProfile(true);
      try {
        const profile = await teacherApi.getTeacherProfile({ userName: authUser.userName, forEdit: true });
        if (!cancelled) setBio(profile?.longDescription ?? '');
      } catch (error) {
        console.error('Failed to load teacher profile.', error);
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    }
    void loadTeacherBio();
    return () => {
      cancelled = true;
    };
  }, [authUser?.userName]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedName = fullName.trim().replace(/\s+/g, ' ');
    if (!user?.id || normalizedName.split(' ').length < 2) {
      toast({
        title: t('toast_error_title'),
        description: t('profile_settings_name_validation'),
        variant: 'destructive',
      });
      return;
    }

    const { firstName, lastName } = splitFullName(normalizedName);

    setIsSaving(true);
    try {
      await authApi.updateCurrentUserFullName({
        userId: user.id,
        firstName,
        lastName,
      });
      const profile = authUser?.userName
        ? await teacherApi.getTeacherProfile({ userName: authUser.userName })
        : null;
      await teacherApi.updateTeacherProfile({
        userId: Number(user.id),
        longDescription: bio.trim(),
        educations: (profile?.educations ?? []).map((e) => ({
          universityName: e.universityName,
          degreeType: e.degreeType,
          degreeImage: e.degreeImage,
        })),
        skills: (profile?.skills ?? []).map((s) => ({
          name: s.name,
          rate: s.rate,
        })),
      });
      await refreshUser();
      toast({
        title: t('toast_settings_saved_title'),
        description: t('profile_settings_name_saved_desc'),
      });
    } catch (error) {
      console.error('Failed to update current user full name.', error);
      toast({
        title: t('toast_error_title'),
        description: t('toast_error_description'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previousImagePreview = imagePreview;
    e.target.value = '';

    setIsUploadingAvatar(true);
    try {
      const localPreview = await readFileAsDataUrl(file);
      setImagePreview(localPreview);

      const uploadedImageUrl = await authApi.uploadCurrentUserProfileImage(file);
      await refreshUser();
      setImagePreview(uploadedImageUrl ?? localPreview);
      toast({
        title: t('toast_settings_saved_title'),
        description: t('profile_settings_avatar_saved_desc'),
      });
    } catch (error) {
      console.error('Failed to upload current user profile image.', error);
      setImagePreview(previousImagePreview);
      toast({
        title: t('toast_error_title'),
        description: t('toast_error_description'),
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{t('profile_settings_general_title')}</CardTitle>
          <CardDescription>
            {t('profile_settings_general_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="full-name">{t('addUser_name_label')}</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('addUser_name_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('profile_settings_email_label')}</Label>
            <Input
              id="email"
              type="email"
              value={user?.email ?? ''}
              placeholder={t('profile_settings_email_placeholder')}
              readOnly
              className="bg-muted/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">{t('profile_settings_bio_label')}</Label>
            <Textarea
              id="bio"
              placeholder={t('profile_settings_bio_placeholder')}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={isLoadingProfile}
              rows={5}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('profile_settings_avatar_label')}</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border bg-muted">
                {imagePreview ? (
                  <AvatarImage src={imagePreview} alt={user?.name ?? 'User avatar'} />
                ) : null}
                <AvatarFallback>{user?.initials || getInitials(fullName)}</AvatarFallback>
              </Avatar>
              <Input
                id="avatar-upload"
                type="file"
                className="max-w-xs"
                onChange={handleImageChange}
                accept="image/*"
                disabled={isUploadingAvatar}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('profile_settings_avatar_description')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('profile_settings_avatar_upload_note')}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('profile_settings_general_sync_note')}
          </p>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving || isUploadingAvatar || isLoadingProfile}>
            {(isSaving || isUploadingAvatar) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('save_changes')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

type EducationFormRow = {
  id: string;
  universityName: string;
  degreeType: string;
  degreeImage: string;
};

function AcademicSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user, authUser } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(true);
  const [educations, setEducations] = React.useState<EducationFormRow[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!authUser?.userName) {
        setIsFetching(false);
        return;
      }
      setIsFetching(true);
      try {
        const profile = await teacherApi.getTeacherProfile({ userName: authUser.userName, forEdit: true });
        if (!cancelled) {
          setEducations(
            (profile?.educations ?? []).map((e, index) => ({
              id: String(e.id || index + 1),
              universityName: e.universityName,
              degreeType: e.degreeType || 'bachelors',
              degreeImage: e.degreeImage ?? '',
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load teacher educations.', error);
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [authUser?.userName]);

  const addEducation = () => {
    setEducations((rows) => [
      ...rows,
      { id: Date.now().toString(), universityName: '', degreeType: 'bachelors', degreeImage: '' },
    ]);
  };

  const removeEducation = (id: string) => {
    setEducations((rows) => rows.filter((row) => row.id !== id));
  };

  const updateEducation = (id: string, patch: Partial<EducationFormRow>) => {
    setEducations((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const handleImageChange = async (id: string, file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateEducation(id, { degreeImage: dataUrl });
    } catch {
      toast({
        title: t('toast_error_title'),
        description: t('toast_error_description'),
        variant: 'destructive',
      });
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id || !authUser?.userName) return;

    setIsLoading(true);
    try {
      const profile = await teacherApi.getTeacherProfile({ userName: authUser.userName });
      await teacherApi.updateTeacherProfile({
        userId: Number(user.id),
        longDescription: profile?.longDescription ?? '',
        educations: educations
          .filter((row) => row.universityName.trim())
          .map((row) => ({
            universityName: row.universityName.trim(),
            degreeType: row.degreeType,
            degreeImage: row.degreeImage,
          })),
        skills: (profile?.skills ?? []).map((s) => ({ name: s.name, rate: s.rate })),
      });
      toast({
        title: t('toast_settings_saved_title'),
        description: t('toast_academic_settings_saved_desc'),
      });
    } catch (error) {
      console.error('Failed to save teacher educations.', error);
      toast({
        title: t('toast_error_title'),
        description: t('toast_error_description'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSave}>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{t('profile_settings_academic_title')}</CardTitle>
              <CardDescription>
                {t('profile_settings_academic_description')}
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addEducation}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('add_skill')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isFetching ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loading')}
            </div>
          ) : educations.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('profile_settings_academic_description')}</p>
          ) : (
            educations.map((row) => (
              <div key={row.id} className="space-y-4 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{t('profile_settings_university_name_label')}</h4>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeEducation(row.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`university-${row.id}`}>
                      {t('profile_settings_university_name_label')}
                    </Label>
                    <Input
                      id={`university-${row.id}`}
                      placeholder={t('profile_settings_university_name_placeholder')}
                      value={row.universityName}
                      onChange={(e) => updateEducation(row.id, { universityName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`degree-${row.id}`}>
                      {t('profile_settings_degree_type_label')}
                    </Label>
                    <Select
                      value={row.degreeType}
                      onValueChange={(value) => updateEducation(row.id, { degreeType: value })}
                    >
                      <SelectTrigger id={`degree-${row.id}`}>
                        <SelectValue placeholder={t('profile_settings_degree_type_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bachelors">{t('degree_bachelors')}</SelectItem>
                        <SelectItem value="masters">{t('degree_masters')}</SelectItem>
                        <SelectItem value="phd">{t('degree_phd')}</SelectItem>
                        <SelectItem value="certificate">{t('degree_certificate')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor={`degree-upload-${row.id}`} className="font-medium">
                    {t('profile_settings_degree_image_label')}
                  </Label>
                  <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-8">
                    <div className="text-center">
                      {row.degreeImage ? (
                        <Image
                          src={row.degreeImage}
                          alt="Degree Preview"
                          width={128}
                          height={128}
                          className="mx-auto h-32 w-32 rounded-md object-contain"
                        />
                      ) : (
                        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                      )}
                      <div className="mt-4">
                        <Input
                          id={`degree-upload-${row.id}`}
                          type="file"
                          className="max-w-xs mx-auto"
                          accept="image/*"
                          onChange={(e) => void handleImageChange(row.id, e.target.files?.[0])}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading || isFetching}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('save_changes')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function SkillsSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user, authUser } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(true);
  const [skills, setSkills] = React.useState<Skill[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!authUser?.userName) {
        setIsFetching(false);
        return;
      }
      setIsFetching(true);
      try {
        const profile = await teacherApi.getTeacherProfile({ userName: authUser.userName, forEdit: true });
        if (!cancelled) {
          setSkills(
            (profile?.skills ?? []).map((s, index) => ({
              id: String(s.id || index + 1),
              name: s.name,
              rate: s.rate,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load teacher skills.', error);
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [authUser?.userName]);

  const addSkill = () => {
    setSkills([...skills, { id: Date.now().toString(), name: '', rate: 50 }]);
  };

  const removeSkill = (id: string) => {
    setSkills(skills.filter((skill) => skill.id !== id));
  };

  const handleSkillChange = (id: string, field: 'name' | 'rate', value: string | number) => {
    setSkills(
      skills.map((skill) =>
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    );
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id || !authUser?.userName) return;

    setIsLoading(true);
    try {
      const profile = await teacherApi.getTeacherProfile({ userName: authUser.userName });
      await teacherApi.updateTeacherProfile({
        userId: Number(user.id),
        longDescription: profile?.longDescription ?? '',
        educations: (profile?.educations ?? []).map((e) => ({
          universityName: e.universityName,
          degreeType: e.degreeType,
          degreeImage: e.degreeImage,
        })),
        skills: skills
          .filter((skill) => skill.name.trim())
          .map((skill) => ({ name: skill.name.trim(), rate: skill.rate })),
      });
      toast({
        title: t('toast_settings_saved_title'),
        description: t('toast_skills_settings_saved_desc'),
      });
    } catch (error) {
      console.error('Failed to save teacher skills.', error);
      toast({
        title: t('toast_error_title'),
        description: t('toast_error_description'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSave}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('profile_settings_skills_title')}</CardTitle>
              <CardDescription>
                {t('profile_settings_skills_description')}
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addSkill}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('add_skill')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isFetching ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loading')}
            </div>
          ) : skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('no_skills_yet')}</p>
          ) : (
            <div className="space-y-4">
              {skills.map((skill) => (
                <div key={skill.id} className="grid grid-cols-12 items-center gap-4 rounded-md border p-4">
                  <div className="col-span-12 sm:col-span-4">
                    <Label htmlFor={`skill-name-${skill.id}`}>{t('skill_name_label')}</Label>
                    <Input
                      id={`skill-name-${skill.id}`}
                      placeholder={t('skill_name_placeholder')}
                      value={skill.name}
                      onChange={(e) => handleSkillChange(skill.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-6">
                    <Label htmlFor={`skill-rate-${skill.id}`}>
                      {t('skill_rate_label')} ({skill.rate}%)
                    </Label>
                    <Slider
                      id={`skill-rate-${skill.id}`}
                      min={0}
                      max={100}
                      step={5}
                      value={[skill.rate]}
                      onValueChange={(value) =>
                        handleSkillChange(skill.id, 'rate', value[0])
                      }
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeSkill(skill.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t('remove_skill')}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading || isFetching}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('save_changes')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function SecuritySettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { authUser, refreshUser } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(Boolean(authUser?.twoFactorEnabled));
  const [savingTwoFactor, setSavingTwoFactor] = React.useState(false);
  const [savingPassword, setSavingPassword] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  React.useEffect(() => {
    setTwoFactorEnabled(Boolean(authUser?.twoFactorEnabled));
  }, [authUser?.twoFactorEnabled]);

  const hasVerifiedPhone = Boolean(authUser?.phoneNumber && authUser?.phoneNumberVerified);
  const hasEmail = Boolean(authUser?.email?.trim());
  const canEnableTwoFactor = hasVerifiedPhone || hasEmail;

  const channelHint = hasVerifiedPhone
    ? t('two_factor_auth_channel_sms')
    : hasEmail
      ? t('two_factor_auth_channel_email')
      : t('two_factor_auth_channel_missing');

  const handleTwoFactorChange = async (checked: boolean) => {
    if (checked && !canEnableTwoFactor) {
      toast({
        variant: 'destructive',
        title: t('two_factor_auth_unavailable_title'),
        description: t('two_factor_auth_unavailable_description'),
      });
      return;
    }

    const previous = twoFactorEnabled;
    setTwoFactorEnabled(checked);
    setSavingTwoFactor(true);
    try {
      await authApi.setTwoFactorEnabled(checked);
      await refreshUser();
      toast({
        title: t('toast_settings_saved_title'),
        description: checked ? t('two_factor_auth_enabled') : t('two_factor_auth_disabled'),
      });
    } catch (error) {
      setTwoFactorEnabled(previous);
      toast({
        variant: 'destructive',
        title: t('two_factor_auth_save_failed'),
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSavingTwoFactor(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast({
        variant: 'destructive',
        title: t('password_change_required_title'),
        description: t('password_change_required_description'),
      });
      return;
    }

    if (newPassword.trim().length < 6) {
      toast({
        variant: 'destructive',
        title: t('password_change_too_short_title'),
        description: t('password_change_too_short_description'),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: t('password_change_mismatch_title'),
        description: t('password_change_mismatch_description'),
      });
      return;
    }

    if (currentPassword === newPassword) {
      toast({
        variant: 'destructive',
        title: t('password_change_same_title'),
        description: t('password_change_same_description'),
      });
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: t('password_change_success_title'),
        description: t('password_change_success_description'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const isWrongCurrent =
        /current password is incorrect/i.test(message) ||
        /رمز عبور فعلی/i.test(message);
      toast({
        variant: 'destructive',
        title: t('password_change_failed_title'),
        description: isWrongCurrent
          ? t('password_change_wrong_current')
          : message || t('password_change_failed_description'),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Card>
      <form onSubmit={(e) => void handleSave(e)}>
        <CardHeader>
          <CardTitle>{t('profile_settings_security_title')}</CardTitle>
          <CardDescription>{t('profile_settings_security_description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="current-password">{t('profile_settings_current_password_label')}</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={savingPassword}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('profile_settings_new_password_label')}</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={savingPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t('profile_settings_confirm_password_label')}</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={savingPassword}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="min-w-0 space-y-1">
              <h4 className="font-medium">{t('two_factor_auth_title')}</h4>
              <p className="text-sm text-muted-foreground">{t('two_factor_auth_description')}</p>
              <p className="text-xs text-muted-foreground">{channelHint}</p>
              {authUser?.phoneNumber ? (
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {t('two_factor_auth_phone_label')}: {authUser.phoneNumber}
                  {authUser.phoneNumberVerified
                    ? ` (${t('two_factor_auth_verified')})`
                    : ` (${t('two_factor_auth_unverified')})`}
                </p>
              ) : null}
              {authUser?.email ? (
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {t('two_factor_auth_email_label')}: {authUser.email}
                </p>
              ) : null}
            </div>
            <Switch
              checked={twoFactorEnabled}
              disabled={savingTwoFactor || savingPassword || (!canEnableTwoFactor && !twoFactorEnabled)}
              onCheckedChange={(v) => void handleTwoFactorChange(v)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={savingPassword || savingTwoFactor}>
            {savingPassword ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            {savingPassword ? t('password_change_saving') : t('save_changes')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function ProfileSettingsForm() {
  const { t , direction } = useLanguage();

  return (
    <Tabs defaultValue="general" className="w-full" dir={direction}>
      <TabsList className="grid w-full grid-cols-4" >
        <TabsTrigger value="general">{t('settings_tab_general')}</TabsTrigger>
        <TabsTrigger value="academic">{t('settings_tab_academic')}</TabsTrigger>
        <TabsTrigger value="skills">{t('settings_tab_skills')}</TabsTrigger>
        <TabsTrigger value="security">{t('settings_tab_security')}</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <GeneralSettings />
      </TabsContent>
      <TabsContent value="academic">
        <AcademicSettings />
      </TabsContent>
      <TabsContent value="skills">
        <SkillsSettings />
      </TabsContent>
      <TabsContent value="security">
        <SecuritySettings />
      </TabsContent>
    </Tabs>
  );
}
