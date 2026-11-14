
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ImageIcon, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { CustomRichTextEditor } from '@/components/ui/custom-rich-text-editor';
import { useLanguage } from '@/components/language-provider';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import type { Article } from '@/lib/types';
import {
  addArticle as addArticleApi,
  updateArticle as updateArticleApi,
  getArticleById,
} from '@/services/article-api.service';
import apiClient, { resolveStaticAssetUrl } from '@/lib/apiClient';
import { TagSuggestionInput } from '@/components/tags/tag-suggestion-input';
import { SeoSettingsSection, type SeoSettingsValue } from '@/components/media/SeoSettingsSection';
import { MediaPickerDialog } from '@/components/media/MediaPickerDialog';


const stepsConfig = (t: (key: string) => string) => [
  { id: 1, name: t('addArticle_step1_name') },
  { id: 2, name: t('addArticle_step2_name') },
];

const articleSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200, 'Title must be at most 200 characters.'),
  shortDescription: z
    .string()
    .trim()
    .min(1, 'Short description is required.')
    .max(500, 'Short description must be at most 500 characters.'),
  longDescription: z.string().min(1, 'Long description is required.'),
  isPublished: z.boolean().default(false),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  imageFile: z.instanceof(File).optional().nullable(),
  tags: z.array(z.string()).default([]),
});

type ArticleForm = z.infer<typeof articleSchema>;

function ArticleMediaAndTags({ form }: { form: any }) {
    const { t } = useLanguage();
    const tags = form.watch('tags') as string[];
    const imageUrl = form.watch('imageUrl') as string | undefined;
    const [pickerOpen, setPickerOpen] = React.useState(false);
    const imagePreview = imageUrl?.startsWith('data:')
      ? imageUrl
      : imageUrl
        ? resolveStaticAssetUrl(imageUrl)
        : undefined;

    const setTags = (newTags: string[]) => form.setValue('tags', newTags);

    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <div>
            <Label className="text-base font-medium">{t('addArticle_image_label')}</Label>
            <p className="text-sm text-muted-foreground mt-1">{t('media.libraryOnlyHint') ?? 'تصویر را از کتابخانه رسانه انتخاب یا در همان بخش آپلود کنید.'}</p>
          </div>

          <div className="overflow-hidden rounded-xl border bg-muted/20">
            {imagePreview ? (
              <div className="relative aspect-video w-full max-h-[280px] bg-muted">
                <Image
                  src={imagePreview}
                  alt={t('addArticle_image_label')}
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute end-2 top-2 h-8 w-8 rounded-full shadow"
                  onClick={() => form.setValue('imageUrl', '')}
                  aria-label={t('media.removeSelection') ?? 'Remove'}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ImageIcon className="h-7 w-7" />
                </div>
                <p className="text-sm text-muted-foreground">{t('media.selectFromLibrary')}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 border-t bg-background p-4">
              <Button type="button" onClick={() => setPickerOpen(true)}>
                {imagePreview ? (t('media.changeSelection') ?? 'تغییر تصویر') : t('media.selectFromLibrary')}
              </Button>
              {imagePreview ? (
                <Button type="button" variant="outline" onClick={() => form.setValue('imageUrl', '')}>
                  {t('media.removeSelection') ?? 'حذف تصویر'}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <MediaPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          acceptTypes={['image']}
          isAdmin
          onSelect={(item) => {
            form.setValue('imageUrl', item.fileUrl);
            form.setValue('imageFile', null);
            setPickerOpen(false);
          }}
        />

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t('addArticle_tags_title')}</h3>
          <p className="text-sm text-muted-foreground">{t('addArticle_tags_description')}</p>
          <TagSuggestionInput
            tags={tags}
            onTagsChange={setTags}
            placeholder={t('addArticle_tags_placeholder')}
            addButtonLabel={t('addArticle_tags_add_button')}
            hint={t('tag_suggestions_hint') ?? 'Type to see previously saved tags; select from the list or add a new one.'}
            removeLabel={(tag) => t('remove_tag').replace('{tag}', tag)}
          />
        </div>
      </div>
    );
  }


function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-\u0600-\u06FF]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'article';
}

export function AddArticleModal({
  open,
  onOpenChangeAction,
  article,
  onSuccessAction,
}: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  article?: Article | null;
  onSuccessAction?: () => void;
}) {
  const { t , direction } = useLanguage();
  const onOpenChange = onOpenChangeAction;
  const onSuccess = onSuccessAction;
  const [categories, setCategories] = React.useState<{ categoryId: string; categoryName: string }[]>([]);
  const steps = stepsConfig(t);
  const [currentStep, setCurrentStep] = React.useState(1);
  const [maxCompletedStep, setMaxCompletedStep] = React.useState(1);
  const [saving, setSaving] = React.useState(false);
  const [loadingEdit, setLoadingEdit] = React.useState(false);
  const [loadingCategories, setLoadingCategories] = React.useState(false);
  const [seoSettings, setSeoSettings] = React.useState<SeoSettingsValue>({});
  const { toast } = useToast();
  
  const isEditMode = !!article;

  React.useEffect(() => {
    if (!open) return;
    setLoadingCategories(true);
    apiClient
      .get<Record<string, unknown>>('/Category/SearchCategories', {
        params: {
          categoryName: '',
          pageNumber: 1,
          pageSize: 100,
          needTotalCount: true,
          sortBy: 'Id',
          sortAscending: true,
        },
      })
      .then(({ data }) => {
        const raw = data?.queryResult ?? data?.QueryResult;
        const arr: unknown[] = Array.isArray(raw)
          ? raw
          : (raw && typeof raw === 'object' && Array.isArray((raw as { $values?: unknown[] }).$values))
            ? (raw as { $values: unknown[] }).$values
            : [];
        function flatten(items: unknown[]): { categoryId: string; categoryName: string }[] {
          const out: { categoryId: string; categoryName: string }[] = [];
          for (const c of items as Record<string, unknown>[]) {
            const id = String(c?.categoryId ?? c?.CategoryId ?? c?.id ?? c?.Id ?? '').trim();
            const name = String(c?.name ?? c?.Name ?? c?.categoryName ?? c?.CategoryName ?? '').trim();
            if (id && name) out.push({ categoryId: id, categoryName: name });
            const children = (c?.children ?? c?.Children) as unknown[] | undefined;
            if (Array.isArray(children) && children.length) out.push(...flatten(children));
          }
          return out;
        }
        setCategories(flatten(arr));
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, [open]);

  const form = useForm<ArticleForm>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      shortDescription: '',
      longDescription: '',
      isPublished: false,
      category: '',
      imageUrl: '',
      imageFile: null as File | null,
      tags: [],
    },
  });

  const resetCreateForm = React.useCallback(() => {
    form.reset({
      title: '',
      shortDescription: '',
      longDescription: '',
      isPublished: false,
      category: '',
      imageUrl: '',
      imageFile: null,
      tags: [],
    });
    setCurrentStep(1);
    setMaxCompletedStep(1);
    setSeoSettings({});
  }, [form]);

  React.useEffect(() => {
    if (!open || !isEditMode || !article) return;

    setLoadingEdit(true);
    getArticleById(article.id)
        .then((full) => {
          if (full) {
            form.reset({
              title: full.title ?? article.title ?? '',
              shortDescription: full.summary ?? article.shortDescription ?? '',
              longDescription: full.content ?? article.longDescription ?? '',
              isPublished: Boolean(full.isPublished ?? (article.status === 'Published')),
              category: full.categoryId != null ? String(full.categoryId) : '',
              imageUrl: full.thumbnailUrl ?? article.imageUrl ?? '',
              imageFile: null,
              tags: full.tags ?? article.tags ?? [],
            });
            setSeoSettings({
              seoTitle: full.seoTitle ?? '',
              metaDescription: full.metaDescription ?? '',
              ogImageUrl: full.ogImageUrl ?? '',
            });
          } else {
            form.reset({
              title: article.title ?? '',
              shortDescription: article.shortDescription ?? '',
              longDescription: article.longDescription ?? '',
              isPublished: article.status === 'Published',
              category: article.categoryId != null ? String(article.categoryId) : '',
              imageUrl: article.imageUrl ?? '',
              imageFile: null,
              tags: article.tags ?? [],
            });
          }
          setMaxCompletedStep(steps.length);
        })
        .catch(() => {
          form.reset({
            title: article.title ?? '',
            shortDescription: article.shortDescription ?? '',
            longDescription: article.longDescription ?? '',
            isPublished: article.status === 'Published',
            category: '',
            imageUrl: article.imageUrl ?? '',
            imageFile: null,
            tags: article.tags ?? [],
          });
        })
        .finally(() => setLoadingEdit(false));
  }, [open, isEditMode, article, form, steps.length]);

  
  const handleStepClick = (step: number) => {
    if (step <= maxCompletedStep) {
      setCurrentStep(step);
    }
  };
  
  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await form.trigger();
      if (!isValid) {
         toast({
          variant: 'destructive',
          title: t('validation_error_title'),
          description: t('validation_error_description'),
        });
        return;
      }
    }

    if (currentStep < steps.length) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (nextStep > maxCompletedStep) {
        setMaxCompletedStep(nextStep);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSave = async (values: ArticleForm) => {
     if (currentStep < steps.length) {
      await handleNext();
      return;
    }

    setSaving(true);
    try {
      const slug = article?.slug || slugify(values.title);
      const categoryId = values.category ? Number(values.category) : null;

      if (isEditMode && article) {
        let thumbnailUrl = values.imageUrl || null;
        if (thumbnailUrl && (thumbnailUrl.startsWith('data:') || thumbnailUrl.length > 500)) {
          thumbnailUrl = null;
        }
        await updateArticleApi({
          id: Number(article.id),
          title: values.title,
          summary: values.shortDescription,
          content: values.longDescription,
          slug,
          thumbnailUrl,
          categoryId,
          isPublished: values.isPublished,
          tags: values.tags,
          seoTitle: seoSettings.seoTitle || null,
          metaDescription: seoSettings.metaDescription || null,
          ogImageUrl: seoSettings.ogImageUrl || null,
        });
        toast({
          title: t('editArticle_toast_success_title'),
          description: t('editArticle_toast_success_description'),
        });
      } else {
        await addArticleApi({
          title: values.title,
          summary: values.shortDescription,
          content: values.longDescription,
          slug,
          libraryThumbnailUrl: values.imageUrl || null,
          categoryId,
          isPublished: values.isPublished,
          tags: values.tags,
          seoTitle: seoSettings.seoTitle || null,
          metaDescription: seoSettings.metaDescription || null,
          ogImageUrl: seoSettings.ogImageUrl || null,
        });
        toast({
          title: t('addArticle_toast_success_title'),
          description: t('addArticle_toast_success_description'),
        });
        resetCreateForm();
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: error instanceof Error ? error.message : (t('error_save_article') || 'Failed to save article.'),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {loadingEdit && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('editArticle_title') : t('addArticle_title')}</DialogTitle>
          <DialogDescription>{isEditMode ? t('editArticle_description') : t('addArticle_description')}</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto pr-6 py-4 -mr-6">
          <div className="flex justify-between items-start mb-8 ml-3">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div 
                    className={cn(
                        "flex flex-col items-center text-center",
                        step.id <= maxCompletedStep ? "cursor-pointer" : "cursor-default"
                    )}
                    onClick={() => handleStepClick(step.id)}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                      currentStep === step.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : step.id <= maxCompletedStep 
                        ? 'bg-primary/20 border-primary/50'
                        : 'bg-muted border-muted-foreground/30'
                    )}
                  >
                    {step.id}
                  </div>
                  <p className="text-sm mt-2 hidden sm:block">{step.name}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-px bg-border mt-5 mx-2 sm:mx-4"></div>
                )}
              </React.Fragment>
            ))}
          </div>

          
          <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6 ml-3">
                {currentStep === 1 && (
                  <>
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('addArticle_article_title_label')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('addArticle_article_title_placeholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                              <FormItem >
                                  <FormLabel>{t('addArticle_category_label')}</FormLabel>
                                  <Select dir={direction} onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                          <SelectTrigger>
                                              <SelectValue placeholder={t('addArticle_category_placeholder')} />
                                          </SelectTrigger>
                                      </FormControl>
                                      <SelectContent >
                                          {loadingCategories ? (
                                            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                              {t('loading') || 'Loading...'}
                                            </div>
                                          ) : categories.length === 0 ? (
                                            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                              {t('no_categories') ?? 'دسته‌بندی یافت نشد'}
                                            </div>
                                          ) : (
                                            categories.map((cat) => (
                                              <SelectItem key={cat.categoryId} value={String(cat.categoryId)}>
                                                {cat.categoryName}
                                              </SelectItem>
                                            ))
                                          )}
                                      </SelectContent>
                                  </Select>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />

                      <FormField
                        control={form.control}
                        name="shortDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('addArticle_short_description_label')}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t('addArticle_short_description_placeholder')}
                                maxLength={500}
                                {...field}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormDescription>{(field.value ?? '').length}/500</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="isPublished"
                        render={({ field }) => (
                          <FormItem className="flex items-start justify-between rounded-lg border p-4">
                            <div className="space-y-1">
                              <FormLabel>{t('article_publish_label') || 'انتشار نهایی'}</FormLabel>
                              <FormDescription>
                                {t('article_publish_description') || 'اگر خاموش باشد، مقاله به‌صورت پیش‌نویس ذخیره می‌شود.'}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="longDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('addArticle_long_description_label')}</FormLabel>
                            <FormControl>
                              <CustomRichTextEditor
                                content={field.value ?? ''}
                                onChangeAction={field.onChange}
                                placeholder={t('addArticle_long_description_placeholder')}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </>
                )}
                
                {currentStep === 2 && (
                  <>
                    <ArticleMediaAndTags form={form} />
                    <SeoSettingsSection value={seoSettings} onChange={setSeoSettings} />
                  </>
                )}

                <DialogFooter className="mt-auto pt-4 border-t">
                  {currentStep > 1 && (
                    <Button variant="outline" onClick={handleBack} type="button">
                      {t('back_button')}
                    </Button>
                  )}
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {currentStep < steps.length
                      ? t('next_button')
                      : isEditMode
                      ? t('save_changes')
                      : t('save_article_button')}
                  </Button>
                </DialogFooter>
              </form>
          </Form>

        </div>
      </DialogContent>
    </Dialog>
  );
}
