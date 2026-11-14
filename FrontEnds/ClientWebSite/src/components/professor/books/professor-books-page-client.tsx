'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ExternalLink,
  FileText,
  ImageIcon,
  Loader2,
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
  bookHasAnyFile,
  deleteTeacherBook,
  getMyBooks,
  MAX_BOOK_FILE_BYTES,
  MAX_COVER_BYTES,
  saveTeacherBook,
  uploadBookCover,
  uploadBookFile,
  type BookFormatSavePayload,
  type BookApprovalStatus,
  type TeacherBook,
} from '@/lib/api/professor-books';
import { getMyAdvertisementPlan, type MyAdvertisementPlan } from '@/lib/api/advertisement-monetization';
import { getApiErrorMessage } from '@/lib/api/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  buildCategoryPickerOptions,
  searchCategoryTree,
} from '@/lib/api/categories';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';

type Props = { dict: Dictionary };

type BookFormatSlot = {
  file: File | null;
  url?: string;
  fileName?: string;
};

type BookFormatsState = {
  pdf: BookFormatSlot;
  epub: BookFormatSlot;
  word: BookFormatSlot;
};

const PDF_ACCEPT = '.pdf,application/pdf';
const EPUB_ACCEPT = '.epub,application/epub+zip';
const WORD_ACCEPT =
  '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function emptyBookFormats(): BookFormatsState {
  return {
    pdf: { file: null },
    epub: { file: null },
    word: { file: null },
  };
}

function bookFormatsFromBook(book: TeacherBook): BookFormatsState {
  return {
    pdf: { file: null, url: book.pdfFileUrl, fileName: book.pdfFileName },
    epub: { file: null, url: book.epubFileUrl, fileName: book.epubFileName },
    word: { file: null, url: book.wordFileUrl, fileName: book.wordFileName },
  };
}

async function resolveBookFormatsForSave(formats: BookFormatsState): Promise<BookFormatSavePayload> {
  const uploadIfNeeded = async (slot: BookFormatSlot) => {
    if (slot.file) {
      if (slot.file.size > MAX_BOOK_FILE_BYTES) {
        throw new Error('Book file must be 50 MB or smaller.');
      }
      const uploaded = await uploadBookFile(slot.file);
      return { url: uploaded.url, fileName: uploaded.fileName };
    }
    return { url: slot.url ?? '', fileName: slot.fileName ?? '' };
  };

  const [pdf, epub, word] = await Promise.all([
    uploadIfNeeded(formats.pdf),
    uploadIfNeeded(formats.epub),
    uploadIfNeeded(formats.word),
  ]);

  return {
    pdfFileUrl: pdf.url,
    pdfFileName: pdf.fileName,
    epubFileUrl: epub.url,
    epubFileName: epub.fileName,
    wordFileUrl: word.url,
    wordFileName: word.fileName,
  };
}

function parseTagsInput(raw: string): string[] {
  return raw
    .split(/[,،]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function statusBadgeVariant(status: BookApprovalStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'approved') return 'default';
  if (status === 'pending') return 'secondary';
  if (status === 'rejected') return 'destructive';
  return 'outline';
}

function BookCategorySelect({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
  noneLabel,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: number | null; name: string; depth: number }[];
  disabled?: boolean;
  noneLabel: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? '' : v)} disabled={disabled}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={noneLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{noneLabel}</SelectItem>
          {options
            .filter((opt) => opt.id != null)
            .map((opt) => (
              <SelectItem key={opt.id!} value={String(opt.id)}>
                {'\u00A0'.repeat(opt.depth * 2)}
                {opt.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CoverPicker({
  id,
  label,
  hint,
  previewUrl,
  onFile,
  disabled,
}: {
  id: string;
  label: string;
  hint?: string;
  previewUrl?: string | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative aspect-[3/4] w-full max-w-[140px] overflow-hidden rounded-lg border bg-muted">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[160px] items-center justify-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 opacity-40" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Input
            id={id}
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            disabled={disabled}
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          {previewUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-fit"
              disabled={disabled}
              onClick={() => {
                onFile(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BookFilePicker({
  id,
  label,
  hint,
  accept,
  currentFileName,
  onFile,
  onRemove,
  disabled,
}: {
  id: string;
  label: string;
  hint?: string;
  accept: string;
  currentFileName?: string | null;
  onFile: (file: File | null) => void;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {currentFileName ? (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate">{currentFileName}</span>
          {onRemove ? (
            <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onRemove}>
              Remove
            </Button>
          ) : null}
        </div>
      ) : null}
      <Input
        id={id}
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function BookFormatFilesEditor({
  idPrefix,
  formats,
  onChange,
  t,
  disabled,
}: {
  idPrefix: string;
  formats: BookFormatsState;
  onChange: (next: BookFormatsState) => void;
  t: (key: string, fb: string) => string;
  disabled?: boolean;
}) {
  const updateSlot = (key: keyof BookFormatsState, patch: Partial<BookFormatSlot>) => {
    onChange({
      ...formats,
      [key]: { ...formats[key], ...patch },
    });
  };

  const clearSlot = (key: keyof BookFormatsState) => {
    onChange({
      ...formats,
      [key]: { file: null, url: undefined, fileName: undefined },
    });
  };

  const displayName = (key: keyof BookFormatsState) =>
    formats[key].file?.name ?? formats[key].fileName ?? null;

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <p className="text-sm font-medium">
        {t('professorDashboard.books.filesSectionTitle', 'Book files (optional)')}
      </p>
      <p className="text-xs text-muted-foreground">
        {t(
          'professorDashboard.books.filesSectionHint',
          'Upload PDF, EPUB and/or Word — any combination, max 50 MB each.'
        )}
      </p>
      <BookFilePicker
        id={`${idPrefix}-pdf`}
        label={t('professorDashboard.books.pdfLabel', 'PDF file')}
        hint={t('professorDashboard.books.pdfHint', 'PDF — max 50 MB')}
        accept={PDF_ACCEPT}
        currentFileName={displayName('pdf')}
        onFile={(file) => updateSlot('pdf', { file })}
        onRemove={formats.pdf.url || formats.pdf.file ? () => clearSlot('pdf') : undefined}
        disabled={disabled}
      />
      <BookFilePicker
        id={`${idPrefix}-epub`}
        label={t('professorDashboard.books.epubLabel', 'EPUB file')}
        hint={t('professorDashboard.books.epubHint', 'EPUB — max 50 MB')}
        accept={EPUB_ACCEPT}
        currentFileName={displayName('epub')}
        onFile={(file) => updateSlot('epub', { file })}
        onRemove={formats.epub.url || formats.epub.file ? () => clearSlot('epub') : undefined}
        disabled={disabled}
      />
      <BookFilePicker
        id={`${idPrefix}-word`}
        label={t('professorDashboard.books.wordLabel', 'Word file')}
        hint={t('professorDashboard.books.wordHint', 'DOC or DOCX — max 50 MB')}
        accept={WORD_ACCEPT}
        currentFileName={displayName('word')}
        onFile={(file) => updateSlot('word', { file })}
        onRemove={formats.word.url || formats.word.file ? () => clearSlot('word') : undefined}
        disabled={disabled}
      />
    </div>
  );
}

function SavedBookCard({
  book,
  categoryOptions,
  t,
  onChanged,
}: {
  book: TeacherBook;
  categoryOptions: { id: number | null; name: string; depth: number }[];
  t: (key: string, fb: string) => string;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [title, setTitle] = React.useState(book.title);
  const [shortDescription, setShortDescription] = React.useState(book.shortDescription);
  const [longDescriptionHtml, setLongDescriptionHtml] = React.useState(book.longDescriptionHtml);
  const [publisher, setPublisher] = React.useState(book.publisher ?? '');
  const [publicationYear, setPublicationYear] = React.useState(
    book.publicationYear != null ? String(book.publicationYear) : ''
  );
  const [isbn, setIsbn] = React.useState(book.isbn ?? '');
  const [tagsInput, setTagsInput] = React.useState(book.tags.join(', '));
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);
  const [coverUrl, setCoverUrl] = React.useState(book.coverImageUrl);
  const [formats, setFormats] = React.useState<BookFormatsState>(() => bookFormatsFromBook(book));
  const [categoryId, setCategoryId] = React.useState(book.categoryId != null ? String(book.categoryId) : '');

  React.useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const statusLabel = t(
    `professorDashboard.books.status.${book.approvalStatus}`,
    book.approvalStatus
  );

  const saveChanges = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setBusy(true);
    try {
      let nextCover = coverUrl;
      if (coverFile) {
        nextCover = await uploadBookCover(coverFile);
      }

      const formatPayload = await resolveBookFormatsForSave(formats);

      await saveTeacherBook({
        bookId: book.id,
        title: trimmedTitle,
        shortDescription: shortDescription.trim(),
        longDescriptionHtml,
        coverImageUrl: nextCover,
        ...formatPayload,
        publisher: publisher.trim() || undefined,
        publicationYear: publicationYear.trim() ? Number(publicationYear) : undefined,
        isbn: isbn.trim() || undefined,
        tags: parseTagsInput(tagsInput),
        sortOrder: book.sortOrder,
        categoryId: categoryId ? Number(categoryId) : null,
      });

      toast({ title: t('professorDashboard.books.saved', 'Book updated') });
      setEditing(false);
      setCoverFile(null);
      setFormats(bookFormatsFromBook({ ...book, ...formatPayload }));
      onChanged();
    } catch (error) {
      toast({
        title: getApiErrorMessage(
          error,
          error instanceof Error && error.message.includes('50 MB')
            ? t('professorDashboard.books.fileTooLarge', 'Book file must be 50 MB or smaller.')
            : t('professorDashboard.books.saveError', 'Could not save book')
        ),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(t('professorDashboard.books.deleteConfirm', 'Delete this book?'))) return;
    setBusy(true);
    try {
      await deleteTeacherBook(book.id);
      toast({ title: t('professorDashboard.books.deleted', 'Book deleted') });
      onChanged();
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, t('professorDashboard.books.deleteError', 'Could not delete book')),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const displayCover = coverPreview ?? (coverUrl ? getBookCoverImageUrl(coverUrl) : null);

  return (
    <Card className="flex h-full flex-col overflow-hidden border shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[3/2] bg-muted">
        {displayCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayCover} alt={book.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <BookOpen className="h-10 w-10 opacity-30" />
          </div>
        )}
        <div className="absolute start-3 top-3">
          <Badge variant={statusBadgeVariant(book.approvalStatus)}>{statusLabel}</Badge>
        </div>
      </div>

      <CardHeader className="space-y-2 pb-2">
        {editing ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`edit-title-${book.id}`}>{t('professorDashboard.books.titleLabel', 'Title')}</Label>
              <Input
                id={`edit-title-${book.id}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('professorDashboard.books.shortDescriptionLabel', 'Short description')}</Label>
              <Textarea
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={3}
                disabled={busy}
              />
            </div>
          </div>
        ) : (
          <>
            <CardTitle className="line-clamp-2 text-base leading-snug">{book.title}</CardTitle>
            {book.shortDescription ? (
              <p className="line-clamp-3 text-sm text-muted-foreground">{book.shortDescription}</p>
            ) : null}
          </>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pb-2">
        {editing ? (
          <div className="space-y-4">
            <CoverPicker
              id={`edit-cover-${book.id}`}
              label={t('professorDashboard.books.coverLabel', 'Cover image')}
              hint={t('professorDashboard.books.coverHint', 'JPG, PNG or WebP — max 5 MB')}
              previewUrl={displayCover}
              onFile={setCoverFile}
              disabled={busy}
            />
            <BookFormatFilesEditor
              idPrefix={`edit-${book.id}`}
              formats={formats}
              onChange={setFormats}
              t={t}
              disabled={busy}
            />
            <BookCategorySelect
              id={`edit-category-${book.id}`}
              label={t('professorDashboard.books.categoryLabel', 'Category')}
              noneLabel={t('professorDashboard.books.categoryNone', 'No category')}
              value={categoryId}
              onChange={setCategoryId}
              options={categoryOptions}
              disabled={busy}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('professorDashboard.books.publisherLabel', 'Publisher')}</Label>
                <Input value={publisher} onChange={(e) => setPublisher(e.target.value)} disabled={busy} />
              </div>
              <div className="space-y-2">
                <Label>{t('professorDashboard.books.yearLabel', 'Publication year')}</Label>
                <Input
                  type="number"
                  min={1000}
                  max={2100}
                  value={publicationYear}
                  onChange={(e) => setPublicationYear(e.target.value)}
                  disabled={busy}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('professorDashboard.books.isbnLabel', 'ISBN')}</Label>
              <Input value={isbn} onChange={(e) => setIsbn(e.target.value)} maxLength={50} disabled={busy} />
            </div>
            <div className="space-y-2">
              <Label>{t('professorDashboard.books.tagsLabel', 'Tags')}</Label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder={t('professorDashboard.books.tagsPlaceholder', 'e.g. programming, C#, web')}
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('professorDashboard.books.longDescriptionLabel', 'Full description')}</Label>
              <ProfessorAdRichTextEditor
                value={longDescriptionHtml}
                onChange={setLongDescriptionHtml}
                placeholder={t('professorDashboard.books.longDescriptionPlaceholder', 'Write about the book…')}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {book.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {book.publisher ? (
              <span className="text-xs text-muted-foreground">{book.publisher}</span>
            ) : null}
            {book.publicationYear ? (
              <span className="text-xs text-muted-foreground">{book.publicationYear}</span>
            ) : null}
            {bookHasAnyFile(book) ? (
              <Badge variant="secondary" className="text-xs">
                {t('professorDashboard.books.hasFile', 'File attached')}
              </Badge>
            ) : null}
          </div>
        )}
      </CardContent>

      <CardFooter className="mt-auto flex flex-wrap gap-2 border-t bg-muted/20 px-4 py-3">
        {editing ? (
          <>
            <Button size="sm" disabled={busy} onClick={() => void saveChanges()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('professorDashboard.books.saveChanges', 'Save')}
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
              {t('professorDashboard.books.cancel', 'Cancel')}
            </Button>
          </>
        ) : (
          <>
            {book.slug ? (
              <Button size="sm" variant="outline" className="gap-1.5" asChild>
                <Link href={`/books/${encodeURIComponent(book.slug)}`} target="_blank">
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t('professorDashboard.books.viewPublic', 'View page')}
                </Link>
              </Button>
            ) : null}
            <Button size="sm" variant="secondary" className="gap-1.5" disabled={busy} onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
              {t('professorDashboard.books.edit', 'Edit')}
            </Button>
            <Button size="sm" variant="destructive" className="gap-1.5" disabled={busy} onClick={() => void remove()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {t('professorDashboard.books.delete', 'Delete')}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

export function ProfessorBooksPageClient({ dict }: Props) {
  const { toast } = useToast();
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const t = React.useCallback(
    (key: string, fb: string) => getDictValue(dict, key, fb),
    [dict]
  );

  const [books, setBooks] = React.useState<TeacherBook[]>([]);
  const [plan, setPlan] = React.useState<MyAdvertisementPlan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);

  const [title, setTitle] = React.useState('');
  const [shortDescription, setShortDescription] = React.useState('');
  const [longDescriptionHtml, setLongDescriptionHtml] = React.useState('');
  const [publisher, setPublisher] = React.useState('');
  const [publicationYear, setPublicationYear] = React.useState('');
  const [isbn, setIsbn] = React.useState('');
  const [tagsInput, setTagsInput] = React.useState('');
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);
  const [formats, setFormats] = React.useState<BookFormatsState>(() => emptyBookFormats());
  const [categoryId, setCategoryId] = React.useState('');
  const [categoryOptions, setCategoryOptions] = React.useState<
    { id: number | null; name: string; depth: number }[]
  >([]);

  React.useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [list, planData] = await Promise.all([getMyBooks(), getMyAdvertisementPlan()]);
      setBooks(list);
      setPlan(planData);
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, t('professorDashboard.books.loadError', 'Could not load books')),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    void (async () => {
      try {
        const tree = await searchCategoryTree({ pageSize: 500 });
        setCategoryOptions(
          buildCategoryPickerOptions(
            tree,
            t('professorDashboard.books.categoryNone', 'No category')
          )
        );
      } catch {
        setCategoryOptions([]);
      }
    })();
  }, [t]);

  const resetForm = () => {
    setTitle('');
    setShortDescription('');
    setLongDescriptionHtml('');
    setPublisher('');
    setPublicationYear('');
    setIsbn('');
    setTagsInput('');
    setCoverFile(null);
    setFormats(emptyBookFormats());
    setCategoryId('');
    setFormOpen(false);
  };

  const submitNew = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setSaving(true);
    try {
      let coverImageUrl: string | undefined;
      if (coverFile) {
        if (coverFile.size > MAX_COVER_BYTES) {
          toast({
            title: t('professorDashboard.books.coverTooLarge', 'Cover must be 5 MB or smaller.'),
            variant: 'destructive',
          });
          return;
        }
        coverImageUrl = await uploadBookCover(coverFile);
      }

      const formatPayload = await resolveBookFormatsForSave(formats);

      await saveTeacherBook({
        title: trimmedTitle,
        shortDescription: shortDescription.trim(),
        longDescriptionHtml,
        coverImageUrl,
        ...formatPayload,
        publisher: publisher.trim() || undefined,
        publicationYear: publicationYear.trim() ? Number(publicationYear) : undefined,
        isbn: isbn.trim() || undefined,
        tags: parseTagsInput(tagsInput),
        categoryId: categoryId ? Number(categoryId) : null,
      });

      toast({ title: t('professorDashboard.books.created', 'Book saved') });
      resetForm();
      await load();
    } catch (error) {
      toast({
        title: getApiErrorMessage(
          error,
          error instanceof Error && error.message.includes('50 MB')
            ? t('professorDashboard.books.fileTooLarge', 'Book file must be 50 MB or smaller.')
            : t('professorDashboard.books.saveError', 'Could not save book')
        ),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const atBookLimit =
    plan != null && !plan.hasPaidFeatures && books.length >= (plan.freeMaxBooks ?? 1);

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        <h1 className="font-headline text-2xl font-bold md:text-3xl">
          {t('professorDashboard.books.pageTitle', 'Books')}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {t(
            'professorDashboard.books.pageDescription',
            'Register books you have published. They appear on your ad page and the public books catalog.'
          )}
        </p>
      </div>

      {plan && !plan.hasPaidFeatures ? (
        <Alert className="rounded-xl border-amber-500/40 bg-amber-500/5">
          <AlertDescription className="space-y-2">
            <p>
              {t(
                'professorDashboard.books.freeLimitsBanner',
                `Free plan: up to ${plan.freeMaxBooks} book(s). Upgrade your plan to add more.`
              ).replace('{{max}}', String(plan.freeMaxBooks))}
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/professor/advertisement-plans">
                {t('professorDashboard.books.viewPlans', 'View plans & upgrade')}
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {!formOpen ? (
        <Button
          type="button"
          className="gap-2"
          disabled={atBookLimit}
          onClick={() => setFormOpen(true)}
        >
          <Plus className="h-4 w-4" />
          {atBookLimit
            ? t('professorDashboard.books.limitReached', 'You have reached the free plan book limit.')
            : t('professorDashboard.books.addBook', 'Add book')}
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('professorDashboard.books.formTitle', 'New book')}</CardTitle>
          </CardHeader>
          <form onSubmit={(e) => void submitNew(e)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="book-title">{t('professorDashboard.books.titleLabel', 'Title')} *</Label>
                <Input
                  id="book-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('professorDashboard.books.titlePlaceholder', 'Book title')}
                  required
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-short">{t('professorDashboard.books.shortDescriptionLabel', 'Short description')}</Label>
                <Textarea
                  id="book-short"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={3}
                  disabled={saving}
                />
              </div>
              <CoverPicker
                id="book-cover"
                label={t('professorDashboard.books.coverLabel', 'Cover image')}
                hint={t('professorDashboard.books.coverHint', 'JPG, PNG or WebP — max 5 MB')}
                previewUrl={coverPreview}
                onFile={setCoverFile}
                disabled={saving}
              />
              <BookFormatFilesEditor
                idPrefix="new-book"
                formats={formats}
                onChange={setFormats}
                t={t}
                disabled={saving}
              />
              <BookCategorySelect
                id="book-category"
                label={t('professorDashboard.books.categoryLabel', 'Category')}
                noneLabel={t('professorDashboard.books.categoryNone', 'No category')}
                value={categoryId}
                onChange={setCategoryId}
                options={categoryOptions}
                disabled={saving}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="book-publisher">{t('professorDashboard.books.publisherLabel', 'Publisher')}</Label>
                  <Input
                    id="book-publisher"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="book-year">{t('professorDashboard.books.yearLabel', 'Publication year')}</Label>
                  <Input
                    id="book-year"
                    type="number"
                    min={1000}
                    max={2100}
                    value={publicationYear}
                    onChange={(e) => setPublicationYear(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-isbn">{t('professorDashboard.books.isbnLabel', 'ISBN')}</Label>
                <Input id="book-isbn" value={isbn} onChange={(e) => setIsbn(e.target.value)} maxLength={50} disabled={saving} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-tags">{t('professorDashboard.books.tagsLabel', 'Tags')}</Label>
                <Input
                  id="book-tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder={t('professorDashboard.books.tagsPlaceholder', 'e.g. programming, C#, web')}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('professorDashboard.books.longDescriptionLabel', 'Full description')}</Label>
                <ProfessorAdRichTextEditor
                  value={longDescriptionHtml}
                  onChange={setLongDescriptionHtml}
                  placeholder={t('professorDashboard.books.longDescriptionPlaceholder', 'Write about the book…')}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 border-t bg-muted/20">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {t('professorDashboard.books.saveBook', 'Save book')}
              </Button>
              <Button type="button" variant="ghost" disabled={saving} onClick={resetForm}>
                {t('professorDashboard.books.cancel', 'Cancel')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-headline text-xl font-semibold">
            {t('professorDashboard.books.listTitle', 'Your books')}
          </h2>
          <Badge variant="secondary">
            {books.length} {t('professorDashboard.books.countLabel', 'books')}
          </Badge>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            {t('professorDashboard.books.empty', 'No books yet. Add your first book above.')}
          </p>
        ) : (
          <div className={cn('grid gap-6 sm:grid-cols-2 xl:grid-cols-3')}>
            {books.map((book) => (
              <SavedBookCard
                key={book.id}
                book={book}
                categoryOptions={categoryOptions}
                t={t}
                onChanged={() => void load()}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
