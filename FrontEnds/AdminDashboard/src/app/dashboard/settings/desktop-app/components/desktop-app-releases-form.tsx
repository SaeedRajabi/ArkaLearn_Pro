'use client';

import * as React from 'react';
import { FileUp, Loader2, Monitor, Plus, Save, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { SettingsFormError, SettingsFormLoading } from '@/components/settings/settings-form-states';
import { resolveStaticAssetUrl } from '@/lib/apiClient';
import {
  getDesktopAppReleases,
  publishDesktopAppRelease,
  unpublishDesktopAppRelease,
  deleteDesktopAppRelease,
  type DesktopAppReleaseRow,
} from '@/services/desktop-app-releases-api.service';
import { uploadMediaAsset } from '@/services/media-api.service';

const EMPTY_FORM = {
  version: '',
  installerUrl: '',
  releaseNotes: '',
  isMandatory: false,
  minSupportedVersion: '',
};

const INSTALLER_ACCEPT = '.msi,.exe,application/x-msdownload,application/octet-stream';

function isInstallerFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.msi') || name.endsWith('.exe');
}

function buildInstallerPreferredName(file: File, version: string): string {
  const ext = file.name.includes('.')
    ? file.name.slice(file.name.lastIndexOf('.'))
    : '.msi';
  const rawBase = file.name.includes('.')
    ? file.name.slice(0, file.name.lastIndexOf('.'))
    : file.name;
  const safeBase = rawBase
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+|\.+$/g, '')
    .trim();
  const looksLikeGuid = /^[0-9a-f]{32}$/i.test(safeBase);
  if (safeBase && !looksLikeGuid) {
    return `${safeBase}${ext}`;
  }
  const safeVersion = (version.trim() || 'latest').replace(/[<>:"/\\|?*\s]+/g, '-');
  return `ArkaSoftwareDesktop-${safeVersion}${ext}`;
}

export function DesktopAppReleasesForm() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(null);
  const [installerSource, setInstallerSource] = React.useState<'upload' | 'url'>('upload');
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [releases, setReleases] = React.useState<DesktopAppReleaseRow[]>([]);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const loadRequestIdRef = React.useRef(0);

  const load = React.useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    const requestId = ++loadRequestIdRef.current;
    if (!silent) {
      setLoading(true);
      setLoadError(null);
    }
    try {
      const rows = await getDesktopAppReleases();
      if (requestId !== loadRequestIdRef.current) return;
      setReleases(rows);
      if (silent) setLoadError(null);
    } catch (err) {
      if (requestId !== loadRequestIdRef.current) return;
      const message = err instanceof Error ? err.message : t('desktop_release_load_failed');
      if (!silent) {
        setLoadError(message);
        setReleases([]);
      } else {
        throw err;
      }
    } finally {
      if (!silent && requestId === loadRequestIdRef.current) setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setUploadedFileName(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInstallerFileChange = async (file?: File | null) => {
    if (!file) return;
    if (!isInstallerFile(file)) {
      toast({ title: t('desktop_release_installer_file_invalid'), variant: 'destructive' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const preferredFileName = buildInstallerPreferredName(file, form.version);
      const uploaded = await uploadMediaAsset(
        {
          file,
          title: form.version.trim()
            ? `Desktop installer ${form.version.trim()}`
            : file.name,
          description: 'Desktop app installer package',
          preferredFileName,
        },
        (percent) => setUploadProgress(percent)
      );
      const absoluteUrl = resolveStaticAssetUrl(uploaded.fileUrl);
      if (!absoluteUrl) {
        throw new Error(t('desktop_release_upload_failed'));
      }
      setForm((prev) => ({ ...prev, installerUrl: absoluteUrl }));
      setUploadedFileName(preferredFileName);
      toast({ title: t('desktop_release_upload_success') });
    } catch (err) {
      setUploadedFileName(null);
      toast({
        title: t('desktop_release_upload_failed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePublish = async () => {
    if (!form.version.trim() || !form.installerUrl.trim()) {
      toast({ title: t('desktop_release_validation'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await publishDesktopAppRelease({
        version: form.version,
        installerUrl: form.installerUrl.trim(),
        releaseNotes: form.releaseNotes,
        isMandatory: form.isMandatory,
        minSupportedVersion: form.minSupportedVersion || undefined,
      });
      resetForm();
      await load({ silent: true });
      toast({ title: t('desktop_release_publish_success') });
    } catch (err) {
      toast({
        title: t('desktop_release_publish_failed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async (id: number) => {
    const previous = releases;
    setReleases((rows) =>
      rows.map((row) => (row.id === id ? { ...row, isPublished: false } : row))
    );
    setSaving(true);
    try {
      await unpublishDesktopAppRelease(id);
      toast({ title: t('desktop_release_unpublish_success') });
      void load({ silent: true }).catch(() => undefined);
    } catch (err) {
      setReleases(previous);
      toast({
        title: t('desktop_release_unpublish_failed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm(t('desktop_release_delete_confirm'));
    if (!ok) return;

    setSaving(true);
    try {
      await deleteDesktopAppRelease(id);
      setReleases((rows) => rows.filter((row) => row.id !== id));
      toast({ title: t('desktop_release_delete_success') });
      await load({ silent: true });
    } catch (err) {
      toast({
        title: t('desktop_release_delete_failed'),
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
      try {
        await load({ silent: true });
      } catch {
        /* keep current rows */
      }
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try {
      return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <SettingsFormLoading
        title={t('desktop_release_title')}
        description={t('desktop_release_loading')}
      />
    );
  }
  if (loadError) {
    return (
      <SettingsFormError
        title={t('desktop_release_title')}
        message={loadError}
        onRetry={() => void load()}
      />
    );
  }

  const busy = saving || uploading;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Monitor className="h-7 w-7 text-primary" />
          {t('desktop_release_title')}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t('desktop_release_description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5" />
            {t('desktop_release_publish_new')}
          </CardTitle>
          <CardDescription>{t('desktop_release_publish_new_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="desktop-version">{t('desktop_release_version')}</Label>
            <Input
              id="desktop-version"
              placeholder="0.2.0"
              value={form.version}
              onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desktop-min-version">{t('desktop_release_min_supported')}</Label>
            <Input
              id="desktop-min-version"
              placeholder="0.1.0"
              value={form.minSupportedVersion}
              onChange={(e) => setForm((p) => ({ ...p, minSupportedVersion: e.target.value }))}
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label>{t('desktop_release_installer')}</Label>
            <Tabs
              value={installerSource}
              onValueChange={(value) => setInstallerSource(value as 'upload' | 'url')}
            >
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="upload" className="gap-1.5">
                  <Upload className="h-3.5 w-3.5" />
                  {t('desktop_release_installer_upload_tab')}
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-1.5">
                  <FileUp className="h-3.5 w-3.5" />
                  {t('desktop_release_installer_url_tab')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-3 space-y-3">
                <p className="text-xs text-muted-foreground">{t('desktop_release_installer_upload_hint')}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={INSTALLER_ACCEPT}
                    className="hidden"
                    disabled={busy}
                    onChange={(e) => void handleInstallerFileChange(e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    disabled={busy}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploading
                      ? t('desktop_release_uploading')
                      : t('desktop_release_choose_installer')}
                  </Button>
                  {uploadedFileName ? (
                    <span className="truncate text-sm text-muted-foreground" dir="ltr">
                      {uploadedFileName}
                    </span>
                  ) : null}
                </div>
                {uploading ? (
                  <div className="space-y-1.5">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {uploadProgress}%
                    </p>
                  </div>
                ) : null}
                {form.installerUrl && !uploading ? (
                  <p className="truncate text-xs text-muted-foreground" dir="ltr" title={form.installerUrl}>
                    {form.installerUrl}
                  </p>
                ) : null}
              </TabsContent>

              <TabsContent value="url" className="mt-3 space-y-2">
                <Label htmlFor="desktop-installer-url">{t('desktop_release_installer_url')}</Label>
                <Input
                  id="desktop-installer-url"
                  dir="ltr"
                  placeholder="https://cdn.example.com/ArkaLearnDesktop-0.2.0.msi"
                  value={form.installerUrl}
                  disabled={busy}
                  onChange={(e) => {
                    setUploadedFileName(null);
                    setForm((p) => ({ ...p, installerUrl: e.target.value }));
                  }}
                />
                <p className="text-xs text-muted-foreground">{t('desktop_release_installer_url_hint')}</p>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="desktop-release-notes">{t('desktop_release_notes')}</Label>
            <Textarea
              id="desktop-release-notes"
              rows={3}
              value={form.releaseNotes}
              onChange={(e) => setForm((p) => ({ ...p, releaseNotes: e.target.value }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2">
            <div>
              <Label className="text-sm font-medium">{t('desktop_release_mandatory')}</Label>
              <p className="text-xs text-muted-foreground">{t('desktop_release_mandatory_desc')}</p>
            </div>
            <Switch
                dir={locale === "fa" ? "ltr" : "rtl"}
              checked={form.isMandatory}
              onCheckedChange={(checked) => setForm((p) => ({ ...p, isMandatory: checked }))}
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={() => void handlePublish()} disabled={busy} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t('desktop_release_publish_button')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('desktop_release_history')}</CardTitle>
          <CardDescription>{t('desktop_release_history_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {releases.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('desktop_release_empty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('desktop_release_version')}</TableHead>
                  <TableHead>{t('desktop_release_status')}</TableHead>
                  <TableHead>{t('desktop_release_published_at')}</TableHead>
                  <TableHead className="text-center">{t('desktop_release_actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {releases.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-wrap items-center gap-3">
                        <span dir="ltr">{row.version}</span>
                        {row.isMandatory ? (
                          <Badge variant="destructive">{t('desktop_release_mandatory_badge')}</Badge>
                        ) : null}

                        <a
                            href={row.installerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block truncate text-xs text-primary hover:underline"
                            dir="ltr"
                        >
                          {t("desktop_release_history_release_link")}
                        </a>
                      </div>

                    </TableCell>
                    <TableCell>
                      {row.isPublished ? (
                        <Badge>{t('desktop_release_published')}</Badge>
                      ) : (
                        <Badge variant="secondary">{t('desktop_release_unpublished')}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(row.publishedAtUtc)}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-2">
                        {row.isPublished ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={busy}
                            onClick={() => void handleUnpublish(row.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t('desktop_release_unpublish_button')}
                          </Button>
                        ) : null}

                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          disabled={busy}
                          onClick={() => void handleDelete(row.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t('desktop_release_delete_button')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
