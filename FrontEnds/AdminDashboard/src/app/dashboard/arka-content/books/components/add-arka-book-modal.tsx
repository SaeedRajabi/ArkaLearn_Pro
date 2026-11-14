'use client';

import * as React from 'react';
import { ImageIcon, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { CustomRichTextEditor } from '@/components/ui/custom-rich-text-editor';
import { Progress } from '@/components/ui/progress';
import { MediaPickerDialog } from '@/components/media/MediaPickerDialog';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { flattenCategories, mapRawCategory } from '@/lib/category-utils';
import { resolveStaticAssetUrl, toSameOriginAssetSrc } from '@/lib/apiClient';
import { createUploadProgressToast } from '@/lib/upload-progress-toast';
import { getCategories } from '@/services/category-service';
import {
  saveArkaBook,
  uploadArkaBookCover,
  uploadArkaBookFile,
  type ArkaBookItem,
} from '@/services/arka-content-api.service';

type Props = {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  book: ArkaBookItem | null;
  onSuccessAction: () => void;
  teacherUserId?: string;
};

const EMPTY_FORM = {
  title: '',
  shortDescription: '',
  longDescriptionHtml: '',
  coverImageUrl: '',
  categoryId: '',
  publisher: '',
  publicationYear: '',
  isbn: '',
  tags: '',
  sortOrder: '0',
  pdfFileUrl: '',
  pdfFileName: '',
  epubFileUrl: '',
  epubFileName: '',
  wordFileUrl: '',
  wordFileName: '',
};

export function AddArkaBookModal({ open, onOpenChangeAction, book, onSuccessAction, teacherUserId }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);
  const [uploadingCover, setUploadingCover] = React.useState(false);
  const [uploadingPdf, setUploadingPdf] = React.useState(false);
  const [uploadingEpub, setUploadingEpub] = React.useState(false);
  const [uploadingWord, setUploadingWord] = React.useState(false);
  const [coverProgress, setCoverProgress] = React.useState(0);
  const [pdfProgress, setPdfProgress] = React.useState(0);
  const [epubProgress, setEpubProgress] = React.useState(0);
  const [wordProgress, setWordProgress] = React.useState(0);
  const [coverPickerOpen, setCoverPickerOpen] = React.useState(false);
  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const coverInputRef = React.useRef<HTMLInputElement>(null);
  const pdfInputRef = React.useRef<HTMLInputElement>(null);
  const epubInputRef = React.useRef<HTMLInputElement>(null);
  const wordInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    getCategories('', 1, 500)
      .then((result) => {
        const qr = result.queryResult;
        const values = Array.isArray(qr) ? qr : (qr?.$values ?? []);
        const tree = (values as Record<string, unknown>[]).map((item) => mapRawCategory(item, 0, null));
        const flat = flattenCategories(tree);
        setCategories(
          flat
            .filter((c) => c.categoryId)
            .map((c) => ({ id: c.categoryId, name: c.categoryName }))
        );
      })
      .catch(() => setCategories([]));
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    if (book) {
      setForm({
        title: book.title,
        shortDescription: book.shortDescription,
        longDescriptionHtml: book.longDescriptionHtml ?? '',
        coverImageUrl: book.coverImageUrl ?? '',
        categoryId: book.categoryId ? String(book.categoryId) : '',
        publisher: book.publisher ?? '',
        publicationYear: book.publicationYear ? String(book.publicationYear) : '',
        isbn: book.isbn ?? '',
        tags: book.tags.join(', '),
        sortOrder: String(book.sortOrder ?? 0),
        pdfFileUrl: book.pdfFileUrl ?? '',
        pdfFileName: book.pdfFileName ?? '',
        epubFileUrl: book.epubFileUrl ?? '',
        epubFileName: book.epubFileName ?? '',
        wordFileUrl: book.wordFileUrl ?? '',
        wordFileName: book.wordFileName ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, book]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: t('arka_books_title_required'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await saveArkaBook({
        bookId: book?.id,
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        longDescriptionHtml: form.longDescriptionHtml,
        coverImageUrl: form.coverImageUrl.trim() || undefined,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        publisher: form.publisher.trim() || undefined,
        publicationYear: form.publicationYear ? Number(form.publicationYear) : undefined,
        isbn: form.isbn.trim() || undefined,
        tags: form.tags.split(/[,،]/).map((tag) => tag.trim()).filter(Boolean),
        sortOrder: Number(form.sortOrder) || 0,
        pdfFileUrl: form.pdfFileUrl || undefined,
        pdfFileName: form.pdfFileName || undefined,
        epubFileUrl: form.epubFileUrl || undefined,
        epubFileName: form.epubFileName || undefined,
        wordFileUrl: form.wordFileUrl || undefined,
        wordFileName: form.wordFileName || undefined,
      }, (() => {
        const ownerUserId = teacherUserId ?? (book?.teacherUserId ? String(book.teacherUserId) : undefined);
        const ownerTeacherId = book?.teacherId && book.teacherId > 0 ? book.teacherId : undefined;
        if (!ownerUserId && !ownerTeacherId) return undefined;
        return {
          ...(ownerUserId ? { teacherUserId: ownerUserId } : {}),
          ...(ownerTeacherId ? { teacherId: ownerTeacherId } : {}),
        };
      })());
      toast({ title: t('arka_books_saved') });
      onOpenChangeAction(false);
      onSuccessAction();
    } catch {
      toast({ title: t('arka_books_save_failed'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    setCoverProgress(0);
    const progressToast = createUploadProgressToast(t('arka_content_uploading'), file.name);
    try {
      const url = await uploadArkaBookCover(file, (percent) => {
        setCoverProgress(percent);
        progressToast.update(percent);
      });
      setForm((f) => ({ ...f, coverImageUrl: url }));
      progressToast.dismiss();
      toast({ title: t('arka_content_upload_success') });
    } catch {
      progressToast.dismiss();
      toast({ title: t('arka_content_upload_failed'), variant: 'destructive' });
    } finally {
      setUploadingCover(false);
      setCoverProgress(0);
    }
  };

  const handleFormatUpload = async (
    file: File,
    format: 'pdf' | 'epub' | 'word',
    setUploading: (v: boolean) => void,
    setProgress: (v: number) => void
  ) => {
    setUploading(true);
    setProgress(0);
    const progressToast = createUploadProgressToast(t('arka_content_uploading'), file.name);
    try {
      const { url, fileName } = await uploadArkaBookFile(file, (percent) => {
        setProgress(percent);
        progressToast.update(percent);
      });
      if (format === 'pdf') {
        setForm((f) => ({ ...f, pdfFileUrl: url, pdfFileName: fileName }));
      } else if (format === 'epub') {
        setForm((f) => ({ ...f, epubFileUrl: url, epubFileName: fileName }));
      } else {
        setForm((f) => ({ ...f, wordFileUrl: url, wordFileName: fileName }));
      }
      progressToast.dismiss();
      toast({ title: t('arka_content_upload_success') });
    } catch {
      progressToast.dismiss();
      toast({ title: t('arka_content_upload_failed'), variant: 'destructive' });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const coverPreview = form.coverImageUrl
    ? (toSameOriginAssetSrc(form.coverImageUrl) ?? resolveStaticAssetUrl(form.coverImageUrl))
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChangeAction}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{book ? t('arka_books_modal_edit') : t('arka_books_modal_add')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('arka_books_field_title')}</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t('arka_books_field_short')}</Label>
              <Textarea
                value={form.shortDescription}
                onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('arka_books_field_long')}</Label>
              <CustomRichTextEditor
                content={form.longDescriptionHtml}
                onChangeAction={(v) => setForm((f) => ({ ...f, longDescriptionHtml: v }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('arka_books_field_category')}</Label>
                <Select
                  value={form.categoryId || 'none'}
                  onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('arka_books_field_category_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('arka_books_field_category_none')}</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('arka_books_field_sort')}</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t('arka_books_field_publisher')}</Label>
                <Input
                  value={form.publisher}
                  onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('arka_books_field_year')}</Label>
                <Input
                  type="number"
                  value={form.publicationYear}
                  onChange={(e) => setForm((f) => ({ ...f, publicationYear: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('arka_books_field_isbn')}</Label>
                <Input value={form.isbn} onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('arka_books_field_tags')}</Label>
              <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t('arka_books_field_cover')}</Label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="gap-2" onClick={() => setCoverPickerOpen(true)}>
                  <ImageIcon className="h-4 w-4" />
                  {t('arka_content_pick_media')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={uploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                >
                  {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploadingCover
                    ? `${t('arka_content_uploading')} ${coverProgress}%`
                    : t('arka_content_upload_file')}
                </Button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleCoverUpload(file);
                    e.target.value = '';
                  }}
                />
              </div>
              {uploadingCover ? <Progress value={coverProgress} className="h-2" /> : null}
              {coverPreview ? (
                <div className="mt-2 h-24 w-40 overflow-hidden rounded border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPreview} alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}
            </div>
            <div className="space-y-3 rounded-lg border p-3">
              <Label>{t('arka_books_field_files')}</Label>
              {(['pdf', 'epub', 'word'] as const).map((format) => {
                const urlKey = `${format}FileUrl` as const;
                const nameKey = `${format}FileName` as const;
                const uploading = format === 'pdf' ? uploadingPdf : format === 'epub' ? uploadingEpub : uploadingWord;
                const progress = format === 'pdf' ? pdfProgress : format === 'epub' ? epubProgress : wordProgress;
                const inputRef = format === 'pdf' ? pdfInputRef : format === 'epub' ? epubInputRef : wordInputRef;
                const setUploading =
                  format === 'pdf' ? setUploadingPdf : format === 'epub' ? setUploadingEpub : setUploadingWord;
                const setProgress =
                  format === 'pdf' ? setPdfProgress : format === 'epub' ? setEpubProgress : setWordProgress;
                return (
                  <div key={format} className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-12 text-sm font-medium uppercase">{format}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={uploading}
                        onClick={() => inputRef.current?.click()}
                      >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploading
                          ? `${t('arka_content_uploading')} ${progress}%`
                          : t('arka_content_upload_file')}
                      </Button>
                      <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleFormatUpload(file, format, setUploading, setProgress);
                          e.target.value = '';
                        }}
                      />
                      {form[nameKey] ? (
                        <span className="truncate text-sm text-muted-foreground">{form[nameKey]}</span>
                      ) : null}
                      {form[urlKey] ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setForm((f) => ({ ...f, [urlKey]: '', [nameKey]: '' }))}
                        >
                          {t('arka_content_clear_file')}
                        </Button>
                      ) : null}
                    </div>
                    {uploading ? <Progress value={progress} className="h-2" /> : null}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChangeAction(false)} disabled={saving}>
              {t('arka_content_cancel')}
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {t('arka_content_save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaPickerDialog
        open={coverPickerOpen}
        onOpenChange={setCoverPickerOpen}
        acceptTypes={['image']}
        isAdmin
        onSelect={(item) => {
          setForm((f) => ({ ...f, coverImageUrl: item.fileUrl }));
          setCoverPickerOpen(false);
        }}
      />
    </>
  );
}
