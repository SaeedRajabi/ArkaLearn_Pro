'use client';

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
import React from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { CustomRichTextEditor } from '@/components/ui/custom-rich-text-editor';
import { resolveStaticAssetUrl } from '@/lib/apiClient';
import {
  getAboutUsSettings,
  upsertAboutUsSettings,
  type UpsertAboutUsPayload,
  type UpsertAboutUsTeamMemberPayload,
} from '@/services/about-us-api.service';

type TeamMemberFormItem = UpsertAboutUsTeamMemberPayload & {
  clientId: string;
  previewUrl: string;
};

type AboutUsFormState = Omit<UpsertAboutUsPayload, 'teamMembers'> & {
  teamMembers: TeamMemberFormItem[];
};

type AboutUsTextField = Exclude<keyof AboutUsFormState, 'heroImageFile' | 'teamImageFile' | 'teamMembers'>;
type TeamMemberTextField = Exclude<keyof TeamMemberFormItem, 'clientId' | 'previewUrl' | 'imageFile'>;

const createClientId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createEmptyTeamMember = (displayOrder = 0): TeamMemberFormItem => ({
  clientId: createClientId(),
  fullName: '',
  skillTitle: '',
  imageUrl: '',
  imageFile: null,
  githubUrl: '',
  linkedinUrl: '',
  twitterUrl: '',
  instagramUrl: '',
  websiteUrl: '',
  displayOrder,
  previewUrl: '',
});

const createEmptyForm = (): AboutUsFormState => ({
  heroTitle: '',
  heroSubtitle: '',
  heroImageUrl: '',
  heroImageFile: null,
  introTitle: '',
  introContentHtml: '',
  missionTitle: '',
  missionContentHtml: '',
  visionTitle: '',
  visionContentHtml: '',
  valuesTitle: '',
  valuesContentHtml: '',
  teamTitle: '',
  teamContentHtml: '',
  teamImageUrl: '',
  teamImageFile: null,
  ctaTitle: '',
  ctaSubtitle: '',
  ctaButtonText: '',
  ctaButtonUrl: '',
  teamMembers: [],
});

function toSubmitPayload(form: AboutUsFormState): UpsertAboutUsPayload {
  return {
    heroTitle: form.heroTitle,
    heroSubtitle: form.heroSubtitle,
    heroImageUrl: form.heroImageUrl,
    heroImageFile: form.heroImageFile,
    introTitle: form.introTitle,
    introContentHtml: form.introContentHtml,
    missionTitle: form.missionTitle,
    missionContentHtml: form.missionContentHtml,
    visionTitle: form.visionTitle,
    visionContentHtml: form.visionContentHtml,
    valuesTitle: form.valuesTitle,
    valuesContentHtml: form.valuesContentHtml,
    teamTitle: form.teamTitle,
    teamContentHtml: form.teamContentHtml,
    teamImageUrl: form.teamImageUrl,
    teamImageFile: form.teamImageFile,
    ctaTitle: form.ctaTitle,
    ctaSubtitle: form.ctaSubtitle,
    ctaButtonText: form.ctaButtonText,
    ctaButtonUrl: form.ctaButtonUrl,
    teamMembers: form.teamMembers
      .filter(
        (member) => member.fullName.trim().length > 0 || member.skillTitle.trim().length > 0
      )
      .map((member, index) => ({
      fullName: member.fullName.trim(),
      skillTitle: member.skillTitle.trim(),
      imageUrl: member.imageUrl,
      imageFile: member.imageFile,
      githubUrl: member.githubUrl,
      linkedinUrl: member.linkedinUrl,
      twitterUrl: member.twitterUrl,
      instagramUrl: member.instagramUrl,
      websiteUrl: member.websiteUrl,
      displayOrder: index,
    })),
  };
}

export function SiteSettingsForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = React.useState<AboutUsFormState>(createEmptyForm);
  const [heroPreview, setHeroPreview] = React.useState<string>('');
  const [teamPreview, setTeamPreview] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const loadAboutUs = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAboutUsSettings();
      if (data) {
        setForm({
          heroTitle: data.heroTitle ?? '',
          heroSubtitle: data.heroSubtitle ?? '',
          heroImageUrl: data.heroImageUrl ?? '',
          heroImageFile: null,
          introTitle: data.introTitle ?? '',
          introContentHtml: data.introContentHtml ?? '',
          missionTitle: data.missionTitle ?? '',
          missionContentHtml: data.missionContentHtml ?? '',
          visionTitle: data.visionTitle ?? '',
          visionContentHtml: data.visionContentHtml ?? '',
          valuesTitle: data.valuesTitle ?? '',
          valuesContentHtml: data.valuesContentHtml ?? '',
          teamTitle: data.teamTitle ?? '',
          teamContentHtml: data.teamContentHtml ?? '',
          teamImageUrl: data.teamImageUrl ?? '',
          teamImageFile: null,
          ctaTitle: data.ctaTitle ?? '',
          ctaSubtitle: data.ctaSubtitle ?? '',
          ctaButtonText: data.ctaButtonText ?? '',
          ctaButtonUrl: data.ctaButtonUrl ?? '',
          teamMembers: (data.teamMembers ?? []).map((member, index) => ({
            clientId: createClientId(),
            fullName: member.fullName ?? '',
            skillTitle: member.skillTitle ?? '',
            imageUrl: member.imageUrl ?? '',
            imageFile: null,
            githubUrl: member.githubUrl ?? '',
            linkedinUrl: member.linkedinUrl ?? '',
            twitterUrl: member.twitterUrl ?? '',
            instagramUrl: member.instagramUrl ?? '',
            websiteUrl: member.websiteUrl ?? '',
            displayOrder: member.displayOrder ?? index,
            previewUrl: resolveStaticAssetUrl(member.imageUrl),
          })),
        });
        setHeroPreview(resolveStaticAssetUrl(data.heroImageUrl));
        setTeamPreview(resolveStaticAssetUrl(data.teamImageUrl));
      } else {
        setForm(createEmptyForm());
        setHeroPreview('');
        setTeamPreview('');
      }
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('about_us_load_failed'),
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  React.useEffect(() => {
    loadAboutUs();
  }, [loadAboutUs]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertAboutUsSettings(toSubmitPayload(form));
      toast({
        title: t('toast_settings_saved_title'),
        description: t('about_us_save_success'),
      });
      await loadAboutUs();
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('about_us_save_failed'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (field: 'heroImage' | 'teamImage') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    if (field === 'heroImage') {
      setForm((prev) => ({ ...prev, heroImageFile: file }));
      setHeroPreview(objectUrl);
      return;
    }
    setForm((prev) => ({ ...prev, teamImageFile: file }));
    setTeamPreview(objectUrl);
  };

  const handleInput =
    (field: AboutUsTextField) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const updateTeamMember = (clientId: string, updater: (member: TeamMemberFormItem) => TeamMemberFormItem) => {
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member) => (
        member.clientId === clientId ? updater(member) : member
      )),
    }));
  };

  const handleTeamMemberInput =
    (clientId: string, field: TeamMemberTextField) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      updateTeamMember(clientId, (member) => ({ ...member, [field]: value }));
    };

  const handleTeamMemberImageChange =
    (clientId: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const objectUrl = URL.createObjectURL(file);
      updateTeamMember(clientId, (member) => ({
        ...member,
        imageFile: file,
        previewUrl: objectUrl,
      }));
    };

  const handleAddTeamMember = () => {
    setForm((prev) => ({
      ...prev,
      teamMembers: [...prev.teamMembers, createEmptyTeamMember(prev.teamMembers.length)],
    }));
  };

  const handleRemoveTeamMember = (clientId: string) => {
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers
        .filter((member) => member.clientId !== clientId)
        .map((member, index) => ({ ...member, displayOrder: index })),
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('about-us-page-settings')}</CardTitle>
        <CardDescription>
          {t('about_us_page_settings_description')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="hero-title">{t('about_us_hero_title_label')}</Label>
            <Input
              id="hero-title"
              value={form.heroTitle}
              onChange={handleInput('heroTitle')}
              placeholder={t('about_us_hero_title_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-subtitle">{t('about_us_hero_subtitle_label')}</Label>
            <Textarea
              id="hero-subtitle"
              value={form.heroSubtitle}
              onChange={handleInput('heroSubtitle')}
              placeholder={t('about_us_hero_subtitle_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('about_us_hero_image_label')}</Label>
            <div className="flex items-center gap-4">
              {heroPreview && (
                <Image
                  src={heroPreview}
                  alt={t('about_us_hero_image_alt')}
                  width={180}
                  height={110}
                  unoptimized
                  className="rounded-md border bg-muted object-cover"
                />
              )}
              <Input id="hero-upload" type="file" className="max-w-xs" accept="image/*" onChange={handleImageChange('heroImage')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="intro-title">{t('about_us_intro_title_label')}</Label>
            <Input
              id="intro-title"
              value={form.introTitle}
              onChange={handleInput('introTitle')}
              placeholder={t('about_us_intro_title_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('about_us_intro_content_label')}</Label>
            <CustomRichTextEditor
              content={form.introContentHtml}
              onChangeAction={(value) => setForm((prev) => ({ ...prev, introContentHtml: value }))}
              placeholder={t('about_us_intro_content_placeholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mission-title">{t('about_us_mission_title_label')}</Label>
            <Input
              id="mission-title"
              value={form.missionTitle}
              onChange={handleInput('missionTitle')}
              placeholder={t('about_us_mission_title_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('about_us_mission_content_label')}</Label>
            <CustomRichTextEditor
              content={form.missionContentHtml}
              onChangeAction={(value) => setForm((prev) => ({ ...prev, missionContentHtml: value }))}
              placeholder={t('about_us_mission_content_placeholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vision-title">{t('about_us_vision_title_label')}</Label>
            <Input
              id="vision-title"
              value={form.visionTitle}
              onChange={handleInput('visionTitle')}
              placeholder={t('about_us_vision_title_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('about_us_vision_content_label')}</Label>
            <CustomRichTextEditor
              content={form.visionContentHtml}
              onChangeAction={(value) => setForm((prev) => ({ ...prev, visionContentHtml: value }))}
              placeholder={t('about_us_vision_content_placeholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="values-title">{t('about_us_values_title_label')}</Label>
            <Input
              id="values-title"
              value={form.valuesTitle}
              onChange={handleInput('valuesTitle')}
              placeholder={t('about_us_values_title_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('about_us_values_content_label')}</Label>
            <CustomRichTextEditor
              content={form.valuesContentHtml}
              onChangeAction={(value) => setForm((prev) => ({ ...prev, valuesContentHtml: value }))}
              placeholder={t('about_us_values_content_placeholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-title">{t('about_us_team_title_label')}</Label>
            <Input
              id="team-title"
              value={form.teamTitle}
              onChange={handleInput('teamTitle')}
              placeholder={t('about_us_team_title_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('about_us_team_content_label')}</Label>
            <CustomRichTextEditor
              content={form.teamContentHtml}
              onChangeAction={(value) => setForm((prev) => ({ ...prev, teamContentHtml: value }))}
              placeholder={t('about_us_team_content_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('about_us_team_image_label')}</Label>
            <div className="flex items-center gap-4">
              {teamPreview && (
                <Image
                  src={teamPreview}
                  alt={t('about_us_team_image_alt')}
                  width={180}
                  height={110}
                  unoptimized
                  className="rounded-md border bg-muted object-cover"
                />
              )}
              <Input id="team-upload" type="file" className="max-w-xs" accept="image/*" onChange={handleImageChange('teamImage')} />
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold">{t('about_us_team_members_title')}</h3>
                <p className="text-sm text-muted-foreground">{t('about_us_team_members_description')}</p>
              </div>
              <Button type="button" variant="outline" onClick={handleAddTeamMember}>
                <Plus className="mr-2 h-4 w-4" />
                {t('about_us_team_members_add_button')}
              </Button>
            </div>

            {form.teamMembers.length === 0 && (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                {t('about_us_team_members_empty')}
              </div>
            )}

            <div className="space-y-4">
              {form.teamMembers.map((member, index) => (
                <Card key={member.clientId}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base">
                        {t('about_us_team_member_card_title', { index: index + 1 })}
                      </CardTitle>
                      <CardDescription>{t('about_us_team_member_card_description')}</CardDescription>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveTeamMember(member.clientId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t('about_us_team_member_name_label')}</Label>
                        <Input
                          value={member.fullName}
                          onChange={handleTeamMemberInput(member.clientId, 'fullName')}
                          placeholder={t('about_us_team_member_name_placeholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('about_us_team_member_skill_label')}</Label>
                        <Input
                          value={member.skillTitle}
                          onChange={handleTeamMemberInput(member.clientId, 'skillTitle')}
                          placeholder={t('about_us_team_member_skill_placeholder')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('about_us_team_member_image_label')}</Label>
                      <div className="flex items-center gap-4">
                        {member.previewUrl && (
                          <Image
                            src={member.previewUrl}
                            alt={t('about_us_team_member_image_alt')}
                            width={96}
                            height={96}
                            unoptimized
                            className="h-24 w-24 rounded-md border bg-muted object-cover"
                          />
                        )}
                        <Input type="file" className="max-w-xs" accept="image/*" onChange={handleTeamMemberImageChange(member.clientId)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{t('about_us_team_member_github_label')}</Label>
                        <Input
                          value={member.githubUrl}
                          onChange={handleTeamMemberInput(member.clientId, 'githubUrl')}
                          placeholder="https://github.com/username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('about_us_team_member_linkedin_label')}</Label>
                        <Input
                          value={member.linkedinUrl}
                          onChange={handleTeamMemberInput(member.clientId, 'linkedinUrl')}
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('about_us_team_member_twitter_label')}</Label>
                        <Input
                          value={member.twitterUrl}
                          onChange={handleTeamMemberInput(member.clientId, 'twitterUrl')}
                          placeholder="https://x.com/username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('about_us_team_member_instagram_label')}</Label>
                        <Input
                          value={member.instagramUrl}
                          onChange={handleTeamMemberInput(member.clientId, 'instagramUrl')}
                          placeholder="https://instagram.com/username"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('about_us_team_member_website_label')}</Label>
                      <Input
                        value={member.websiteUrl}
                        onChange={handleTeamMemberInput(member.clientId, 'websiteUrl')}
                        placeholder="https://example.com"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cta-title">{t('about_us_cta_title_label')}</Label>
            <Input
              id="cta-title"
              value={form.ctaTitle}
              onChange={handleInput('ctaTitle')}
              placeholder={t('about_us_cta_title_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cta-subtitle">{t('about_us_cta_subtitle_label')}</Label>
            <Textarea
              id="cta-subtitle"
              value={form.ctaSubtitle}
              onChange={handleInput('ctaSubtitle')}
              placeholder={t('about_us_cta_subtitle_placeholder')}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cta-button-text">{t('about_us_cta_button_text_label')}</Label>
              <Input
                id="cta-button-text"
                value={form.ctaButtonText}
                onChange={handleInput('ctaButtonText')}
                placeholder={t('about_us_cta_button_text_placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta-button-url">{t('about_us_cta_button_url_label')}</Label>
              <Input
                id="cta-button-url"
                value={form.ctaButtonUrl}
                onChange={handleInput('ctaButtonUrl')}
                placeholder={t('about_us_cta_button_url_placeholder')}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('save_changes')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
