'use client';

import '@/components/professor/dashboard/professor-dashboard.css';
import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { updateUserFullName, uploadProfileImage } from '@/lib/api/account';
import { getTeacherHeaderImageUrl } from '@/lib/utils/image-url';
import {
  getTeacherProfile,
  getTeachingCategories,
  updateTeacherProfile,
  type TeacherEducationInput,
  type TeacherSkillInput,
} from '@/lib/api/teachers';
import { saveTeacherResume, uploadTeacherResumePdf } from '@/lib/api/professor-resume';
import { Badge } from '@/components/ui/badge';

export function ProfessorProfileForm({ dict }: { dict: Dictionary }) {
  const { user, refetch } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [fullName, setFullName] = React.useState('');
  const [shortDescription, setShortDescription] = React.useState('');
  const [longDescription, setLongDescription] = React.useState('');
  const [headerImageUrl, setHeaderImageUrl] = React.useState('');
  const [teachingCategoryId, setTeachingCategoryId] = React.useState<string>('');
  const [educations, setEducations] = React.useState<TeacherEducationInput[]>([]);
  const [skills, setSkills] = React.useState<TeacherSkillInput[]>([]);
  const [categories, setCategories] = React.useState<Array<{ id: number; name: string }>>([]);
  const [resumeTitle, setResumeTitle] = React.useState('');
  const [resumeDescription, setResumeDescription] = React.useState('');
  const [resumePdfUrl, setResumePdfUrl] = React.useState('');
  const [resumePdfFileName, setResumePdfFileName] = React.useState('');
  const [resumeApprovalStatus, setResumeApprovalStatus] = React.useState<string>('draft');
  const [resumeFile, setResumeFile] = React.useState<File | null>(null);
  const [resumeSaving, setResumeSaving] = React.useState(false);
  const [resumeMessage, setResumeMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user?.userName) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [profile, categoryList] = await Promise.all([
          getTeacherProfile({ userName: user.userName, forEdit: true }),
          getTeachingCategories(),
        ]);
        if (cancelled) return;
        setCategories(categoryList);
        setFullName(user.fullName ?? profile?.displayName ?? '');
        setShortDescription(profile?.shortDescription ?? '');
        setLongDescription(profile?.longDescription ?? '');
        setHeaderImageUrl(profile?.headerImageUrl ?? '');
        setTeachingCategoryId(profile?.teachingCategoryId ? String(profile.teachingCategoryId) : '');
        setEducations(
          (profile?.educations ?? []).map((e) => ({
            universityName: e.universityName,
            degreeType: e.degreeType,
            degreeImage: e.degreeImage,
          }))
        );
        setSkills(
          (profile?.skills ?? []).map((s) => ({
            name: s.name,
            rate: s.rate,
          }))
        );
        setResumeTitle(profile?.resume?.title ?? '');
        setResumeDescription(profile?.resume?.description ?? '');
        setResumePdfUrl(profile?.resume?.pdfFileUrl ?? '');
        setResumePdfFileName(profile?.resume?.pdfFileName ?? '');
        setResumeApprovalStatus(profile?.resume?.approvalStatus ?? 'draft');
        setResumeFile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.userName, user?.fullName]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateUserFullName({ userId: user.id, fullName: fullName.trim() });
      await updateTeacherProfile({
        userId: Number(user.id),
        shortDescription: shortDescription.trim(),
        longDescription: longDescription.trim(),
        headerImageUrl: headerImageUrl.trim() || null,
        teachingCategoryId: teachingCategoryId ? Number(teachingCategoryId) : null,
        educations,
        skills,
      });
      await refetch();
      setMessage(getDictValue(dict, 'professorDashboard.profile.saved', 'Profile saved.'));
    } catch {
      setMessage(getDictValue(dict, 'professorDashboard.profile.saveError', 'Could not save profile.'));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    try {
      await uploadProfileImage(file);
      await refetch();
    } catch {
      setMessage(getDictValue(dict, 'professorDashboard.profile.saveError', 'Could not save profile.'));
    }
  };

  const handleResumeSave = async () => {
    setResumeSaving(true);
    setResumeMessage(null);
    try {
      let pdfUrl = resumePdfUrl.trim();
      let pdfName = resumePdfFileName.trim();
      if (resumeFile) {
        const uploaded = await uploadTeacherResumePdf(resumeFile);
        pdfUrl = uploaded.url;
        pdfName = uploaded.fileName;
        setResumePdfUrl(pdfUrl);
        setResumePdfFileName(pdfName);
        setResumeFile(null);
      }
      if (!resumeTitle.trim() || !pdfUrl) {
        setResumeMessage(getDictValue(dict, 'professorDashboard.profile.resumeRequired', 'Title and PDF are required.'));
        return;
      }
      await saveTeacherResume({
        title: resumeTitle.trim(),
        description: resumeDescription.trim(),
        pdfFileUrl: pdfUrl,
        pdfFileName: pdfName || undefined,
      });
      setResumeApprovalStatus('pending');
      setResumeMessage(getDictValue(dict, 'professorDashboard.profile.resumeSubmitted', 'Resume submitted for admin review.'));
    } catch {
      setResumeMessage(getDictValue(dict, 'professorDashboard.profile.resumeSaveError', 'Could not save resume.'));
    } finally {
      setResumeSaving(false);
    }
  };

  const resumeStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return getDictValue(dict, 'professorDashboard.profile.resumeApproved', 'Approved');
      case 'pending':
        return getDictValue(dict, 'professorDashboard.profile.resumePending', 'Pending review');
      case 'rejected':
        return getDictValue(dict, 'professorDashboard.profile.resumeRejected', 'Rejected');
      default:
        return getDictValue(dict, 'professorDashboard.profile.resumeDraft', 'Draft');
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
    <Card>
      <form onSubmit={(e) => void handleSave(e)}>
        <CardHeader>
          <CardTitle>{getDictValue(dict, 'professorDashboard.profile.title', 'Public profile')}</CardTitle>
          <CardDescription>
            {getDictValue(
              dict,
              'professorDashboard.profile.description',
              'This information appears on your public teacher page after admin approval.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">{getDictValue(dict, 'professorDashboard.profile.fullName', 'Full name')}</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar">{getDictValue(dict, 'professorDashboard.profile.avatar', 'Profile photo')}</Label>
            <Input id="avatar" type="file" accept="image/*" onChange={(e) => void handleAvatarUpload(e)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">{getDictValue(dict, 'professorDashboard.profile.category', 'Teaching category')}</Label>
            <Select value={teachingCategoryId} onValueChange={setTeachingCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder={getDictValue(dict, 'professorDashboard.profile.categoryPlaceholder', 'Select a category')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortDescription">
              {getDictValue(dict, 'professorDashboard.profile.shortDescription', 'Short headline')}
            </Label>
            <Input
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              maxLength={500}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longDescription">
              {getDictValue(dict, 'professorDashboard.profile.longDescription', 'About you')}
            </Label>
            <Textarea
              id="longDescription"
              value={longDescription}
              onChange={(e) => setLongDescription(e.target.value)}
              rows={6}
            />
          </div>
          <div className="space-y-2">
            <Label>
              {getDictValue(dict, 'professorDashboard.profile.headerImage', 'Dashboard cover')}
            </Label>
            <div
              className="professor-dashboard__banner h-32 overflow-hidden rounded-xl border"
              style={
                getTeacherHeaderImageUrl(headerImageUrl)
                  ? { backgroundImage: `url(${getTeacherHeaderImageUrl(headerImageUrl)})` }
                  : undefined
              }
            />
            <p className="text-xs text-muted-foreground">
              {getDictValue(
                dict,
                'professorDashboard.profile.headerImageHint',
                'Use the "Change cover" button on your dashboard to upload, crop, and edit the banner image.'
              )}
            </p>
          </div>
          <div className="space-y-3">
            <Label>{getDictValue(dict, 'professorDashboard.profile.educations', 'Education')}</Label>
            {educations.map((education, index) => (
              <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                <Input
                  placeholder={getDictValue(dict, 'professorDashboard.profile.university', 'University')}
                  value={education.universityName}
                  onChange={(e) => {
                    const next = [...educations];
                    next[index] = { ...next[index], universityName: e.target.value };
                    setEducations(next);
                  }}
                />
                <Input
                  placeholder={getDictValue(dict, 'professorDashboard.profile.degree', 'Degree type')}
                  value={education.degreeType}
                  onChange={(e) => {
                    const next = [...educations];
                    next[index] = { ...next[index], degreeType: e.target.value };
                    setEducations(next);
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setEducations([...educations, { universityName: '', degreeType: 'bachelors' }])}
            >
              {getDictValue(dict, 'professorDashboard.profile.addEducation', 'Add education')}
            </Button>
          </div>
          <div className="space-y-3">
            <Label>{getDictValue(dict, 'professorDashboard.profile.skills', 'Skills')}</Label>
            {skills.map((skill, index) => (
              <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_120px]">
                <Input
                  placeholder={getDictValue(dict, 'professorDashboard.profile.skillName', 'Skill name')}
                  value={skill.name}
                  onChange={(e) => {
                    const next = [...skills];
                    next[index] = { ...next[index], name: e.target.value };
                    setSkills(next);
                  }}
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={skill.rate}
                  onChange={(e) => {
                    const next = [...skills];
                    next[index] = { ...next[index], rate: Number(e.target.value) || 0 };
                    setSkills(next);
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setSkills([...skills, { name: '', rate: 50 }])}
            >
              {getDictValue(dict, 'professorDashboard.profile.addSkill', 'Add skill')}
            </Button>
          </div>

          <div className="space-y-4 rounded-xl border border-dashed p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-base">
                {getDictValue(dict, 'professorDashboard.profile.resume', 'Resume (PDF)')}
              </Label>
              {resumeApprovalStatus !== 'draft' ? (
                <Badge variant={resumeApprovalStatus === 'approved' ? 'default' : 'secondary'}>
                  {resumeStatusLabel(resumeApprovalStatus)}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {getDictValue(
                dict,
                'professorDashboard.profile.resumeHint',
                'Upload your resume as PDF. Changes require admin approval before appearing on your public profile.'
              )}
            </p>
            <div className="space-y-2">
              <Label htmlFor="resumeTitle">
                {getDictValue(dict, 'professorDashboard.profile.resumeTitle', 'Resume title')}
              </Label>
              <Input
                id="resumeTitle"
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                placeholder={getDictValue(dict, 'professorDashboard.profile.resumeTitlePlaceholder', 'e.g. Software instructor CV')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resumeDescription">
                {getDictValue(dict, 'professorDashboard.profile.resumeDescription', 'Resume description')}
              </Label>
              <Textarea
                id="resumeDescription"
                value={resumeDescription}
                onChange={(e) => setResumeDescription(e.target.value)}
                rows={3}
                placeholder={getDictValue(
                  dict,
                  'professorDashboard.profile.resumeDescriptionPlaceholder',
                  'Brief summary shown next to your resume on your profile.'
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resumePdf">
                {getDictValue(dict, 'professorDashboard.profile.resumePdf', 'PDF file')}
              </Label>
              <Input
                id="resumePdf"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              />
              {resumePdfFileName || resumePdfUrl ? (
                <p className="text-xs text-muted-foreground">
                  {getDictValue(dict, 'professorDashboard.profile.resumeCurrentFile', 'Current file')}:{' '}
                  {resumePdfFileName || resumePdfUrl}
                </p>
              ) : null}
            </div>
            {resumeMessage ? <p className="text-sm text-muted-foreground">{resumeMessage}</p> : null}
            <Button type="button" variant="secondary" disabled={resumeSaving} onClick={() => void handleResumeSave()}>
              {resumeSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {getDictValue(dict, 'professorDashboard.profile.resumeSave', 'Submit resume for review')}
            </Button>
          </div>

          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getDictValue(dict, 'professorDashboard.profile.save', 'Save profile')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
