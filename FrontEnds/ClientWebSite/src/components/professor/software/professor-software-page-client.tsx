'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Download,
  ExternalLink,
  Heart,
  ImageIcon,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getDictValue } from '@/lib/i18n-client';
import { useLanguage } from '@/contexts/language-context';
import { ProfessorAdRichTextEditor } from '@/components/ui/professor-ad-rich-text-editor';
import {
  deleteTeacherSoftware,
  getMySoftware,
  MAX_INSTALLER_BYTES,
  MAX_SOFTWARE_COVER_BYTES,
  saveTeacherSoftware,
  uploadSoftwareCover,
  uploadSoftwareInstaller,
  type SoftwareApprovalStatus,
  type TeacherSoftware,
} from '@/lib/api/professor-software';
import { getApiErrorMessage } from '@/lib/api/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildCategoryPickerOptions, searchCategoryTree } from '@/lib/api/categories';
import { getBookCoverImageUrl } from '@/lib/utils/image-url';
import type { Dictionary } from '@/types';

type Props = { dict: Dictionary };

function parseTagsInput(raw: string): string[] {
  return raw.split(/[,،]/).map((t) => t.trim()).filter(Boolean);
}

function statusBadgeVariant(status: SoftwareApprovalStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'approved') return 'default';
  if (status === 'pending') return 'secondary';
  if (status === 'rejected') return 'destructive';
  return 'outline';
}

export function ProfessorSoftwarePageClient({ dict }: Props) {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const [items, setItems] = React.useState<TeacherSoftware[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editing, setEditing] = React.useState<TeacherSoftware | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [installerFile, setInstallerFile] = React.useState<File | null>(null);
  const [categories, setCategories] = React.useState<{ id: number | null; name: string; depth: number }[]>([]);

  const t = (key: string, fallback: string) =>
    getDictValue(dict, `professorDashboard.software.${key}`, fallback);

  const [form, setForm] = React.useState({
    title: '',
    shortDescription: '',
    longDescriptionHtml: '',
    coverImageUrl: '',
    installerFileUrl: '',
    installerFileName: '',
    categoryId: '',
    tags: '',
    sortOrder: '0',
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [software, tree] = await Promise.all([getMySoftware(), searchCategoryTree()]);
      setItems(software);
      setCategories(buildCategoryPickerOptions(tree));
    } catch (err) {
      toast({ title: getApiErrorMessage(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setEditing(null);
    setShowForm(false);
    setCoverFile(null);
    setInstallerFile(null);
    setForm({
      title: '',
      shortDescription: '',
      longDescriptionHtml: '',
      coverImageUrl: '',
      installerFileUrl: '',
      installerFileName: '',
      categoryId: '',
      tags: '',
      sortOrder: '0',
    });
  };

  const openEdit = (item: TeacherSoftware) => {
    setEditing(item);
    setShowForm(true);
    setCoverFile(null);
    setInstallerFile(null);
    setForm({
      title: item.title,
      shortDescription: item.shortDescription,
      longDescriptionHtml: item.longDescriptionHtml,
      coverImageUrl: item.coverImageUrl ?? '',
      installerFileUrl: item.installerFileUrl ?? '',
      installerFileName: item.installerFileName ?? '',
      categoryId: item.categoryId ? String(item.categoryId) : '',
      tags: item.tags.join(', '),
      sortOrder: String(item.sortOrder ?? 0),
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: t('titleRequired', 'عنوان الزامی است'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let coverUrl = form.coverImageUrl;
      if (coverFile) {
        if (coverFile.size > MAX_SOFTWARE_COVER_BYTES) throw new Error('Cover must be 5 MB or smaller.');
        coverUrl = await uploadSoftwareCover(coverFile);
      }
      let installerUrl = form.installerFileUrl;
      let installerName = form.installerFileName;
      if (installerFile) {
        if (installerFile.size > MAX_INSTALLER_BYTES) throw new Error('Installer must be 200 MB or smaller.');
        const uploaded = await uploadSoftwareInstaller(installerFile);
        installerUrl = uploaded.url;
        installerName = uploaded.fileName;
      }
      await saveTeacherSoftware({
        softwareId: editing?.id,
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        longDescriptionHtml: form.longDescriptionHtml,
        coverImageUrl: coverUrl,
        installerFileUrl: installerUrl,
        installerFileName: installerName,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        tags: parseTagsInput(form.tags),
        sortOrder: Number(form.sortOrder) || 0,
      });
      toast({ title: t('saved', 'ذخیره شد — در انتظار تأیید ادمین') });
      resetForm();
      await load();
    } catch (err) {
      toast({ title: getApiErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('deleteConfirm', 'این نرم‌افزار حذف شود؟'))) return;
    try {
      await deleteTeacherSoftware(id);
      toast({ title: t('deleted', 'حذف شد') });
      await load();
    } catch (err) {
      toast({ title: getApiErrorMessage(err), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title', 'نرم‌افزارهای من')}</h1>
          <p className="text-muted-foreground">{t('subtitle', 'آپلود و مدیریت نرم‌افزارهای آموزشی')}</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="me-2 h-4 w-4" />
          {t('add', 'افزودن نرم‌افزار')}
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          {t('approvalNote', 'پس از ذخیره، نرم‌افزار برای تأیید ادمین ارسال می‌شود و پس از تأیید در سایت نمایش داده می‌شود.')}
        </AlertDescription>
      </Alert>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? t('edit', 'ویرایش نرم‌افزار') : t('new', 'نرم‌افزار جدید')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('fieldTitle', 'عنوان')}</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t('fieldShort', 'توضیح کوتاه')}</Label>
              <Textarea value={form.shortDescription} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>{t('fieldLong', 'توضیح بلند')}</Label>
              <ProfessorAdRichTextEditor value={form.longDescriptionHtml} onChange={(v) => setForm((f) => ({ ...f, longDescriptionHtml: v }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('fieldCategory', 'دسته‌بندی')}</Label>
                <Select value={form.categoryId || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder={t('noCategory', 'بدون دسته')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('noCategory', 'بدون دسته')}</SelectItem>
                    {categories.map((c) => c.id != null && (
                      <SelectItem key={c.id} value={String(c.id)}>{'\u00A0'.repeat(c.depth * 2)}{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('fieldTags', 'برچسب‌ها')}</Label>
                <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="tag1, tag2" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('fieldCover', 'تصویر کاور')}</Label>
                <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
                {(coverFile || form.coverImageUrl) ? (
                  <div className="relative mt-2 h-32 w-48 overflow-hidden rounded border">
                    <Image src={coverFile ? URL.createObjectURL(coverFile) : getBookCoverImageUrl(form.coverImageUrl)} alt="" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-32 w-48 items-center justify-center rounded border border-dashed text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t('fieldInstaller', 'فایل نصب')}</Label>
                <Input type="file" accept=".zip,.rar,.7z,.exe,.msi,.dmg,.pkg,.deb,.rpm,.apk" onChange={(e) => setInstallerFile(e.target.files?.[0] ?? null)} />
                {(installerFile || form.installerFileName) ? (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {installerFile?.name ?? form.installerFileName}
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {t('save', 'ذخیره')}
            </Button>
            <Button variant="outline" onClick={resetForm}>{t('cancel', 'انصراف')}</Button>
          </CardFooter>
        </Card>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{t('empty', 'هنوز نرم‌افزاری ثبت نکرده‌اید.')}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative h-36 bg-muted">
                <Image src={getBookCoverImageUrl(item.coverImageUrl)} alt={item.title} fill className="object-cover" />
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-lg">{item.title}</CardTitle>
                  <Badge variant={statusBadgeVariant(item.approvalStatus)}>{item.approvalStatus}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="line-clamp-2">{item.shortDescription}</p>
                <div className="flex gap-4">
                  <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" />{item.downloadCount}</span>
                  <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{item.likeCount}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                {item.approvalStatus === 'approved' && item.slug ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/software/${encodeURIComponent(item.slug)}`} target="_blank">
                      <ExternalLink className="me-1 h-3.5 w-3.5" />
                      {t('viewPublic', 'مشاهده')}
                    </Link>
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                  <Pencil className="me-1 h-3.5 w-3.5" />
                  {t('editBtn', 'ویرایش')}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="me-1 h-3.5 w-3.5" />
                  {t('deleteBtn', 'حذف')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
