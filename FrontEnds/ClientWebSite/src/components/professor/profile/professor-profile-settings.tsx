'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ExternalLink, Loader2, Plus, Trash2, UploadCloud } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getDictValue } from '@/lib/i18n-client';
import { updateUserFullName, uploadProfileImage } from '@/lib/api/account';
import {
  DEFAULT_CERTIFICATE_IMAGE_PATH,
  getDegreeImageUrl,
  getUserImageUrl,
  resolveUserProfileImageUrl,
} from '@/lib/utils/image-url';
import type { Dictionary } from '@/types';
import getInitials from '@/components/shared/avatar-initializer';
import {
  ProfessorProfileEditorProvider,
  useProfessorProfileEditor,
  type SavedEducation,
  type SavedSkill,
} from './use-professor-profile-editor';
import './professor-profile-settings.css';
import { ProfessorPayoutBankTab } from './professor-payout-bank-tab';
import { EmailVerifyForm, EmailStatusBadge } from '@/components/account/dashboard/email-verify-form';
import { EmailChangeForm } from '@/components/account/dashboard/email-change-form';
import { PhoneChangeForm } from '@/components/account/dashboard/phone-change-form';
import { PhoneVerifyForm } from '@/components/account/dashboard/phone-verify-form';
import { cn } from '@/lib/utils';

function t(dict: Dictionary, key: string, fallback: string) {
  return getDictValue(dict, key, fallback);
}

function getDegreeLabel(dict: Dictionary, degreeType: string) {
  const normalized = (degreeType || 'bachelors').toLowerCase();
  if (normalized === 'masters' || normalized === 'master') {
    return t(dict, 'professorDashboard.profileSettings.degreeMasters', "Master's");
  }
  if (normalized === 'phd' || normalized === 'ph_d') {
    return t(dict, 'professorDashboard.profileSettings.degreePhd', 'PhD');
  }
  if (normalized === 'certificate' || normalized === 'work') {
    return t(dict, 'professorDashboard.profileSettings.degreeCertificate', 'Certificate');
  }
  return t(dict, 'professorDashboard.profileSettings.degreeBachelors', "Bachelor's");
}

function GeneralProfileTab({ dict }: { dict: Dictionary }) {
  const { toast } = useToast();
  const { user, profile, loading, saving, persistProfile, refetchAuth } = useProfessorProfileEditor();
  const [fullName, setFullName] = React.useState('');
  const [shortDescription, setShortDescription] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);

  React.useEffect(() => {
    setFullName(user?.fullName ?? profile?.displayName ?? '');
    setShortDescription(profile?.shortDescription ?? '');
    setBio(profile?.longDescription ?? '');
  }, [user?.fullName, profile?.displayName, profile?.shortDescription, profile?.longDescription]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id) return;
    try {
      await updateUserFullName({ userId: user.id, fullName: fullName.trim() });
      await persistProfile({
        shortDescription: shortDescription.trim(),
        longDescription: bio.trim(),
      });
      toast({
        title: t(dict, 'professorDashboard.profileSettings.savedTitle', 'Saved'),
        description: t(
          dict,
          'professorDashboard.profile.submittedForReview',
          'Profile saved and submitted for admin review.'
        ),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t(dict, 'professorDashboard.profile.saveError', 'Could not save profile.'),
      });
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    setUploadingAvatar(true);
    try {
      await uploadProfileImage(file);
      await refetchAuth();
      toast({
        title: t(dict, 'professorDashboard.profileSettings.savedTitle', 'Saved'),
        description: t(dict, 'professorDashboard.profileSettings.avatarSaved', 'Profile photo updated.'),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t(dict, 'professorDashboard.profile.saveError', 'Could not save profile.'),
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = fullName || user?.userName || 'U';

  return (
    <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t(dict, 'professorDashboard.profileSettings.generalTitle', 'General information')}</h3>
        <p className="text-sm text-muted-foreground">
          {t(dict, 'professorDashboard.profileSettings.generalDescription', 'Update your name, email, and other personal information.')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prof-full-name">{t(dict, 'professorDashboard.profile.fullName', 'Full name')}</Label>
        <Input id="prof-full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="prof-phone">{t(dict, 'professorDashboard.profileSettings.phone', 'Phone number')}</Label>
          <EmailStatusBadge verified={Boolean(user?.phoneNumberVerified)} />
        </div>
        <Input
          id="prof-phone"
          value={user?.phoneNumber ?? ''}
          readOnly
          disabled
          dir="ltr"
          className={cn(
            'bg-muted/50',
            user?.phoneNumberVerified ? 'border-green-500/40' : 'border-destructive/40'
          )}
          placeholder={t(dict, 'professorDashboard.profileSettings.phoneEmpty', 'No phone number yet')}
        />
      </div>

      <PhoneVerifyForm dict={dict} user={user} />
      <PhoneChangeForm dict={dict} />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="prof-email">{t(dict, 'professorDashboard.profileSettings.email', 'Email')}</Label>
          <EmailStatusBadge verified={Boolean(user?.emailVerified)} />
        </div>
        <Input
          id="prof-email"
          value={user?.email ?? ''}
          readOnly
          disabled
          className={cn(
            'bg-muted/50',
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
            ? t(dict, 'dashboard.email.verifiedHint', 'Your email is verified.')
            : t(
                dict,
                'dashboard.email.unverifiedHint',
                'Your email is not verified. Verify it below to unlock comments, Q&A, and content creation.'
              )}
        </p>
      </div>

      <EmailVerifyForm dict={dict} user={user} />
      <EmailChangeForm dict={dict} user={user} />

      <div className="space-y-2">
        <Label htmlFor="prof-short-description">
          {t(dict, 'professorDashboard.profile.shortDescription', 'Short headline')}
        </Label>
        <Input
          id="prof-short-description"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          maxLength={500}
          placeholder={t(
            dict,
            'professorDashboard.profileSettings.shortDescriptionPlaceholder',
            'e.g. React instructor with 10 years of experience'
          )}
        />
        <p className="text-xs text-muted-foreground">
          {t(
            dict,
            'professorDashboard.profileSettings.shortDescriptionHint',
            'Shown on the public teachers list. Keep it to one or two sentences.'
          )}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prof-bio">{t(dict, 'professorDashboard.profileSettings.biography', 'Biography')}</Label>
        <Textarea id="prof-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={5} />
      </div>

      <div className="space-y-3">
        <Label>{t(dict, 'professorDashboard.profile.avatar', 'Profile photo')}</Label>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-20 w-20 border">
            <AvatarImage src={resolveUserProfileImageUrl(user?.profileImage)} alt={displayName} />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div>
            <Input
              id="prof-avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={uploadingAvatar}
              onChange={(e) => void handleAvatarChange(e)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t(dict, 'professorDashboard.profileSettings.avatarHint', 'PNG, JPG or WebP up to 5 MB.')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || uploadingAvatar}>
          {(saving || uploadingAvatar) && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t(dict, 'professorDashboard.profileSettings.saveChanges', 'Save changes')}
        </Button>
      </div>
    </form>
  );
}

function AcademicProfileTab({ dict }: { dict: Dictionary }) {
  const { toast } = useToast();
  const { loading, saving, persistProfile, mapEducations, profile } = useProfessorProfileEditor();
  const [savedRows, setSavedRows] = React.useState<SavedEducation[]>([]);
  const [universityName, setUniversityName] = React.useState('');
  const [degreeType, setDegreeType] = React.useState('bachelors');
  const [degreeFile, setDegreeFile] = React.useState<File | null>(null);
  const [degreePreview, setDegreePreview] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setSavedRows(mapEducations(profile?.educations));
  }, [mapEducations, profile?.educations]);

  const resetForm = () => {
    setUniversityName('');
    setDegreeType('bachelors');
    setDegreeFile(null);
    setDegreePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: t(dict, 'professorDashboard.profileSettings.fileTooLarge', 'File must not exceed 2 MB.'),
      });
      event.target.value = '';
      return;
    }
    setDegreeFile(file);
    setDegreePreview(URL.createObjectURL(file));
  };

  const handleAddDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedUniversity = universityName.trim();
    if (!trimmedUniversity) {
      toast({
        variant: 'destructive',
        title: t(dict, 'professorDashboard.profileSettings.universityRequired', 'University name is required.'),
      });
      return;
    }

    const isDuplicate = savedRows.some(
      (row) =>
        row.universityName.trim().toLowerCase() === trimmedUniversity.toLowerCase() &&
        row.degreeType === degreeType
    );
    if (isDuplicate) {
      toast({
        variant: 'destructive',
        title: t(dict, 'professorDashboard.profileSettings.educationDuplicate', 'This degree is already listed.'),
      });
      return;
    }

    try {
      let degreeImage = DEFAULT_CERTIFICATE_IMAGE_PATH;
      if (degreeFile) {
        degreeImage = await uploadProfileImage(degreeFile, { returnRelativePath: true });
      }

      const nextRows: SavedEducation[] = [
        ...savedRows,
        {
          id: `${Date.now()}`,
          universityName: trimmedUniversity,
          degreeType,
          degreeImage,
        },
      ];

      await persistProfile({
        educations: nextRows.map(({ universityName: uni, degreeType: deg, degreeImage: img }) => ({
          universityName: uni,
          degreeType: deg,
          degreeImage: img,
        })),
      });

      setSavedRows(nextRows);
      resetForm();
      toast({
        title: t(dict, 'professorDashboard.profileSettings.savedTitle', 'Saved'),
        description: t(
          dict,
          'professorDashboard.profile.submittedForReview',
          'Profile saved and submitted for admin review.'
        ),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t(dict, 'professorDashboard.profile.saveError', 'Could not save profile.'),
      });
    }
  };

  const handleDelete = async (id: string) => {
    const nextRows = savedRows.filter((row) => row.id !== id);
    try {
      await persistProfile({
        educations: nextRows.map(({ universityName: uni, degreeType: deg, degreeImage: img }) => ({
          universityName: uni,
          degreeType: deg,
          degreeImage: img,
        })),
      });
      setSavedRows(nextRows);
      toast({
        title: t(dict, 'professorDashboard.profileSettings.savedTitle', 'Saved'),
        description: t(dict, 'professorDashboard.profileSettings.documentRemoved', 'Document removed.'),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t(dict, 'professorDashboard.profile.saveError', 'Could not save profile.'),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={(e) => void handleAddDocument(e)} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">{t(dict, 'professorDashboard.profileSettings.academicTitle', 'Academic records')}</h3>
          <p className="text-sm text-muted-foreground">
            {t(dict, 'professorDashboard.profileSettings.academicDescription', 'Add your academic achievements and certificates.')}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="prof-university">{t(dict, 'professorDashboard.profileSettings.universityName', 'University name')}</Label>
            <Input
              id="prof-university"
              placeholder={t(dict, 'professorDashboard.profileSettings.universityPlaceholder', 'Example: Sharif University of Technology')}
              value={universityName}
              onChange={(e) => setUniversityName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prof-degree-type">{t(dict, 'professorDashboard.profileSettings.degreeType', 'Degree type')}</Label>
            <Select value={degreeType} onValueChange={setDegreeType}>
              <SelectTrigger id="prof-degree-type">
                <SelectValue placeholder={t(dict, 'professorDashboard.profileSettings.degreePlaceholder', 'Select your degree')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bachelors">{getDegreeLabel(dict, 'bachelors')}</SelectItem>
                <SelectItem value="masters">{getDegreeLabel(dict, 'masters')}</SelectItem>
                <SelectItem value="phd">{getDegreeLabel(dict, 'phd')}</SelectItem>
                <SelectItem value="certificate">{getDegreeLabel(dict, 'certificate')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t(dict, 'professorDashboard.profileSettings.degreeImage', 'Certificate / diploma image')}</Label>
          <p className="text-xs text-muted-foreground">
            {t(dict, 'professorDashboard.profileSettings.degreeImageHint', 'Upload an image of your degree or certificate.')}
          </p>
          <label className="professor-profile-settings__upload-zone" htmlFor="prof-degree-file">
            {degreePreview ? (
              <Image src={degreePreview} alt="" width={120} height={120} className="h-28 w-28 rounded-md object-contain" unoptimized />
            ) : (
              <>
                <UploadCloud className="h-10 w-10 text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium text-primary">
                    {t(dict, 'professorDashboard.profileSettings.uploadFile', 'Upload file')}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}
                    {t(dict, 'professorDashboard.profileSettings.dragDrop', 'or drag and drop')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t(dict, 'professorDashboard.profileSettings.fileFormats', 'PNG, JPG up to 2 MB')}
                </p>
              </>
            )}
          </label>
          <input
            ref={fileInputRef}
            id="prof-degree-file"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t(dict, 'professorDashboard.profileSettings.saveChanges', 'Save changes')}
          </Button>
        </div>
      </form>

      {savedRows.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-medium">{t(dict, 'professorDashboard.profileSettings.savedDocuments', 'Saved documents')}</h4>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t(dict, 'professorDashboard.profileSettings.universityName', 'University name')}</TableHead>
                  <TableHead>{t(dict, 'professorDashboard.profileSettings.degreeType', 'Degree type')}</TableHead>
                  <TableHead>{t(dict, 'professorDashboard.profileSettings.certificate', 'Certificate')}</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.universityName}</TableCell>
                    <TableCell>{getDegreeLabel(dict, row.degreeType)}</TableCell>
                    <TableCell>
                      <Image
                        src={getDegreeImageUrl(row.degreeImage)}
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded object-cover"
                        unoptimized
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        disabled={saving}
                        onClick={() => void handleDelete(row.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SkillsProfileTab({ dict }: { dict: Dictionary }) {
  const { toast } = useToast();
  const { loading, saving, persistProfile, mapSkills, profile } = useProfessorProfileEditor();
  const [skills, setSkills] = React.useState<SavedSkill[]>([]);

  React.useEffect(() => {
    setSkills(mapSkills(profile?.skills));
  }, [mapSkills, profile?.skills]);

  const addSkill = () => {
    setSkills((rows) => [...rows, { id: `${Date.now()}`, name: '', rate: 50 }]);
  };

  const updateSkill = (id: string, patch: Partial<SavedSkill>) => {
    setSkills((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeSkill = (id: string) => {
    setSkills((rows) => rows.filter((row) => row.id !== id));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = skills.filter((s) => s.name.trim());
    try {
      await persistProfile({
        skills: payload.map((s) => ({ name: s.name.trim(), rate: s.rate })),
      });
      toast({
        title: t(dict, 'professorDashboard.profileSettings.savedTitle', 'Saved'),
        description: t(
          dict,
          'professorDashboard.profile.submittedForReview',
          'Profile saved and submitted for admin review.'
        ),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t(dict, 'professorDashboard.profile.saveError', 'Could not save profile.'),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{t(dict, 'professorDashboard.profileSettings.skillsTitle', 'Skills')}</h3>
          <p className="text-sm text-muted-foreground">
            {t(dict, 'professorDashboard.profileSettings.skillsDescription', 'Showcase your skills and proficiency levels.')}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addSkill}>
          <Plus className="me-2 h-4 w-4" />
          {t(dict, 'professorDashboard.profile.addSkill', 'Add skill')}
        </Button>
      </div>

      {skills.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t(dict, 'professorDashboard.profileSettings.noSkills', 'No skills added yet. Click "Add skill" to begin.')}
        </p>
      ) : (
        <div className="space-y-4">
          {skills.map((skill) => (
            <div key={skill.id} className="professor-profile-settings__skill-row">
              <div className="space-y-2">
                <Label htmlFor={`skill-name-${skill.id}`}>{t(dict, 'professorDashboard.profile.skillName', 'Skill name')}</Label>
                <Input
                  id={`skill-name-${skill.id}`}
                  placeholder="React"
                  value={skill.name}
                  onChange={(e) => updateSkill(skill.id, { name: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor={`skill-rate-${skill.id}`}>
                  {t(dict, 'professorDashboard.profileSettings.proficiency', 'Proficiency level')} ({skill.rate}%)
                </Label>
                <Slider
                  id={`skill-rate-${skill.id}`}
                  min={0}
                  max={100}
                  step={5}
                  value={[skill.rate]}
                  onValueChange={(value) => updateSkill(skill.id, { rate: value[0] ?? 0 })}
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="shrink-0 self-end"
                onClick={() => removeSkill(skill.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t(dict, 'professorDashboard.profileSettings.saveChanges', 'Save changes')}
        </Button>
      </div>
    </form>
  );
}

function SecurityProfileTab({ dict }: { dict: Dictionary }) {
  const { toast } = useToast();
  const { user, refetchAuth } = useProfessorProfileEditor();
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(Boolean(user?.twoFactorEnabled));
  const [savingTwoFactor, setSavingTwoFactor] = React.useState(false);

  React.useEffect(() => {
    setTwoFactorEnabled(Boolean(user?.twoFactorEnabled));
  }, [user?.twoFactorEnabled]);

  const handleTwoFactorChange = async (checked: boolean) => {
    if (checked && (!user?.phoneNumber || !user.phoneNumberVerified)) {
      toast({
        variant: 'destructive',
        title: t(
          dict,
          'professorDashboard.profileSettings.twoFactorPhoneRequired',
          'Verify a phone number in General settings before enabling two-factor authentication.'
        ),
      });
      return;
    }

    setSavingTwoFactor(true);
    const previous = twoFactorEnabled;
    setTwoFactorEnabled(checked);
    try {
      const { setTwoFactorEnabled: saveTwoFactor } = await import('@/lib/api/account');
      await saveTwoFactor(checked);
      await refetchAuth();
      toast({
        title: t(dict, 'professorDashboard.profileSettings.savedTitle', 'Saved'),
        description: checked
          ? t(dict, 'professorDashboard.profileSettings.twoFactorOn', 'Two-factor authentication is now enabled.')
          : t(dict, 'professorDashboard.profileSettings.twoFactorOff', 'Two-factor authentication is now disabled.'),
      });
    } catch {
      setTwoFactorEnabled(previous);
      toast({
        variant: 'destructive',
        title: t(dict, 'professorDashboard.profileSettings.twoFactorFailed', 'Could not update two-factor settings.'),
      });
    } finally {
      setSavingTwoFactor(false);
    }
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: t(dict, 'professorDashboard.profileSettings.passwordMismatch', 'New passwords do not match.'),
      });
      return;
    }
    toast({
      title: t(dict, 'professorDashboard.profileSettings.savedTitle', 'Saved'),
      description: t(
        dict,
        'professorDashboard.profileSettings.passwordComingSoon',
        'Password change will be connected soon. Two-factor settings save immediately when you toggle them.'
      ),
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t(dict, 'professorDashboard.profileSettings.securityTitle', 'Password & security')}</h3>
        <p className="text-sm text-muted-foreground">
          {t(dict, 'professorDashboard.profileSettings.securityDescription', 'Manage your password and two-factor authentication.')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prof-current-password">{t(dict, 'professorDashboard.profileSettings.currentPassword', 'Current password')}</Label>
        <Input
          id="prof-current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="prof-new-password">{t(dict, 'professorDashboard.profileSettings.newPassword', 'New password')}</Label>
          <Input
            id="prof-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prof-confirm-password">{t(dict, 'professorDashboard.profileSettings.confirmPassword', 'Confirm new password')}</Label>
          <Input
            id="prof-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
        <div>
          <h4 className="font-medium">{t(dict, 'professorDashboard.profileSettings.twoFactor', 'Two-factor authentication')}</h4>
          <p className="text-sm text-muted-foreground">
            {t(
              dict,
              'professorDashboard.profileSettings.twoFactorHint',
              'When enabled, login requires an SMS code sent to your verified phone number.'
            )}
          </p>
        </div>
        <Switch
          checked={twoFactorEnabled}
          disabled={savingTwoFactor}
          onCheckedChange={(checked) => void handleTwoFactorChange(checked)}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit">{t(dict, 'professorDashboard.profileSettings.saveChanges', 'Save changes')}</Button>
      </div>
    </form>
  );
}

function ProfessorProfileToolbar({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const { user, profile, loading } = useProfessorProfileEditor();
  const status = (profile?.profileApprovalStatus ?? 'draft').toLowerCase();
  const isApproved = status === 'approved' || status === 'published';
  const publicUserName = (profile?.userName || user?.userName || '').trim();
  const canOpenPublic = Boolean(publicUserName) && isApproved;

  const handleViewPublicProfile = () => {
    if (!canOpenPublic) return;
    router.push(`/teachers/${encodeURIComponent(publicUserName)}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t(dict, 'professorDashboard.profileSettings.pageHint', 'Manage your personal information and preferences.')}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={loading || !canOpenPublic}
            onClick={handleViewPublicProfile}
          >
            <ExternalLink className="h-4 w-4" />
            {t(dict, 'professorDashboard.profile.viewPublicProfile', 'View public profile')}
          </Button>
        </div>
      </div>

      {!loading && profile && !isApproved ? (
        status === 'rejected' ? (
          <Alert className="rounded-xl border-destructive/40 bg-destructive/5">
            <AlertDescription>
              {profile.profileRejectionNote?.trim() ||
                t(
                  dict,
                  'professorDashboard.profile.rejectedBanner',
                  'Your profile was rejected. Please update your information and save again for admin review.'
                )}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="rounded-xl border-amber-500/40 bg-amber-500/5">
            <AlertDescription>
              {t(
                dict,
                'professorDashboard.profile.pendingBanner',
                'Your profile changes are waiting for admin approval and are not visible on your public page yet.'
              )}
            </AlertDescription>
          </Alert>
        )
      ) : null}

      {!loading && profile && !isApproved ? (
        <p className="text-xs text-muted-foreground">
          {t(
            dict,
            'professorDashboard.profile.viewPublicProfileHint',
            'Your public profile will be available after admin approval.'
          )}
        </p>
      ) : null}
    </div>
  );
}

export function ProfessorProfileSettings({ dict }: { dict: Dictionary }) {
  const { dir } = useLanguage();

  return (
    <ProfessorProfileEditorProvider>
      <div className="professor-profile-settings space-y-4">
        <ProfessorProfileToolbar dict={dict} />

        <Tabs defaultValue="general" dir={dir} className="w-full">
          <TabsList className="professor-profile-settings__tabs-list">
            <TabsTrigger value="general" className="professor-profile-settings__tab">
              {t(dict, 'professorDashboard.profileSettings.tabGeneral', 'General')}
            </TabsTrigger>
            <TabsTrigger value="academic" className="professor-profile-settings__tab">
              {t(dict, 'professorDashboard.profileSettings.tabAcademic', 'Academic')}
            </TabsTrigger>
            <TabsTrigger value="skills" className="professor-profile-settings__tab">
              {t(dict, 'professorDashboard.profileSettings.tabSkills', 'Skills')}
            </TabsTrigger>
            <TabsTrigger value="security" className="professor-profile-settings__tab">
              {t(dict, 'professorDashboard.profileSettings.tabSecurity', 'Security')}
            </TabsTrigger>
            <TabsTrigger value="payout-bank" className="professor-profile-settings__tab">
              {t(dict, 'professorDashboard.payoutBank.tab', 'Payout account')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="professor-profile-settings__panel">
            <GeneralProfileTab dict={dict} />
          </TabsContent>
          <TabsContent value="academic" className="professor-profile-settings__panel">
            <AcademicProfileTab dict={dict} />
          </TabsContent>
          <TabsContent value="skills" className="professor-profile-settings__panel">
            <SkillsProfileTab dict={dict} />
          </TabsContent>
          <TabsContent value="security" className="professor-profile-settings__panel">
            <SecurityProfileTab dict={dict} />
          </TabsContent>
          <TabsContent value="payout-bank" className="professor-profile-settings__panel">
            <ProfessorPayoutBankTab dict={dict} />
          </TabsContent>
        </Tabs>
      </div>
    </ProfessorProfileEditorProvider>
  );
}
