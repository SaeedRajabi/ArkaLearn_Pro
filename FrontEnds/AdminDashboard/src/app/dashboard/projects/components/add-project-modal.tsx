'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { UploadCloud, Loader2, Plus, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { CustomRichTextEditor } from '@/components/ui/custom-rich-text-editor';
import { useLanguage } from '@/components/language-provider';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/lib/types';
import {
  addProject as addProjectApi,
  updateProject as updateProjectApi,
  getProjectById,
  uploadProjectThumbnail,
  uploadProjectGalleryImage,
  uploadProjectIntroVideo,
} from '@/services/project-api.service';
import { resolveStaticAssetUrl } from '@/lib/apiClient';
import { TagSuggestionInput } from '@/components/tags/tag-suggestion-input';

const galleryItemSchema = z
  .object({
    title: z.string().min(1, 'Title is required.'),
    shortDescription: z.string().min(1, 'Short description is required.'),
    imageUrl: z.string().optional(),
    imageFile: z.instanceof(File).optional().nullable(),
  })
  .refine((item) => Boolean(item.imageUrl?.trim()) || item.imageFile instanceof File, {
    message: 'Gallery image is required.',
    path: ['imageFile'],
  });

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  slug: z.string().min(1, 'Slug is required.'),
  shortDescription: z.string().min(1, 'Short description is required.'),
  longDescription: z.string().min(1, 'Long description is required.'),
  isPublished: z.boolean().default(false),
  thumbnailUrl: z.string().optional(),
  thumbnailFile: z.instanceof(File).optional().nullable(),
  introVideoUrl: z.string().optional(),
  introVideoFile: z.instanceof(File).optional().nullable(),
  gitHubUrl: z.string().optional(),
  projectUrl: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  gallery: z.array(galleryItemSchema).default([]),
});

type ProjectForm = z.infer<typeof projectSchema>;

const stepsConfig = (t: (key: string) => string) => [
  { id: 1, name: t('addProject_step1_name') },
  { id: 2, name: t('addProject_step2_name') },
  { id: 3, name: t('addProject_step3_name') },
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-\u0600-\u06FF]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'project';
}

function TechnologyChipInput({
  technologies,
  onChange,
  placeholder,
  addButtonLabel,
  removeLabel,
}: {
  technologies: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addButtonLabel: string;
  removeLabel: (item: string) => string;
}) {
  const [input, setInput] = React.useState('');

  const addItem = () => {
    const name = input.trim();
    if (!name) return;
    const exists = technologies.some((tech) => tech.toLowerCase() === name.toLowerCase());
    if (!exists) onChange([...technologies, name]);
    setInput('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <Button type="button" onClick={addItem}>
          {addButtonLabel}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {technologies.map((tech) => (
          <Badge key={tech} variant="secondary" className="py-1 text-base">
            {tech}
            <button
              type="button"
              onClick={() => onChange(technologies.filter((t) => t !== tech))}
              className="ml-2 rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">{removeLabel(tech)}</span>
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ThumbnailUpload({
  form,
  t,
}: {
  form: ReturnType<typeof useForm<ProjectForm>>;
  t: (key: string) => string;
}) {
  const thumbnailUrl = form.watch('thumbnailUrl');
  const thumbnailFile = form.watch('thumbnailFile');
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (thumbnailFile) {
      const url = URL.createObjectURL(thumbnailFile);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
    return undefined;
  }, [thumbnailFile]);

  const preview =
    objectUrl ??
    (thumbnailUrl?.startsWith('data:')
      ? thumbnailUrl
      : thumbnailUrl
        ? resolveStaticAssetUrl(thumbnailUrl)
        : undefined);

  return (
    <div>
      <Label htmlFor="project-thumbnail-upload" className="text-base font-medium">
        {t('addProject_thumbnail_label')}
      </Label>
      <p className="mb-2 text-sm text-muted-foreground">{t('addProject_thumbnail_description')}</p>
      <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
        <div className="text-center">
          {preview ? (
            <Image src={preview} alt="Thumbnail preview" width={200} height={112} className="mx-auto rounded-md" unoptimized />
          ) : (
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
          )}
          <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
            <Label
              htmlFor="project-thumbnail-upload"
              className="relative cursor-pointer rounded-md bg-background font-semibold text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            >
              <span>{t('upload_file')}</span>
              <Input
                id="project-thumbnail-upload"
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) form.setValue('thumbnailFile', file);
                }}
              />
            </Label>
            <p className="pl-1">{t('drag_and_drop')}</p>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">{t('image_upload_specs_full')}</p>
        </div>
      </div>
    </div>
  );
}

function IntroVideoUpload({
  form,
  t,
}: {
  form: ReturnType<typeof useForm<ProjectForm>>;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="introVideoUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('addProject_intro_video_url_label')}</FormLabel>
            <FormControl>
              <Input placeholder={t('addProject_intro_video_url_placeholder')} {...field} value={field.value ?? ''} />
            </FormControl>
            <FormDescription>{t('addProject_intro_video_url_description')}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <div>
        <Label htmlFor="project-intro-video-upload" className="text-base font-medium">
          {t('addProject_intro_video_file_label')}
        </Label>
        <p className="mb-2 text-sm text-muted-foreground">{t('addProject_intro_video_file_description')}</p>
        <Input
          id="project-intro-video-upload"
          type="file"
          accept="video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) form.setValue('introVideoFile', file);
          }}
        />
      </div>
    </div>
  );
}

function GallerySection({
  form,
  t,
}: {
  form: ReturnType<typeof useForm<ProjectForm>>;
  t: (key: string) => string;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'gallery',
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('addProject_gallery_title')}</h3>
          <p className="text-sm text-muted-foreground">{t('addProject_gallery_description')}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ title: '', shortDescription: '', imageUrl: '', imageFile: null })}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('addProject_gallery_add_item')}
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          {t('addProject_gallery_empty')}
        </p>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <GalleryItemRow key={field.id} form={form} index={index} onRemove={() => remove(index)} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryItemRow({
  form,
  index,
  onRemove,
  t,
}: {
  form: ReturnType<typeof useForm<ProjectForm>>;
  index: number;
  onRemove: () => void;
  t: (key: string) => string;
}) {
  const imageUrl = form.watch(`gallery.${index}.imageUrl`);
  const imageFile = form.watch(`gallery.${index}.imageFile`);
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
    return undefined;
  }, [imageFile]);

  const preview =
    objectUrl ??
    (imageUrl?.startsWith('data:')
      ? imageUrl
      : imageUrl
        ? resolveStaticAssetUrl(imageUrl)
        : undefined);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{t('addProject_gallery_item_title').replace('{index}', String(index + 1))}</h4>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <FormField
        control={form.control}
        name={`gallery.${index}.title`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('addProject_gallery_item_name_label')}</FormLabel>
            <FormControl>
              <Input placeholder={t('addProject_gallery_item_name_placeholder')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`gallery.${index}.shortDescription`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('addProject_gallery_item_desc_label')}</FormLabel>
            <FormControl>
              <Textarea placeholder={t('addProject_gallery_item_desc_placeholder')} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div>
        <Label className="text-sm font-medium">{t('addProject_gallery_item_image_label')}</Label>
        <div className="mt-2 flex items-center gap-4">
          {preview && (
            <Image src={preview} alt="" width={80} height={60} className="rounded object-cover" unoptimized />
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) form.setValue(`gallery.${index}.imageFile`, file);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function AddProjectModal({
  open,
  onOpenChangeAction,
  project,
  onSuccessAction,
}: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  project?: Project | null;
  onSuccessAction?: () => void;
}) {
  const { t } = useLanguage();
  const onOpenChange = onOpenChangeAction;
  const onSuccess = onSuccessAction;
  const steps = stepsConfig(t);
  const [currentStep, setCurrentStep] = React.useState(1);
  const [maxCompletedStep, setMaxCompletedStep] = React.useState(1);
  const [saving, setSaving] = React.useState(false);
  const [loadingEdit, setLoadingEdit] = React.useState(false);
  const { toast } = useToast();
  const isEditMode = !!project;

  const form = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      slug: '',
      shortDescription: '',
      longDescription: '',
      isPublished: false,
      thumbnailUrl: '',
      thumbnailFile: null,
      introVideoUrl: '',
      introVideoFile: null,
      gitHubUrl: '',
      projectUrl: '',
      technologies: [],
      tags: [],
      gallery: [],
    },
  });

  React.useEffect(() => {
    if (!open) return;

    if (isEditMode && project) {
      setLoadingEdit(true);
      getProjectById(project.id)
        .then((full) => {
          if (full) {
            form.reset({
              title: full.title ?? project.title ?? '',
              slug: full.slug ?? project.slug ?? '',
              shortDescription: full.shortDescription ?? project.shortDescription ?? '',
              longDescription: full.longDescription ?? project.longDescription ?? '',
              isPublished: Boolean(full.isPublished ?? project.status === 'Published'),
              thumbnailUrl: full.thumbnailUrl ?? project.thumbnailUrl ?? '',
              thumbnailFile: null,
              introVideoUrl: full.introVideoUrl ?? project.introVideoUrl ?? '',
              introVideoFile: null,
              gitHubUrl: full.gitHubUrl ?? project.gitHubUrl ?? '',
              projectUrl: full.projectUrl ?? project.projectUrl ?? '',
              technologies: full.technologies ?? project.technologies ?? [],
              tags: full.tags ?? project.tags ?? [],
              gallery: (full.gallery ?? project.gallery ?? []).map((item) => ({
                title: item.title,
                shortDescription: item.shortDescription,
                imageUrl: item.imageUrl,
                imageFile: null,
              })),
            });
          } else {
            form.reset({
              title: project.title ?? '',
              slug: project.slug ?? '',
              shortDescription: project.shortDescription ?? '',
              longDescription: project.longDescription ?? '',
              isPublished: project.status === 'Published',
              thumbnailUrl: project.thumbnailUrl ?? '',
              thumbnailFile: null,
              introVideoUrl: project.introVideoUrl ?? '',
              introVideoFile: null,
              gitHubUrl: project.gitHubUrl ?? '',
              projectUrl: project.projectUrl ?? '',
              technologies: project.technologies ?? [],
              tags: project.tags ?? [],
              gallery: (project.gallery ?? []).map((item) => ({
                title: item.title,
                shortDescription: item.shortDescription,
                imageUrl: item.imageUrl,
                imageFile: null,
              })),
            });
          }
          setMaxCompletedStep(steps.length);
        })
        .catch(() => {
          form.reset({
            title: project.title ?? '',
            slug: project.slug ?? '',
            shortDescription: project.shortDescription ?? '',
            longDescription: project.longDescription ?? '',
            isPublished: project.status === 'Published',
            thumbnailUrl: project.thumbnailUrl ?? '',
            thumbnailFile: null,
            introVideoUrl: project.introVideoUrl ?? '',
            introVideoFile: null,
            gitHubUrl: project.gitHubUrl ?? '',
            projectUrl: project.projectUrl ?? '',
            technologies: project.technologies ?? [],
            tags: project.tags ?? [],
            gallery: (project.gallery ?? []).map((item) => ({
              title: item.title,
              shortDescription: item.shortDescription,
              imageUrl: item.imageUrl,
              imageFile: null,
            })),
          });
        })
        .finally(() => setLoadingEdit(false));
    } else {
      form.reset({
        title: '',
        slug: '',
        shortDescription: '',
        longDescription: '',
        isPublished: false,
        thumbnailUrl: '',
        thumbnailFile: null,
        introVideoUrl: '',
        introVideoFile: null,
        gitHubUrl: '',
        projectUrl: '',
        technologies: [],
        tags: [],
        gallery: [],
      });
      setCurrentStep(1);
      setMaxCompletedStep(1);
    }
  }, [open, isEditMode, project, form, steps.length]);

  const titleValue = form.watch('title');
  React.useEffect(() => {
    if (!isEditMode && titleValue && !form.getValues('slug')) {
      form.setValue('slug', slugify(titleValue));
    }
  }, [titleValue, isEditMode, form]);

  const handleStepClick = (step: number) => {
    if (step <= maxCompletedStep) setCurrentStep(step);
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await form.trigger(['title', 'slug', 'shortDescription', 'longDescription']);
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
      if (nextStep > maxCompletedStep) setMaxCompletedStep(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const buildGalleryJson = async (gallery: ProjectForm['gallery']) => {
    const items = await Promise.all(
      gallery.map(async (item, index) => {
        let imageUrl = item.imageUrl ?? '';
        if (item.imageFile) {
          imageUrl = await uploadProjectGalleryImage(item.imageFile);
        }
        return {
          title: item.title,
          shortDescription: item.shortDescription,
          imageUrl,
          sortOrder: index,
        };
      })
    );
    return JSON.stringify(
      items.filter((item) => Boolean(item.imageUrl?.trim()))
    );
  };

  const handleSave = async (values: ProjectForm) => {
    if (currentStep < steps.length) {
      await handleNext();
      return;
    }

    setSaving(true);
    try {
      const slug = values.slug || slugify(values.title);
      let introVideoUrl = values.introVideoUrl?.trim() || '';
      if (values.introVideoFile) {
        introVideoUrl = await uploadProjectIntroVideo(values.introVideoFile);
      }
      const galleryJson = await buildGalleryJson(values.gallery);
      const technologiesJson = JSON.stringify(values.technologies);
      const tagsJson = JSON.stringify(values.tags);

      if (isEditMode && project) {
        let thumbnailUrl = values.thumbnailUrl || null;
        if (values.thumbnailFile) {
          thumbnailUrl = await uploadProjectThumbnail(values.thumbnailFile);
        } else if (thumbnailUrl && (thumbnailUrl.startsWith('data:') || thumbnailUrl.length > 500)) {
          thumbnailUrl = null;
        }
        await updateProjectApi({
          id: Number(project.id),
          title: values.title,
          slug,
          shortDescription: values.shortDescription,
          longDescription: values.longDescription,
          thumbnailUrl,
          introVideoUrl: introVideoUrl || null,
          gitHubUrl: values.gitHubUrl?.trim() || null,
          projectUrl: values.projectUrl?.trim() || null,
          technologiesJson,
          galleryJson,
          tagsJson,
          isPublished: values.isPublished,
        });
        toast({
          title: t('editProject_toast_success_title'),
          description: t('editProject_toast_success_description'),
        });
      } else {
        await addProjectApi({
          title: values.title,
          slug,
          shortDescription: values.shortDescription,
          longDescription: values.longDescription,
          thumbnailFile: values.thumbnailFile ?? null,
          introVideoUrl: introVideoUrl || undefined,
          gitHubUrl: values.gitHubUrl?.trim() || undefined,
          projectUrl: values.projectUrl?.trim() || undefined,
          technologiesJson,
          galleryJson,
          tagsJson,
          isPublished: values.isPublished,
        });
        toast({
          title: t('addProject_toast_success_title'),
          description: t('addProject_toast_success_description'),
        });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('error_save_project') || 'Failed to save project.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {loadingEdit && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('editProject_title') : t('addProject_title')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('editProject_description') : t('addProject_description')}
          </DialogDescription>
        </DialogHeader>

        <div className="-mr-6 overflow-y-auto py-4 pr-6">
          <div className="mb-8 ml-3 flex items-start justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={cn(
                    'flex flex-col items-center text-center',
                    step.id <= maxCompletedStep ? 'cursor-pointer' : 'cursor-default'
                  )}
                  onClick={() => handleStepClick(step.id)}
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
                </div>
                {index < steps.length - 1 && <div className="mx-2 mt-5 h-px flex-1 bg-border sm:mx-4" />}
              </React.Fragment>
            ))}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="ml-3 space-y-6">
              {currentStep === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addProject_title_label')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('addProject_title_placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addProject_slug_label')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('addProject_slug_placeholder')} {...field} dir="ltr" />
                        </FormControl>
                        <FormDescription>{t('addProject_slug_description')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shortDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addProject_short_description_label')}</FormLabel>
                        <FormControl>
                          <Textarea placeholder={t('addProject_short_description_placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="longDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addProject_long_description_label')}</FormLabel>
                        <FormControl>
                          <CustomRichTextEditor
                            content={field.value ?? ''}
                            onChangeAction={field.onChange}
                            placeholder={t('addProject_long_description_placeholder')}
                          />
                        </FormControl>
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
                          <FormLabel>{t('project_publish_label')}</FormLabel>
                          <FormDescription>{t('project_publish_description')}</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}

              {currentStep === 2 && (
                <div className="space-y-8">
                  <ThumbnailUpload form={form} t={t} />
                  <IntroVideoUpload form={form} t={t} />
                  <FormField
                    control={form.control}
                    name="gitHubUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addProject_github_url_label')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('addProject_github_url_placeholder')} {...field} value={field.value ?? ''} dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="projectUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addProject_project_url_label')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('addProject_project_url_placeholder')} {...field} value={field.value ?? ''} dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{t('addProject_technologies_title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('addProject_technologies_description')}</p>
                    <TechnologyChipInput
                      technologies={form.watch('technologies')}
                      onChange={(items) => form.setValue('technologies', items)}
                      placeholder={t('addProject_technologies_placeholder')}
                      addButtonLabel={t('addProject_technologies_add_button')}
                      removeLabel={(tech) => t('remove_technology').replace('{tech}', tech)}
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{t('addProject_tags_title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('addProject_tags_description')}</p>
                    <TagSuggestionInput
                      tags={form.watch('tags')}
                      onTagsChange={(tags) => form.setValue('tags', tags)}
                      placeholder={t('addProject_tags_placeholder')}
                      addButtonLabel={t('addProject_tags_add_button')}
                      hint={t('tag_suggestions_hint')}
                      removeLabel={(tag) => t('remove_tag').replace('{tag}', tag)}
                    />
                  </div>
                  <GallerySection form={form} t={t} />
                </div>
              )}

              <DialogFooter className="mt-auto border-t pt-4">
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
                      : t('save_project_button')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
