'use client';

import * as React from 'react';
import Image from 'next/image';
import { Loader2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getDictValue } from '@/lib/i18n-client';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import { getArticleImageUrl } from '@/lib/utils/image-url';
import { searchCategories, type CategoryListItem } from '@/lib/api/categories';
import { CustomRichTextEditor } from '@/components/professor/courses/admin-ported/custom-rich-text-editor';
import { TagSuggestionInput } from '@/components/professor/courses/admin-ported/tag-suggestion-input';
import {
  addProfessorArticle,
  getProfessorArticleById,
  slugifyArticleTitle,
  updateProfessorArticle,
  uploadArticleThumbnail,
  type ProfessorArticleListItem,
} from '@/lib/api/professor-articles';
import { getApiErrorMessage } from '@/lib/api/client';
import type { Dictionary } from '@/types';
import { SeoSettingsSection, type SeoSettingsValue } from '@/components/media/SeoSettingsSection';
import { MediaPickerDialog } from '@/components/media/MediaPickerDialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: ProfessorArticleListItem | null;
  dict: Dictionary;
  onSaved: () => void;
};

type FormState = {
  title: string;
  shortDescription: string;
  longDescription: string;
  isPublished: boolean;
  category: string;
  imageUrl: string;
  imageFile: File | null;
  tags: string[];
};

const emptyForm = (): FormState => ({
  title: '',
  shortDescription: '',
  longDescription: '',
  isPublished: false,
  category: '',
  imageUrl: '',
  imageFile: null,
  tags: [],
});

function ArticleMediaStep({
  form,
  setForm,
  dict,
  t,
  disabled,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  dict: Dictionary;
  t: (key: string, fb: string) => string;
  disabled?: boolean;
}) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  React.useEffect(() => {
    if (form.imageFile) {
      const url = URL.createObjectURL(form.imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
    return undefined;
  }, [form.imageFile]);

  const imagePreview =
    previewUrl ??
    (form.imageUrl?.startsWith('data:') ? form.imageUrl : form.imageUrl ? getArticleImageUrl(form.imageUrl) : null);

  return (
    <div className="space-y-8">
      <div>
        <Label htmlFor="article-thumbnail" className="text-base font-medium">
          {t('professorDashboard.articles.imageLabel', 'Cover image')}
        </Label>
        <p className="mb-2 text-sm text-muted-foreground">
          {t('professorDashboard.articles.imageHint', 'JPG, PNG or WebP recommended.')}
        </p>
        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
          <div className="text-center">
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt=""
                width={220}
                height={124}
                className="mx-auto rounded-md object-cover"
                unoptimized
              />
            ) : (
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            )}
            <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
              <Label
                htmlFor="article-thumbnail"
                className="relative cursor-pointer rounded-md bg-background font-semibold text-primary hover:text-primary/80"
              >
                <span>{t('professorDashboard.articles.uploadFile', 'Upload file')}</span>
                <Input
                  id="article-thumbnail"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  disabled={disabled}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setForm((prev) => ({ ...prev, imageFile: file }));
                  }}
                />
              </Label>
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-3" disabled={disabled} onClick={() => setPickerOpen(true)}>
              {getDictValue(dict, 'media.selectFromLibrary', 'Select from library')}
            </Button>
          </div>
        </div>
        <MediaPickerDialog
          dict={dict}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          acceptTypes={['image']}
          onSelect={(item) => {
            setForm((prev) => ({ ...prev, imageUrl: item.fileUrl, imageFile: null }));
            setPickerOpen(false);
          }}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{t('professorDashboard.articles.tagsTitle', 'Tags')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('professorDashboard.articles.tagsHint', 'Add SEO-friendly tags for this article.')}
        </p>
        <TagSuggestionInput
          tags={form.tags}
          onTagsChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
          placeholder={t('professorDashboard.articles.tagsPlaceholder', 'Type a tag…')}
          addButtonLabel={t('professorDashboard.articles.tagsAdd', 'Add')}
          removeLabel={(tag) => t('professorDashboard.articles.removeTag', `Remove ${tag}`).replace('{tag}', tag)}
          hint={t('professorDashboard.articles.tagsSuggestionsHint', 'Select from suggestions or add a new tag.')}
        />
      </div>
    </div>
  );
}

export function ProfessorArticleFormDialog({ open, onOpenChange, article, dict, onSaved }: Props) {
  const { toast } = useToast();
  const { dir } = useLanguage();
  const t = React.useCallback((key: string, fb: string) => getDictValue(dict, key, fb), [dict]);

  const steps = React.useMemo(
    () => [
      { id: 1, name: t('professorDashboard.articles.step1', 'Content') },
      { id: 2, name: t('professorDashboard.articles.step2', 'Media & tags') },
    ],
    [t]
  );

  const isEditMode = Boolean(article?.id);
  const [currentStep, setCurrentStep] = React.useState(1);
  const [maxCompletedStep, setMaxCompletedStep] = React.useState(1);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [categories, setCategories] = React.useState<CategoryListItem[]>([]);
  const [loadingCategories, setLoadingCategories] = React.useState(false);
  const [loadingEdit, setLoadingEdit] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [seoSettings, setSeoSettings] = React.useState<SeoSettingsValue>({});

  React.useEffect(() => {
    if (!open) return;
    setLoadingCategories(true);
    searchCategories({ pageSize: 100 })
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    if (isEditMode && article) {
      setLoadingEdit(true);
      getProfessorArticleById(article.id)
        .then((full) => {
          if (full) {
            setForm({
              title: full.title,
              shortDescription: full.summary,
              longDescription: full.content,
              isPublished: full.isPublished,
              category: full.categoryId != null ? String(full.categoryId) : '',
              imageUrl: full.thumbnailUrl ?? '',
              imageFile: null,
              tags: full.tags,
            });
            setSeoSettings({
              seoTitle: full.seoTitle ?? '',
              metaDescription: full.metaDescription ?? '',
              ogImageUrl: full.ogImageUrl ?? '',
            });
          } else {
            setForm({
              title: article.title,
              shortDescription: article.summary,
              longDescription: '',
              isPublished: article.isPublished,
              category: '',
              imageUrl: article.thumbnailUrl ?? '',
              imageFile: null,
              tags: article.tags,
            });
          }
          setMaxCompletedStep(steps.length);
          setCurrentStep(1);
        })
        .catch(() => {
          setForm({
            title: article.title,
            shortDescription: article.summary,
            longDescription: '',
            isPublished: article.isPublished,
            category: '',
            imageUrl: article.thumbnailUrl ?? '',
            imageFile: null,
            tags: article.tags,
          });
        })
        .finally(() => setLoadingEdit(false));
    } else {
      setForm(emptyForm());
      setSeoSettings({});
      setCurrentStep(1);
      setMaxCompletedStep(1);
    }
  }, [open, isEditMode, article, steps.length]);

  const validateStep1 = (): boolean => {
    if (!form.title.trim()) {
      toast({
        title: t('professorDashboard.articles.validationTitle', 'Title is required'),
        variant: 'destructive',
      });
      return false;
    }
    if (!form.shortDescription.trim()) {
      toast({
        title: t('professorDashboard.articles.validationSummary', 'Short description is required'),
        variant: 'destructive',
      });
      return false;
    }
    if (!form.longDescription.trim()) {
      toast({
        title: t('professorDashboard.articles.validationContent', 'Full content is required'),
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep < steps.length) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (next > maxCompletedStep) setMaxCompletedStep(next);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSave = async () => {
    if (currentStep < steps.length) {
      handleNext();
      return;
    }
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    setSaving(true);
    try {
      const slug = article?.slug || slugifyArticleTitle(form.title);
      const categoryId = form.category ? Number(form.category) : null;

      if (isEditMode && article) {
        let thumbnailUrl = form.imageUrl || null;
        if (form.imageFile) {
          thumbnailUrl = await uploadArticleThumbnail(form.imageFile);
        } else if (thumbnailUrl && (thumbnailUrl.startsWith('data:') || thumbnailUrl.length > 500)) {
          thumbnailUrl = null;
        }

        await updateProfessorArticle({
          id: article.id,
          title: form.title.trim(),
          summary: form.shortDescription.trim(),
          content: form.longDescription,
          slug,
          thumbnailUrl,
          categoryId,
          isPublished: form.isPublished,
          tags: form.tags,
          seoTitle: seoSettings.seoTitle || null,
          metaDescription: seoSettings.metaDescription || null,
          ogImageUrl: seoSettings.ogImageUrl || null,
        });
        toast({ title: t('professorDashboard.articles.updated', 'Article updated') });
      } else {
        await addProfessorArticle({
          title: form.title.trim(),
          summary: form.shortDescription.trim(),
          content: form.longDescription,
          slug,
          thumbnailFile: form.imageFile,
          categoryId,
          isPublished: form.isPublished,
          tags: form.tags,
          seoTitle: seoSettings.seoTitle || null,
          metaDescription: seoSettings.metaDescription || null,
          ogImageUrl: seoSettings.ogImageUrl || null,
        });
        toast({ title: t('professorDashboard.articles.created', 'Article saved') });
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, t('professorDashboard.articles.saveError', 'Could not save article')),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-4xl overflow-hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {loadingEdit ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : null}

        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? t('professorDashboard.articles.editTitle', 'Edit article')
              : t('professorDashboard.articles.addTitle', 'New article')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'professorDashboard.articles.formDescription',
              'Write SEO-friendly articles with title, summary, rich content, category, cover image and tags.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto py-4 pe-2">
          <div className="mb-8 flex items-start justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  className={cn(
                    'flex flex-col items-center text-center',
                    step.id <= maxCompletedStep ? 'cursor-pointer' : 'cursor-default'
                  )}
                  onClick={() => step.id <= maxCompletedStep && setCurrentStep(step.id)}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                      currentStep === step.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : step.id <= maxCompletedStep
                          ? 'border-primary/50 bg-primary/20'
                          : 'border-muted-foreground/30 bg-muted'
                    )}
                  >
                    {step.id}
                  </div>
                  <p className="mt-2 hidden text-sm sm:block">{step.name}</p>
                </button>
                {index < steps.length - 1 ? <div className="mx-2 mt-5 h-px flex-1 bg-border sm:mx-4" /> : null}
              </React.Fragment>
            ))}
          </div>

          {currentStep === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="article-title">{t('professorDashboard.articles.titleLabel', 'Title')} *</Label>
                <Input
                  id="article-title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={t('professorDashboard.articles.titlePlaceholder', 'Article title')}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('professorDashboard.articles.categoryLabel', 'Category')}</Label>
                <Select
                  dir={dir}
                  value={form.category}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
                  disabled={saving || loadingCategories}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('professorDashboard.articles.categoryPlaceholder', 'Select category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="article-summary">{t('professorDashboard.articles.shortDescriptionLabel', 'Short description')} *</Label>
                <Textarea
                  id="article-summary"
                  value={form.shortDescription}
                  onChange={(e) => setForm((prev) => ({ ...prev, shortDescription: e.target.value }))}
                  rows={3}
                  disabled={saving}
                />
              </div>

              <div className="flex items-start justify-between rounded-lg border p-4">
                <div className="space-y-1 pe-4">
                  <Label>{t('professorDashboard.articles.publishLabel', 'Publish')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('professorDashboard.articles.publishHint', 'If off, the article is saved as draft.')}
                  </p>
                </div>
                <Switch
                  checked={form.isPublished}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isPublished: checked }))}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('professorDashboard.articles.longDescriptionLabel', 'Full content')} *</Label>
                <CustomRichTextEditor
                  content={form.longDescription}
                  onChangeAction={(html) => setForm((prev) => ({ ...prev, longDescription: html }))}
                  placeholder={t('professorDashboard.articles.longDescriptionPlaceholder', 'Write the article…')}
                  expandVertically
                />
              </div>
            </div>
          ) : (
            <>
              <ArticleMediaStep form={form} setForm={setForm} dict={dict} t={t} disabled={saving} />
              <SeoSettingsSection dict={dict} value={seoSettings} onChange={setSeoSettings} />
            </>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          {currentStep > 1 ? (
            <Button type="button" variant="outline" onClick={handleBack} disabled={saving}>
              {t('professorDashboard.articles.back', 'Back')}
            </Button>
          ) : null}
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            {currentStep < steps.length
              ? t('professorDashboard.articles.next', 'Next')
              : isEditMode
                ? t('professorDashboard.articles.saveChanges', 'Save changes')
                : t('professorDashboard.articles.saveArticle', 'Save article')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
