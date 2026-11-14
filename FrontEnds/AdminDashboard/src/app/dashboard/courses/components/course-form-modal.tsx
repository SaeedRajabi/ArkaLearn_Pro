
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
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
import { UploadCloud, FileVideo, FileText, Plus, Trash2, GripVertical, PlayCircle, Loader2, ChevronDown, Link2, ExternalLink } from 'lucide-react';
import { CustomRichTextEditor } from '@/components/ui/custom-rich-text-editor';
import { useLanguage } from '@/components/language-provider';
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/lib/store';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { Course, FAQ, Section, Lesson } from '@/lib/types';
import { Combobox } from '@/components/ui/combobox';
import { toSameOriginAssetSrc } from '@/lib/apiClient';
import { TagSuggestionInput } from '@/components/tags/tag-suggestion-input';
import { updateCourses } from '@/services/course-service';
import { LocalizedDateTimePicker } from '@/components/ui/localized-date-time-picker';
import { SeoSettingsSection, type SeoSettingsValue } from '@/components/media/SeoSettingsSection';
import { MediaPickerDialog } from '@/components/media/MediaPickerDialog';
import {
  createEmptyCourseFormDefaults,
  mapCourseToFormDefaults,
} from '@/lib/course-form-mappers';
import {
  canEditLifecycleSchedule,
  canToggleLessonPublish,
  canUploadLessonVideos,
  lifecyclePhaseHintKey,
} from '@/lib/course-lifecycle-ui';
import {
  buildCourseInstallmentPlanRows,
  COURSE_INSTALLMENT_COUNTS,
  installmentPlansSum,
} from '@/lib/course-installment-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { uploadMediaAsset } from '@/services/media-api.service';
import { getMediaUploadSettings } from '@/services/media-upload-settings-api.service';
import { isValidLongId } from '@/lib/id';
import {
  COURSE_MATERIAL_ACCEPT,
  deleteCourseCurriculumMaterial,
  listCourseCurriculumMaterials,
  uploadAndAttachCourseMaterial,
  type CourseCurriculumMaterial,
} from '@/services/course-material-service';

function formatDurationLabel(seconds?: number) {
  if (!seconds || seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${secs}s`;
}

async function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : 0);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}

async function readVideoDurationFromUrl(url: string): Promise<number> {
  const src = toSameOriginAssetSrc(url) || url;
  if (!src || src.toLowerCase().startsWith('drm://')) return 0;
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : 0);
    };
    video.onerror = () => resolve(0);
    video.src = src;
  });
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function extractYoutubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const videoId = parsed.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      const parts = parsed.pathname.split('/').filter(Boolean);
      const embedIndex = parts.indexOf('embed');
      if (embedIndex >= 0 && parts[embedIndex + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIndex + 1]}`;
      }
      const shortsIndex = parts.indexOf('shorts');
      if (shortsIndex >= 0 && parts[shortsIndex + 1]) {
        return `https://www.youtube.com/embed/${parts[shortsIndex + 1]}`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url.trim());
}

function resolveLessonVideoPreviewSrc(url?: string): string | null {
  if (!url?.trim()) return null;
  return toSameOriginAssetSrc(url.trim()) ?? url.trim();
}

function LessonVideoPreview({ url }: { url: string }) {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const youtubeEmbed = extractYoutubeEmbedUrl(trimmed);
  if (youtubeEmbed) {
    return (
      <div className="overflow-hidden rounded-md border bg-black">
        <iframe
          src={youtubeEmbed}
          title="Lesson video preview"
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const previewSrc = resolveLessonVideoPreviewSrc(trimmed);
  if (previewSrc && (isDirectVideoUrl(trimmed) || previewSrc.startsWith('/') || previewSrc.startsWith('blob:'))) {
    return (
      <video
        src={previewSrc}
        controls
        preload="metadata"
        className="max-h-48 w-full rounded-md border bg-black"
      />
    );
  }

  return (
    <a
      href={trimmed}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline break-all"
    >
      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      {trimmed}
    </a>
  );
}

function LessonFileVideoPreview({ file }: { file: File }) {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!objectUrl) return null;

  return (
    <video
      src={objectUrl}
      controls
      preload="metadata"
      className="max-h-40 w-full rounded-md border bg-black"
    />
  );
}

const stepsConfig = (t: (key: string) => string) => [
  { id: 1, name: t('addCourse_step1_name') },
  { id: 2, name: t('addCourse_step2_name') },
  { id: 3, name: t('addCourse_step3_name') },
  { id: 4, name: t('addCourse_step4_name') },
];

const createCourseDetailsSchema = (t: (key: string) => string) => z.object({
  title: z.string().min(1, t('validation_title_required')),
  description: z.string().min(1, t('validation_description_required')),
  shortDescription: z.string().min(1, t('validation_short_description_required')),
  category: z.string().min(1, t('validation_category_required')),
  level: z.string().min(1, t('validation_level_required')),
  language: z.string().min(1, t('validation_language_required')),
  price: z.coerce.number().min(0, t('validation_price_nonnegative')),
  originalPrice: z.coerce.number().min(0).default(0),
  isSpecial: z.boolean().default(false),
  specialDetails: z.string().optional(),
  tags: z.array(z.string()).default([]),
  prerequisites: z.string().optional(),
  faqs: z.array(z.object({
    id: z.string(),
    question: z.string(),
    answer: z.string(),
  })).default([]),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    lessons: z.array(z.object({
      id: z.string(),
      title: z.string(),
      videoTitle: z.string().optional(),
      videoUrl: z.string().optional(),
      durationSeconds: z.number().optional(),
      hasVideo: z.boolean().optional(),
      videoFile: z.any().optional(),
      mediaAssetId: z.union([z.string(), z.number()]).optional(),
      removeVideo: z.boolean().optional(),
      isPublished: z.boolean().optional(),
    })),
  })).default([]),
    thumbnailUrl: z.any().optional(),
    videoUrl: z.any().optional(),
  degreeRequired: z.boolean().default(false),
  deliveryMode: z.enum(['directDownload', 'desktopLicense']).default('directDownload'),
  lifecyclePhase: z.enum(['notStarted', 'inProgress', 'ended']).default('notStarted'),
  registrationDeadlineUtc: z.date().optional(),
  courseStartUtc: z.date().optional(),
  courseEndUtc: z.date().optional(),
  registrationClosed: z.boolean().default(false),
  status: z.enum(['Draft', 'Published']).default('Draft'),
  paymentType: z.enum(['cash', 'installment']).default('cash'),
  installmentPlans: z
    .array(
      z.object({
        installmentNumber: z.number().int().min(1).max(6),
        amountToman: z.coerce.number().min(1, t('validation_amount_positive')),
        dueDateUtc: z.date().optional().nullable(),
      })
    )
    .default([]),
}).superRefine((data, ctx) => {
  if (data.originalPrice > 0) {
    if (data.price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Sale price is required when original price is set.',
        path: ['originalPrice'],
      });
    } else if (data.originalPrice <= data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Original price must be greater than sale price.',
        path: ['originalPrice'],
      });
    }
  }
  if (data.paymentType === 'installment') {
    const plans = data.installmentPlans ?? [];
    if (plans.length < 2 || plans.length > 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Installment count must be between 2 and 6.',
        path: ['installmentPlans'],
      });
    }
    const sum = installmentPlansSum(plans);
    if (Math.abs(sum - Number(data.price || 0)) > 0.5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Sum of installment amounts must equal the course price.',
        path: ['installmentPlans'],
      });
    }
    plans.forEach((plan, index) => {
      if (plan.installmentNumber > 1 && !plan.dueDateUtc) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Due date is required.',
          path: ['installmentPlans', index, 'dueDateUtc'],
        });
      }
    });
  }
});

type CourseDetailsForm = z.infer<ReturnType<typeof createCourseDetailsSchema>>;

function CourseSessions({ form, courseId }: { form: any; courseId?: string | null }) {
  const { t, direction } = useLanguage();
  const { toast } = useToast();
  const sections = form.watch('sections') as Section[];
  const deliveryMode = form.watch('deliveryMode') as 'directDownload' | 'desktopLicense';
  const lifecyclePhase = form.watch('lifecyclePhase') as 'notStarted' | 'inProgress' | 'ended';
  const canUploadVideos = canUploadLessonVideos(deliveryMode, lifecyclePhase);
  const lifecycleHintKey = lifecyclePhaseHintKey(deliveryMode, lifecyclePhase);
  const [newSectionTitle, setNewSectionTitle] = React.useState('');
  const [collapsedSections, setCollapsedSections] = React.useState<Set<string>>(() => new Set());
  const [collapsedLessons, setCollapsedLessons] = React.useState<Set<string>>(() => new Set());
  const [lessonVideoModes, setLessonVideoModes] = React.useState<Record<string, 'upload' | 'url'>>({});
  const [lessonUrlErrors, setLessonUrlErrors] = React.useState<Record<string, string>>({});
  const [lessonUploadProgress, setLessonUploadProgress] = React.useState<Record<string, number>>({});
  const [lessonUploadingId, setLessonUploadingId] = React.useState<string | null>(null);
  const [materials, setMaterials] = React.useState<CourseCurriculumMaterial[]>([]);
  const [materialUploadProgress, setMaterialUploadProgress] = React.useState<Record<string, number>>({});
  const [materialDeletingId, setMaterialDeletingId] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<
    | { type: 'section'; sectionId: string; title: string }
    | { type: 'lesson'; sectionId: string; lessonId: string; title: string }
    | null
  >(null);
  const canManageMaterials = Boolean(courseId && isValidLongId(courseId) && canUploadVideos);

  const loadMaterials = React.useCallback(async () => {
    if (!courseId || !isValidLongId(courseId)) {
      setMaterials([]);
      return;
    }
    try {
      setMaterials(await listCourseCurriculumMaterials(courseId));
    } catch (error) {
      console.error('Course materials load failed:', error);
      toast({ title: t('addCourse_materials_load_failed'), variant: 'destructive' });
    }
  }, [courseId, t, toast]);

  React.useEffect(() => {
    if (canManageMaterials) void loadMaterials();
    else setMaterials([]);
  }, [canManageMaterials, loadMaterials]);

  const handleMaterialUpload = async (
    sectionId: string,
    lessonId: string | null,
    files: FileList | null
  ) => {
    if (!courseId || !isValidLongId(courseId) || !isValidLongId(sectionId) || !files?.length) return;
    if (lessonId && !isValidLongId(lessonId)) return;

    const targetKey = lessonId ? `lesson-${lessonId}` : `section-${sectionId}`;
    const selectedFiles = Array.from(files);
    setMaterialUploadProgress((prev) => ({ ...prev, [targetKey]: 0 }));
    try {
      for (let index = 0; index < selectedFiles.length; index += 1) {
        await uploadAndAttachCourseMaterial(
          {
            courseId,
            courseSectionId: sectionId,
            courseLessonId: lessonId,
            file: selectedFiles[index],
            encryptForDesktop: deliveryMode === 'desktopLicense',
          },
          (percent) =>
            setMaterialUploadProgress((prev) => ({
              ...prev,
              [targetKey]: Math.round(((index + percent / 100) / selectedFiles.length) * 100),
            }))
        );
      }
      await loadMaterials();
      toast({ title: t('addCourse_materials_uploaded') });
    } catch (error) {
      console.error('Course material upload failed:', error);
      toast({ title: t('addCourse_materials_upload_failed'), variant: 'destructive' });
    } finally {
      setMaterialUploadProgress((prev) => {
        const next = { ...prev };
        delete next[targetKey];
        return next;
      });
    }
  };

  const handleMaterialDelete = async (materialId: string) => {
    setMaterialDeletingId(materialId);
    try {
      await deleteCourseCurriculumMaterial(materialId);
      setMaterials((prev) => prev.filter((material) => material.id !== materialId));
      toast({ title: t('addCourse_material_deleted') });
    } catch (error) {
      console.error('Course material delete failed:', error);
      toast({ title: t('addCourse_material_delete_failed'), variant: 'destructive' });
    } finally {
      setMaterialDeletingId(null);
    }
  };

  const renderMaterials = (sectionId: string, lessonId: string | null = null) => {
    const persisted = isValidLongId(sectionId) && (!lessonId || isValidLongId(lessonId));
    const targetKey = lessonId ? `lesson-${lessonId}` : `section-${sectionId}`;
    const targetMaterials = materials.filter(
      (material) =>
        String(material.courseSectionId) === String(sectionId) &&
        (lessonId
          ? String(material.courseLessonId) === String(lessonId)
          : material.courseLessonId == null || material.courseLessonId === '')
    );
    const progress = materialUploadProgress[targetKey];
    const inputId = `course-material-${targetKey}`;

    return (
      <div className="space-y-2 rounded-md border border-dashed bg-muted/20 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-medium">{t('addCourse_materials_title')}</Label>
          <span className="text-xs text-muted-foreground">
            {t('addCourse_materials_files_count', { count: targetMaterials.length })}
          </span>
        </div>
        {targetMaterials.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('addCourse_materials_empty')}</p>
        ) : (
          <div className="space-y-1">
            {targetMaterials.map((material) => (
              <div key={material.id} className="flex items-center gap-2 rounded border bg-background px-2 py-1">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-xs">
                  {material.displayName || material.originalFileName}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                  disabled={materialDeletingId === material.id}
                  onClick={() => void handleMaterialDelete(material.id)}
                  aria-label={t('addCourse_material_delete')}
                >
                  {materialDeletingId === material.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
        {persisted ? (
          <>
            <Label htmlFor={inputId} className="inline-block cursor-pointer">
              <Button type="button" variant="outline" size="sm" asChild disabled={progress !== undefined}>
                <span>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {t('addCourse_materials_upload')}
                </span>
              </Button>
            </Label>
            <Input
              id={inputId}
              type="file"
              multiple
              accept={COURSE_MATERIAL_ACCEPT}
              className="hidden"
              disabled={progress !== undefined}
              onChange={(event) => {
                void handleMaterialUpload(sectionId, lessonId, event.target.files);
                event.currentTarget.value = '';
              }}
            />
            {progress !== undefined ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {deliveryMode === 'desktopLicense'
                      ? t('addCourse_materials_encrypting_upload')
                      : t('addCourse_materials_uploading')}
                  </span>
                  <span className="tabular-nums">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{t('addCourse_materials_save_first')}</p>
        )}
      </div>
    );
  };

  const isSectionExpanded = (sectionId: string) => !collapsedSections.has(sectionId);
  const isLessonExpanded = (lessonId: string) => !collapsedLessons.has(lessonId);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const toggleLesson = (lessonId: string) => {
    setCollapsedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  const getLessonVideoMode = (lesson: Lesson): 'upload' | 'url' => {
    if (lessonVideoModes[lesson.id]) return lessonVideoModes[lesson.id];
    if (lesson.videoFile) return 'upload';
    if (lesson.videoUrl && /^https?:\/\//i.test(lesson.videoUrl)) return 'url';
    return 'upload';
  };

  const setLessonVideoMode = (lessonId: string, mode: 'upload' | 'url') => {
    setLessonVideoModes((prev) => ({ ...prev, [lessonId]: mode }));
  };

  const setSections = (newSections: Section[]) => {
    form.setValue('sections', newSections);
  };

  const courseVideoLibrary = React.useMemo(
    () =>
      sections.flatMap((section) =>
        section.lessons
          .filter((lesson) => !lesson.removeVideo && Boolean(lesson.videoUrl || lesson.hasVideo || lesson.videoFile))
          .map((lesson) => ({
            key: `${section.id}:${lesson.id}`,
            sectionTitle: section.title,
            lessonTitle: lesson.title,
            videoUrl: lesson.videoUrl,
            videoTitle: lesson.videoTitle ?? lesson.title,
            durationSeconds: lesson.durationSeconds ?? 0,
          }))
      ),
    [sections]
  );

  const assignExistingVideo = (targetSectionId: string, targetLessonId: string, sourceKey: string) => {
    const source = courseVideoLibrary.find((item) => item.key === sourceKey);
    if (!source?.videoUrl) return;
    setLessonVideoMode(targetLessonId, 'url');
    updateLesson(targetSectionId, targetLessonId, {
      videoUrl: source.videoUrl,
      videoFile: undefined,
      hasVideo: true,
      removeVideo: false,
      videoTitle: source.videoTitle,
      durationSeconds: source.durationSeconds,
    });
  };

  const addSection = () => {
    if (newSectionTitle.trim() === '') return;
    setSections([
      ...sections,
      {
        id: `section-${Date.now()}`,
        title: newSectionTitle,
        lessons: [],
      },
    ]);
    setNewSectionTitle('');
  };

  const addLesson = (sectionId: string, lessonTitle: string) => {
    if (lessonTitle.trim() === '') return;
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lessons: [
                ...section.lessons,
                { id: `lesson-${Date.now()}`, title: lessonTitle },
              ],
            }
          : section
      )
    );
  };
  
  const updateSection = (sectionId: string, patch: Partial<Section>) => {
    setSections(
      sections.map((section) => (section.id === sectionId ? { ...section, ...patch } : section))
    );
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter((section) => section.id !== sectionId));
  };

  const requestRemoveSection = (sectionId: string, title: string) => {
    setPendingDelete({ type: 'section', sectionId, title });
  };

  const updateLesson = (sectionId: string, lessonId: string, patch: Partial<Section['lessons'][number]>) => {
    setSections(sections.map((section) => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        lessons: section.lessons.map((lesson) =>
          lesson.id === lessonId ? { ...lesson, ...patch } : lesson
        ),
      };
    }));
  };

  const updateLessonTitle = (sectionId: string, lessonId: string, title: string) => {
    const lesson = sections.flatMap((s) => s.lessons).find((l) => l.id === lessonId);
    const patch: Partial<Lesson> = { title };
    if (lesson && (!lesson.videoTitle || lesson.videoTitle === lesson.title)) {
      patch.videoTitle = title;
    }
    updateLesson(sectionId, lessonId, patch);
  };

  const handleLessonVideoChange = async (sectionId: string, lessonId: string, file?: File) => {
    if (!file) return;
    const durationSeconds = await readVideoDuration(file);
    const lesson = sections.flatMap((s) => s.lessons).find((l) => l.id === lessonId);
    setLessonVideoMode(lessonId, 'upload');
    setLessonUploadingId(lessonId);
    setLessonUploadProgress((prev) => ({ ...prev, [lessonId]: 0 }));
    try {
      const encryptForDesktop = deliveryMode === 'desktopLicense';
      const uploaded = await uploadMediaAsset(
        {
          file,
          title: lesson?.videoTitle || lesson?.title || file.name,
          encryptForDesktop,
        },
        (percent) => setLessonUploadProgress((prev) => ({ ...prev, [lessonId]: percent }))
      );
      updateLesson(sectionId, lessonId, {
        videoFile: undefined,
        videoUrl: encryptForDesktop ? `drm://media/${uploaded.id}` : uploaded.fileUrl || undefined,
        mediaAssetId: encryptForDesktop ? uploaded.id : undefined,
        durationSeconds,
        hasVideo: true,
        removeVideo: false,
        videoTitle: lesson?.videoTitle || lesson?.title || file.name.replace(/\.[^.]+$/, ''),
      });
      toast({ title: t('addCourse_video_uploaded') || 'Video uploaded' });
    } catch (error) {
      console.error('Lesson video upload failed:', error);
      toast({
        title: t('addCourse_video_upload_failed'),
        variant: 'destructive',
      });
    } finally {
      setLessonUploadingId(null);
      setLessonUploadProgress((prev) => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      });
    }
  };

  const handleLessonVideoUrlChange = (sectionId: string, lessonId: string, rawUrl: string) => {
    const url = rawUrl.trim();
    if (!url) {
      setLessonUrlErrors((prev) => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      });
      updateLesson(sectionId, lessonId, {
        videoUrl: undefined,
        videoFile: undefined,
        hasVideo: false,
        removeVideo: true,
      });
      return;
    }

    if (!isValidHttpUrl(url)) {
      setLessonUrlErrors((prev) => ({ ...prev, [lessonId]: t('addCourse_lesson_video_url_invalid') }));
      return;
    }

    setLessonUrlErrors((prev) => {
      const next = { ...prev };
      delete next[lessonId];
      return next;
    });
    setLessonVideoMode(lessonId, 'url');
    const lesson = sections.flatMap((s) => s.lessons).find((l) => l.id === lessonId);
    updateLesson(sectionId, lessonId, {
      videoUrl: url,
      videoFile: undefined,
      hasVideo: true,
      removeVideo: false,
      videoTitle: lesson?.videoTitle || lesson?.title,
    });
  };

  const clearLessonVideo = (sectionId: string, lessonId: string) => {
    setLessonUrlErrors((prev) => {
      const next = { ...prev };
      delete next[lessonId];
      return next;
    });
    updateLesson(sectionId, lessonId, {
      videoFile: undefined,
      videoUrl: undefined,
      durationSeconds: 0,
      hasVideo: false,
      removeVideo: true,
      videoTitle: undefined,
    });
  };

  const removeLesson = (sectionId: string, lessonId: string) => {
    setSections(sections.map(section => {
        if(section.id === sectionId) {
            return {
                ...section,
                lessons: section.lessons.filter(lesson => lesson.id !== lessonId)
            }
        }
        return section;
    }));
  };

  const requestRemoveLesson = (sectionId: string, lessonId: string, title: string) => {
    setPendingDelete({ type: 'lesson', sectionId, lessonId, title });
  };

  const confirmPendingDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'section') {
      removeSection(pendingDelete.sectionId);
    } else {
      removeLesson(pendingDelete.sectionId, pendingDelete.lessonId);
    }
    setPendingDelete(null);
  };
  
  const onDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;

    if (!destination) return;

    if (type === 'SECTIONS') {
        const newSections = Array.from(sections);
        const [reorderedItem] = newSections.splice(source.index, 1);
        newSections.splice(destination.index, 0, reorderedItem);
        setSections(newSections);
    } else { 
        const sourceSectionIndex = sections.findIndex(s => `droppable-${s.id}` === source.droppableId);
        const destSectionIndex = sections.findIndex(s => `droppable-${s.id}` === destination.droppableId);

        const newSections = Array.from(sections);
        const sourceSection = newSections[sourceSectionIndex];
        const destSection = newSections[destSectionIndex];
        
        if (sourceSectionIndex === destSectionIndex) {
            const newLessons = Array.from(sourceSection.lessons);
            const [reorderedItem] = newLessons.splice(source.index, 1);
            newLessons.splice(destination.index, 0, reorderedItem);
            newSections[sourceSectionIndex] = { ...sourceSection, lessons: newLessons };
            setSections(newSections);
        } else {
            const sourceLessons = Array.from(sourceSection.lessons);
            const [movedItem] = sourceLessons.splice(source.index, 1);
            
            const destLessons = Array.from(destSection.lessons);
            destLessons.splice(destination.index, 0, movedItem);

            newSections[sourceSectionIndex] = { ...sourceSection, lessons: sourceLessons };
            newSections[destSectionIndex] = { ...destSection, lessons: destLessons };
            setSections(newSections);
        }
    }
  };


  const LessonInput = ({ sectionId }: { sectionId: string }) => {
    const [title, setTitle] = React.useState('');
    const handleAdd = () => {
        addLesson(sectionId, title);
        setTitle('');
    }
    return (
      <div className="flex gap-2 items-center pl-8 pr-2 py-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={t('addCourse_new_lesson_placeholder')}
          className="h-9"
        />
        <Button size="sm" onClick={handleAdd} type="button">{t('addCourse_add_lesson_button')}</Button>
      </div>
    );
  };
  
  return (
    <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('addCourse_content_title')}</h3>
            <p className="rounded-md border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground">
              {t(lifecycleHintKey)}
            </p>
            {courseVideoLibrary.length > 0 && canUploadVideos && (
              <div className="space-y-2 rounded-md border bg-muted/40 p-3">
                <p className="text-sm font-medium">{t('addCourse_course_video_library')}</p>
                <ul className="max-h-36 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {courseVideoLibrary.map((item) => (
                    <li key={item.key} className="flex items-center gap-2">
                      <PlayCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">
                        {item.sectionTitle} — {item.lessonTitle}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2">
                <Input 
                    placeholder={t('addCourse_new_section_placeholder')}
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSection()}
                />
                <Button onClick={addSection} type="button"><Plus className="mr-2 h-4 w-4" /> {t('addCourse_add_section_button')}</Button>
            </div>
            
            <Droppable droppableId="all-sections" type="SECTIONS">
                {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {sections.map((section, index) => (
                            <Draggable key={section.id} draggableId={section.id} index={index}>
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps} className="rounded-md border bg-card">
                                        <div className="flex items-center gap-1 border-b bg-muted px-1 py-1 rounded-t-md">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0"
                                                onClick={() => toggleSection(section.id)}
                                                aria-label={isSectionExpanded(section.id) ? t('addCourse_section_collapse') : t('addCourse_section_expand')}
                                            >
                                                <ChevronDown
                                                    className={cn(
                                                        'h-4 w-4 transition-transform duration-200',
                                                        !isSectionExpanded(section.id) && (direction === 'rtl' ? 'rotate-90' : '-rotate-90')
                                                    )}
                                                />
                                            </Button>
                                            <div {...provided.dragHandleProps} className="flex min-w-0 flex-1 cursor-grab items-center gap-2">
                                                <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground mx-1" />
                                                <Input
                                                  value={section.title}
                                                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                                  onPointerDown={(e) => e.stopPropagation()}
                                                  placeholder={t('addCourse_section_title_placeholder')}
                                                  className="h-9 flex-1 border-transparent bg-transparent font-medium shadow-none focus-visible:border-input focus-visible:bg-background"
                                                />
                                            </div>
                                            <Button variant="ghost" size="icon" type="button" onClick={() => requestRemoveSection(section.id, section.title)} className="text-destructive hover:text-destructive shrink-0">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {isSectionExpanded(section.id) && (
                                        <Droppable droppableId={`droppable-${section.id}`} type="LESSONS">
                                            {(provided) => (
                                                <div {...provided.droppableProps} ref={provided.innerRef} className="p-0">
                                                    {canManageMaterials && (
                                                      <div className="border-b p-2">
                                                        {renderMaterials(section.id)}
                                                      </div>
                                                    )}
                                                    <div className="py-2 space-y-1">
                                                        {section.lessons.map((lesson, lessonIndex) => {
                                                            const videoMode = getLessonVideoMode(lesson);
                                                            const hasAttachedVideo =
                                                              !lesson.removeVideo &&
                                                              Boolean(lesson.videoFile || lesson.hasVideo || lesson.videoUrl || lesson.mediaAssetId);

                                                            return (
                                                            <Draggable key={lesson.id} draggableId={lesson.id} index={lessonIndex}>
                                                                {(provided) => (
                                                                    <div ref={provided.innerRef} {...provided.draggableProps} className="mx-2 my-1 rounded-md border bg-background">
                                                                        <div className="flex items-center gap-1 pl-1 pr-1 py-1">
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 shrink-0"
                                                                                onClick={() => toggleLesson(lesson.id)}
                                                                                aria-label={isLessonExpanded(lesson.id) ? t('addCourse_lesson_collapse') : t('addCourse_lesson_expand')}
                                                                            >
                                                                                <ChevronDown
                                                                                    className={cn(
                                                                                        'h-4 w-4 transition-transform duration-200',
                                                                                        !isLessonExpanded(lesson.id) && (direction === 'rtl' ? 'rotate-90' : '-rotate-90')
                                                                                    )}
                                                                                />
                                                                            </Button>
                                                                            <div {...provided.dragHandleProps} className="flex min-w-0 flex-1 cursor-grab items-center gap-2">
                                                                                <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground mx-1" />
                                                                                <PlayCircle className="h-5 w-5 shrink-0 text-primary mx-1" />
                                                                                <Input
                                                                                  value={lesson.title}
                                                                                  onChange={(e) => updateLessonTitle(section.id, lesson.id, e.target.value)}
                                                                                  onPointerDown={(e) => e.stopPropagation()}
                                                                                  placeholder={t('addCourse_lesson_title_placeholder')}
                                                                                  className="h-8 flex-1 border-transparent bg-transparent font-medium shadow-none focus-visible:border-input focus-visible:bg-background"
                                                                                />
                                                                            </div>
                                                                            <Button variant="ghost" size="icon" type="button" onClick={() => requestRemoveLesson(section.id, lesson.id, lesson.title)} className="text-destructive hover:text-destructive shrink-0">
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                        {isLessonExpanded(lesson.id) && (
                                                                        <div className="space-y-3 border-t px-3 py-3 ps-10">
                                                                            {canUploadVideos ? (
                                                                            <>
                                                                            {courseVideoLibrary.length > 0 && deliveryMode !== 'desktopLicense' && (
                                                                              <div className="space-y-1">
                                                                                <Label className="text-xs">{t('addCourse_pick_existing_video')}</Label>
                                                                                <Select
                                                                                  onValueChange={(value) => assignExistingVideo(section.id, lesson.id, value)}
                                                                                >
                                                                                  <SelectTrigger className="h-9">
                                                                                    <SelectValue placeholder={t('addCourse_pick_existing_video_placeholder')} />
                                                                                  </SelectTrigger>
                                                                                  <SelectContent>
                                                                                    {courseVideoLibrary
                                                                                      .filter((item) => item.key !== `${section.id}:${lesson.id}` && item.videoUrl)
                                                                                      .map((item) => (
                                                                                        <SelectItem key={item.key} value={item.key}>
                                                                                          {item.sectionTitle} — {item.lessonTitle}
                                                                                        </SelectItem>
                                                                                      ))}
                                                                                  </SelectContent>
                                                                                </Select>
                                                                              </div>
                                                                            )}
                                                                            <div className="grid gap-2 md:grid-cols-2">
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-xs">{t('addCourse_lesson_video_name_label')}</Label>
                                                                                    <Input
                                                                                        value={lesson.videoTitle ?? lesson.title}
                                                                                        onChange={(e) => updateLesson(section.id, lesson.id, { videoTitle: e.target.value })}
                                                                                        placeholder={t('addCourse_lesson_video_name_placeholder')}
                                                                                        className="h-9"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <Label className="text-xs">
                                                                                      {videoMode === 'url'
                                                                                        ? t('addCourse_lesson_video_duration_seconds_label')
                                                                                        : t('addCourse_lesson_video_duration_label')}
                                                                                    </Label>
                                                                                    {videoMode === 'url' ? (
                                                                                      <Input
                                                                                        type="number"
                                                                                        min={0}
                                                                                        value={lesson.durationSeconds ?? 0}
                                                                                        onChange={(e) => updateLesson(section.id, lesson.id, {
                                                                                          durationSeconds: Math.max(0, parseInt(e.target.value, 10) || 0),
                                                                                        })}
                                                                                        className="h-9"
                                                                                      />
                                                                                    ) : (
                                                                                      <Input
                                                                                        value={formatDurationLabel(lesson.durationSeconds)}
                                                                                        readOnly
                                                                                        className="h-9 bg-muted"
                                                                                      />
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {deliveryMode === 'desktopLicense' ? (
                                                                              <p className="text-xs text-primary">{t('addCourse_lesson_video_desktop_encrypt_hint')}</p>
                                                                            ) : null}

                                                                            <Tabs
                                                                              value={videoMode}
                                                                              onValueChange={(value) => setLessonVideoMode(lesson.id, value as 'upload' | 'url')}
                                                                              dir={direction}
                                                                            >
                                                                              <TabsList className={cn('grid w-full max-w-md', deliveryMode === 'desktopLicense' ? 'grid-cols-1' : 'grid-cols-2')}>
                                                                                <TabsTrigger value="upload" className="gap-1.5">
                                                                                  <UploadCloud className="h-3.5 w-3.5" />
                                                                                  {t('addCourse_lesson_video_source_upload')}
                                                                                </TabsTrigger>
                                                                                {deliveryMode !== 'desktopLicense' ? (
                                                                                <TabsTrigger value="url" className="gap-1.5">
                                                                                  <Link2 className="h-3.5 w-3.5" />
                                                                                  {t('addCourse_lesson_video_source_url')}
                                                                                </TabsTrigger>
                                                                                ) : null}
                                                                              </TabsList>
                                                                              <TabsContent value="upload" className="mt-3 space-y-2">
                                                                                <div className="flex flex-wrap items-center gap-2">
                                                                                    <Label htmlFor={`lesson-video-${lesson.id}`} className="cursor-pointer">
                                                                                        <Button type="button" variant="outline" size="sm" asChild>
                                                                                            <span><UploadCloud className="mr-2 h-4 w-4" />{t('addCourse_lesson_upload_video')}</span>
                                                                                        </Button>
                                                                                    </Label>
                                                                                    <Input
                                                                                        id={`lesson-video-${lesson.id}`}
                                                                                        type="file"
                                                                                        accept="video/*"
                                                                                        className="hidden"
                                                                                        disabled={lessonUploadingId === lesson.id}
                                                                                        onChange={(e) => handleLessonVideoChange(section.id, lesson.id, e.target.files?.[0])}
                                                                                    />
                                                                                    {lessonUploadingId === lesson.id && (
                                                                                      <div className="w-full max-w-xs space-y-1">
                                                                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                                          <span>{deliveryMode === 'desktopLicense' ? (t('addCourse_encrypting_upload') || 'Uploading & encrypting...') : (t('addCourse_uploading') || 'Uploading...')}</span>
                                                                                          <span className="tabular-nums">{lessonUploadProgress[lesson.id] ?? 0}%</span>
                                                                                        </div>
                                                                                        <Progress value={lessonUploadProgress[lesson.id] ?? 0} className="h-2" />
                                                                                      </div>
                                                                                    )}
                                                                                    {hasAttachedVideo && lesson.videoFile && (
                                                                                        <span className="text-xs text-green-600">
                                                                                            {lesson.videoFile.name}
                                                                                        </span>
                                                                                    )}
                                                                                    {hasAttachedVideo && !lesson.videoFile && lesson.videoUrl && videoMode === 'upload' && (
                                                                                        <span className="text-xs text-muted-foreground">
                                                                                            {t('addCourse_lesson_video_attached')}
                                                                                        </span>
                                                                                    )}
                                                                                    {hasAttachedVideo && !lesson.videoFile && (lesson.mediaAssetId || (!lesson.videoUrl && deliveryMode === 'desktopLicense')) && (
                                                                                        <span className="text-xs text-green-600">
                                                                                            {t('addCourse_lesson_video_desktop_encrypted_attached')}
                                                                                        </span>
                                                                                    )}
                                                                                    {hasAttachedVideo && (
                                                                                        <Button type="button" variant="ghost" size="sm" onClick={() => clearLessonVideo(section.id, lesson.id)}>
                                                                                            {t('addCourse_lesson_remove_video')}
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                                {lesson.videoFile && (
                                                                                  <LessonFileVideoPreview file={lesson.videoFile} />
                                                                                )}
                                                                                {!lesson.videoFile && lesson.videoUrl && videoMode === 'upload' && hasAttachedVideo && (
                                                                                  <LessonVideoPreview url={lesson.videoUrl} />
                                                                                )}
                                                                              </TabsContent>
                                                                              <TabsContent value="url" className="mt-3 space-y-2">
                                                                                <div className="space-y-1">
                                                                                  <Label className="text-xs">{t('addCourse_lesson_video_url_label')}</Label>
                                                                                  <Input
                                                                                    value={lesson.videoUrl ?? ''}
                                                                                    onChange={(e) => handleLessonVideoUrlChange(section.id, lesson.id, e.target.value)}
                                                                                    placeholder={t('addCourse_lesson_video_url_placeholder')}
                                                                                    className="h-9"
                                                                                    dir="ltr"
                                                                                  />
                                                                                  {lessonUrlErrors[lesson.id] ? (
                                                                                    <p className="text-xs text-destructive">{lessonUrlErrors[lesson.id]}</p>
                                                                                  ) : (
                                                                                    <p className="text-xs text-muted-foreground">{t('addCourse_lesson_video_url_hint')}</p>
                                                                                  )}
                                                                                </div>
                                                                                {hasAttachedVideo && lesson.videoUrl && !lesson.videoFile && (
                                                                                  <div className="space-y-2">
                                                                                    <LessonVideoPreview url={lesson.videoUrl} />
                                                                                    <div className="flex flex-wrap gap-2">
                                                                                      <Button type="button" variant="ghost" size="sm" onClick={() => clearLessonVideo(section.id, lesson.id)}>
                                                                                        {t('addCourse_lesson_remove_video')}
                                                                                      </Button>
                                                                                      <Button type="button" variant="outline" size="sm" asChild>
                                                                                        <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer">
                                                                                          <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                                                                          {t('addCourse_lesson_video_open_external')}
                                                                                        </a>
                                                                                      </Button>
                                                                                    </div>
                                                                                  </div>
                                                                                )}
                                                                              </TabsContent>
                                                                            </Tabs>
                                                                            {canManageMaterials && renderMaterials(section.id, lesson.id)}
                                                                            </>
                                                                            ) : (
                                                                              <p className="text-xs text-muted-foreground">
                                                                                {lifecyclePhase === 'notStarted'
                                                                                  ? t('addCourse_lesson_video_blocked_not_started')
                                                                                  : t('addCourse_lesson_video_blocked_ended')}
                                                                              </p>
                                                                            )}
                                                                            {canToggleLessonPublish(lifecyclePhase) && (
                                                                              <div className="flex items-center justify-between rounded-md border p-2">
                                                                                <Label className="text-xs">{t('addCourse_lesson_published_label')}</Label>
                                                                                <Switch
                                                                                  checked={lesson.isPublished === true}
                                                                                  onCheckedChange={(checked) => updateLesson(section.id, lesson.id, { isPublished: checked })}
                                                                                />
                                                                              </div>
                                                                            )}
                                                                        </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                            );
                                                        })}
                                                        {provided.placeholder}
                                                        <LessonInput sectionId={section.id} />
                                                    </div>
                                                </div>
                                            )}
                                        </Droppable>
                                        )}
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>

        <AlertDialog open={pendingDelete != null} onOpenChange={(open) => !open && setPendingDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {pendingDelete?.type === 'section'
                  ? t('addCourse_delete_section_title')
                  : t('addCourse_delete_lesson_title')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDelete?.type === 'section'
                  ? t('addCourse_delete_section_description').replace('{title}', pendingDelete.title)
                  : pendingDelete?.type === 'lesson'
                    ? t('addCourse_delete_lesson_description').replace('{title}', pendingDelete.title)
                    : ''}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('addCourse_delete_cancel')}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={confirmPendingDelete}
              >
                {t('addCourse_delete_confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </DragDropContext>
  );
}

function AdditionalInformation({ form }: { form: any }) {
  const { t } = useLanguage();
  const tags = form.watch('tags') as string[];
  const prerequisites = form.watch('prerequisites') as string;
  const faqs = form.watch('faqs') as FAQ[];

  const setTags = (newTags: string[]) => form.setValue('tags', newTags);
  const setPrerequisites = (value: string) => form.setValue('prerequisites', value);
  const setFaqs = (newFaqs: FAQ[]) => form.setValue('faqs', newFaqs);
  
  const addFaq = () => {
    setFaqs([...faqs, { id: `faq-${Date.now()}`, question: '', answer: '' }]);
  };

  const removeFaq = (id: string) => {
    setFaqs(faqs.filter(faq => faq.id !== id));
  };

  const handleFaqChange = (id: string, field: 'question' | 'answer', value: string) => {
    setFaqs(faqs.map(faq => faq.id === id ? {...faq, [field]: value} : faq));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{t('addCourse_tags_title')}</h3>
        <p className="text-sm text-muted-foreground">{t('addCourse_tags_description')}</p>
        <TagSuggestionInput
          tags={tags}
          onTagsChange={setTags}
          placeholder={t('addCourse_tags_placeholder')}
          addButtonLabel={t('addCourse_tags_add_button')}
          hint={t('tag_suggestions_hint') ?? 'Type to see previously saved tags; select from the list or add a new one.'}
          removeLabel={(tag) => t('remove_tag').replace('{tag}', tag)}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{t('addCourse_prerequisites_title')}</h3>
        <p className="text-sm text-muted-foreground">{t('addCourse_prerequisites_description')}</p>
        <Textarea 
          placeholder={t('addCourse_prerequisites_placeholder')}
          value={prerequisites}
          onChange={(e) => setPrerequisites(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t('addCourse_faq_title')}</h3>
            <p className="text-sm text-muted-foreground">{t('addCourse_faq_description')}</p>
          </div>
          <Button type="button" variant="outline" onClick={addFaq}><Plus className="mr-2 h-4 w-4" /> {t('addCourse_faq_add_button')}</Button>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={faq.id} className="p-4 border rounded-md bg-card space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor={`faq-q-${index}`} className="font-medium">{t('addCourse_faq_question_label')} {index + 1}</Label>
                <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeFaq(faq.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input 
                id={`faq-q-${index}`}
                placeholder={t('addCourse_faq_question_placeholder')}
                value={faq.question}
                onChange={(e) => handleFaqChange(faq.id, 'question', e.target.value)}
              />
              <Label htmlFor={`faq-a-${index}`} className="font-medium">{t('addCourse_faq_answer_label')} {index + 1}</Label>
              <Textarea 
                id={`faq-a-${index}`}
                placeholder={t('addCourse_faq_answer_placeholder')}
                value={faq.answer}
                onChange={(e) => handleFaqChange(faq.id, 'answer', e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


export function CourseFormModal({
  open,
  onOpenChangeAction,
  course,
  loading = false,
}: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  course?: Course | null;
  loading?: boolean;
}) {
  const { t , direction } = useLanguage();
  const courseDetailsSchema = React.useMemo(() => createCourseDetailsSchema(t), [t]);
  const onOpenChange = onOpenChangeAction;
  const { addCourse, getCourseDetails, categories } = useStore();
  const steps = stepsConfig(t);
  const [currentStep, setCurrentStep] = React.useState(1);
  const [maxCompletedStep, setMaxCompletedStep] = React.useState(1);
  const [saving, setSaving] = React.useState(false);
  const { toast } = useToast();
  
  const [videoError, setVideoError] = React.useState<string | null>(null);
  const [courseIntroMaxMinutes, setCourseIntroMaxMinutes] = React.useState(5);
  const [introVideoDurationSeconds, setIntroVideoDurationSeconds] = React.useState<number | undefined>();
  const [seoSettings, setSeoSettings] = React.useState<SeoSettingsValue>({});
  const [imageUploadProgress, setImageUploadProgress] = React.useState<number | null>(null);
  const [introVideoPickerOpen, setIntroVideoPickerOpen] = React.useState(false);
  const isEditMode = !!course?.id;

  React.useEffect(() => {
    void getMediaUploadSettings()
      .then((settings) => setCourseIntroMaxMinutes(settings.courseIntroMaxDurationMinutes || 5))
      .catch(() => setCourseIntroMaxMinutes(5));
  }, []);

  // Parent remounts this modal with a stable key once GetById returns, so defaultValues
  // already include level / deliveryMode / status (avoids empty Radix Select after reset).
  const initialFormValues = React.useMemo(
    () => (course?.id ? mapCourseToFormDefaults(course) : createEmptyCourseFormDefaults()),
    [course],
  );

  const form = useForm<CourseDetailsForm>({
    resolver: zodResolver(courseDetailsSchema),
    defaultValues: initialFormValues,
  });

  const skipAutoInstallmentsRef = React.useRef(
    initialFormValues.paymentType === 'installment'
  );
  const paymentType = form.watch('paymentType');
  const salePrice = form.watch('price');
  const installmentPlans = form.watch('installmentPlans');

  React.useEffect(() => {
    if (paymentType !== 'installment') return;
    if (skipAutoInstallmentsRef.current) {
      skipAutoInstallmentsRef.current = false;
      return;
    }
    const count = installmentPlans?.length >= 2 ? installmentPlans.length : 3;
    form.setValue('installmentPlans', buildCourseInstallmentPlanRows(Number(salePrice) || 0, count), {
      shouldValidate: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redistribute only on payment type / price
  }, [paymentType, salePrice]);

  const watchedLifecyclePhase = form.watch('lifecyclePhase') as 'notStarted' | 'inProgress' | 'ended';
  const watchedCategory = form.watch('category');
  React.useEffect(() => {
    if (watchedLifecyclePhase === 'ended') {
      form.setValue('registrationDeadlineUtc', undefined);
      form.setValue('courseStartUtc', undefined);
      form.setValue('courseEndUtc', undefined);
    }
  }, [watchedLifecyclePhase, form]);

  const resetCreateCourseForm = React.useCallback(() => {
    form.reset(createEmptyCourseFormDefaults());
    skipAutoInstallmentsRef.current = false;
    setSeoSettings({});
    setCurrentStep(1);
    setMaxCompletedStep(1);
    setVideoError(null);
    setIntroVideoDurationSeconds(undefined);
  }, [form]);

  const levelOptions = React.useMemo(
    () => [
      { value: 'beginner', label: t('level_beginner') },
      { value: 'intermediate', label: t('level_intermediate') },
      { value: 'advanced', label: t('level_advanced') },
    ],
    [t],
  );

  const languageOptions = React.useMemo(
    () => [
      { value: 'fa', label: t('language_fa') },
      { value: 'en', label: t('language_en') },
    ],
    [t],
  );

  const deliveryModeOptions = React.useMemo(
    () => [
      { value: 'directDownload', label: t('addCourse_delivery_mode_direct') },
      { value: 'desktopLicense', label: t('addCourse_delivery_mode_desktop') },
    ],
    [t],
  );

  const lifecycleOptions = React.useMemo(
    () => [
      { value: 'notStarted', label: t('addCourse_lifecycle_not_started') },
      { value: 'inProgress', label: t('addCourse_lifecycle_in_progress') },
      { value: 'ended', label: t('addCourse_lifecycle_ended') },
    ],
    [t],
  );

    const categoryOptions = React.useMemo(() => {
        const options = [...categories]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map(cat => ({
                value: String(cat.categoryId),
                label: cat.categoryName,
            }));
        const selected = String(watchedCategory ?? '');
        if (selected && !options.some((o) => o.value === selected)) {
          const fromCourse = String((course as Course & { categoryName?: string })?.categoryName ?? course?.category ?? selected);
          options.unshift({ value: selected, label: fromCourse || selected });
        }
        return options;
    }, [categories, course, watchedCategory]);


    const imageFile = form.watch('thumbnailUrl');
    const videoFile = form.watch('videoUrl');


    const imagePreview = React.useMemo(() => toSameOriginAssetSrc(imageFile), [imageFile]);

    const videoPreviewUrl = React.useMemo(() => {
      if (typeof videoFile === 'string' && videoFile.trim().toLowerCase().startsWith('drm://')) {
        return null;
      }
      return toSameOriginAssetSrc(videoFile);
    }, [videoFile]);
    const hasUnplayableIntroVideo =
      typeof videoFile === 'string' && videoFile.trim().toLowerCase().startsWith('drm://');

  React.useEffect(() => {
        return () => {
            if (imageFile instanceof File && imagePreview?.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imageFile, imagePreview]);

    React.useEffect(() => {
        return () => {
            if (videoFile instanceof File && videoPreviewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(videoPreviewUrl);
            }
        };
    }, [videoFile, videoPreviewUrl]);


  React.useEffect(() => {
    if (!open || loading) return;
    setIntroVideoDurationSeconds(undefined);

    if (isEditMode && course) {
      setSeoSettings({
        seoTitle: (course as Course & { seoTitle?: string }).seoTitle ?? '',
        metaDescription: (course as Course & { metaDescription?: string }).metaDescription ?? '',
        ogImageUrl: (course as Course & { ogImageUrl?: string }).ogImageUrl ?? '',
      });
      setCurrentStep(1);
      setMaxCompletedStep(1);
      setVideoError(null);
      // Re-apply mapped values in case parent reused the same key
      form.reset(mapCourseToFormDefaults(course));
      skipAutoInstallmentsRef.current =
        (course as Course).paymentType === 'installment';
      return;
    }

    if (!isEditMode) {
      resetCreateCourseForm();
    }
  }, [isEditMode, course, open, loading, form, resetCreateCourseForm]);
  
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImageUploadProgress(0);
    try {
      const uploaded = await uploadMediaAsset(
        { file, title: file.name },
        (percent) => setImageUploadProgress(percent)
      );
      form.setValue('thumbnailUrl', uploaded.fileUrl || `/media/${uploaded.id}`, { shouldDirty: true });
      toast({ title: t('addCourse_image_uploaded') || 'Image uploaded' });
    } catch (error) {
      console.error('Course image upload failed:', error);
      toast({
        title: t('addCourse_image_upload_failed'),
        variant: 'destructive',
      });
    } finally {
      setImageUploadProgress(null);
    }
  };

  const handleIntroVideoSelect = async (item: { fileUrl: string; id?: string | number }) => {
    const fileUrl = String(item.fileUrl ?? '').trim();
    const mediaId =
      item.id != null && String(item.id).trim() !== '' && Number(item.id) > 0
        ? Number(item.id)
        : null;
    setIntroVideoPickerOpen(false);
    setVideoError(null);

    // Prefer a real playable URL for modal preview; fall back to /media/{id} for backend resolve.
    const selectedUrl = fileUrl || (mediaId != null ? `/media/${mediaId}` : '');
    if (!selectedUrl) {
      toast({ title: t('addCourse_video_upload_failed'), variant: 'destructive' });
      return;
    }
    if (selectedUrl.toLowerCase().startsWith('drm://')) {
      setVideoError(
        t('addCourse_intro_video_needs_reupload') ||
          'Intro videos must be public and not desktop-encrypted.'
      );
      setIntroVideoDurationSeconds(undefined);
      return;
    }

    const durationSeconds = await readVideoDurationFromUrl(selectedUrl);
    if (durationSeconds > 0 && durationSeconds > courseIntroMaxMinutes * 60) {
      setVideoError(t('addCourse_video_error', { minutes: courseIntroMaxMinutes }));
      setIntroVideoDurationSeconds(undefined);
      return;
    }
    if (durationSeconds > 0) {
      setIntroVideoDurationSeconds(Math.round(durationSeconds));
    } else {
      setIntroVideoDurationSeconds(undefined);
    }

    form.setValue('videoUrl', selectedUrl, { shouldDirty: true });
    toast({ title: t('addCourse_video_uploaded') || 'Video selected' });
  };

  const handleStepClick = (step: number) => {
    if (step <= maxCompletedStep) {
      setCurrentStep(step);
    }
  };
  
  // const handleNext = async () => {
  //   const isValid = await form.trigger();
  //   if (!isValid) {
  //       toast({
  //           variant: 'destructive',
  //           title: t('validation_error_title'),
  //           description: t('validation_error_description'),
  //       });
  //       return;
  //   }
  //
  //   if (currentStep < steps.length) {
  //     const nextStep = currentStep + 1;
  //     setCurrentStep(nextStep);
  //     if (nextStep > maxCompletedStep) {
  //       setMaxCompletedStep(nextStep);
  //     }
  //   }
  // };

    const handleNext = async () => {
        if (currentStep === 1) {
            const isValid = await form.trigger();
            if (!isValid) return;
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

    const handleSave = async (values: CourseDetailsForm) => {
        setSaving(true);
        try {
            const scheduleEditable = canEditLifecycleSchedule(values.lifecyclePhase);
            const scheduleFields = scheduleEditable
              ? {
                  registrationDeadlineUtc: values.registrationDeadlineUtc,
                  courseStartUtc: values.courseStartUtc,
                  courseEndUtc: values.courseEndUtc,
                }
              : {
                  registrationDeadlineUtc: undefined,
                  courseStartUtc: undefined,
                  courseEndUtc: undefined,
                };

            if (isEditMode && course) {
                const result = await updateCourses(course.id, {
                    title: values.title,
                    shortDescription: values.shortDescription,
                    description: values.description,
                    level: values.level,
                    price: values.price,
                    originalPrice: values.originalPrice > 0 ? values.originalPrice : undefined,
                    paymentType: values.paymentType === 'installment' ? 'installment' : 'cash',
                    installmentPlans:
                      values.paymentType === 'installment'
                        ? (values.installmentPlans ?? []).map((p) => ({
                            installmentNumber: p.installmentNumber,
                            amountToman: Number(p.amountToman) || 0,
                            dueDateUtc: p.dueDateUtc ?? null,
                          }))
                        : undefined,
                    category: values.category,
                    status: values.status,
                    degreeRequired: values.degreeRequired,
                    tags: values.tags,
                    prerequisites: values.prerequisites,
                    faqs: values.faqs,
                    sections: values.sections,
                    thumbnailUrl: values.thumbnailUrl,
                    videoUrl: values.videoUrl,
                    introVideoDurationSeconds,
                    deliveryMode: values.deliveryMode,
                    lifecyclePhase: values.lifecyclePhase,
                    registrationClosed: values.registrationClosed === true,
                    ...scheduleFields,
                    seoTitle: seoSettings.seoTitle || null,
                    metaDescription: seoSettings.metaDescription || null,
                    ogImageUrl: seoSettings.ogImageUrl || null,
                });
                if (!result) return;
                if (result.action === 'destructive') {
                    toast({
                        variant: 'destructive',
                        title: t(result.title),
                        description: t(result.description),
                    });
                    return;
                }
                await getCourseDetails(course.id);
                toast({
                    title: t(result.title),
                    description: t(result.description),
                });
            } else {
                await addCourse({
                  ...values,
                  ...scheduleFields,
                  introVideoDurationSeconds,
                  seoTitle: seoSettings.seoTitle || null,
                  metaDescription: seoSettings.metaDescription || null,
                  ogImageUrl: seoSettings.ogImageUrl || null,
                } as Parameters<typeof addCourse>[0]);
                toast({
                    title: t('addCourse_toast_success_title'),
                    description: t('addCourse_toast_success_description'),
                });
                resetCreateCourseForm();
            }
            onOpenChange(false);
        } catch(error) {
            console.error("Failed to save course:", error);
            toast({
                variant: 'destructive',
                title: t('toast_error_title'),
                description: t('toast_error_description'),
            });
        } finally {
            setSaving(false);
        }
    }
  
  React.useEffect(() => {
    if (open && isEditMode) {
      setMaxCompletedStep(steps.length);
    }
  }, [open, isEditMode, steps.length]);


    const onPrimaryButtonClick = () => {
        if (currentStep < steps.length) {
            handleNext();
        } else {
            form.handleSubmit(handleSave)();
        }
    };


  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md flex flex-col items-center justify-center py-12">
          <DialogHeader className="sr-only">
            <DialogTitle>{t('loading')}</DialogTitle>
            <DialogDescription>{t('editCourse_description') ?? 'Loading course details'}</DialogDescription>
          </DialogHeader>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">{t('loading')}</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEditMode ? t('editCourse_title') : t('addCourse_title')}</DialogTitle>
          <DialogDescription>{isEditMode ? t('editCourse_description') : t('addCourse_description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSave)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-6 py-4 -mr-6">
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
                {index < steps.length - 1  && (
                  <div className="flex-1 h-px bg-border mt-5 mx-2 sm:mx-4"></div>
                )}
              </React.Fragment>
            ))}
          </div>

              <div className="space-y-6 ml-3">
              <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                  <div className="space-y-6">
                      <FormField
                          control={form.control}
                          name="title"
                          render={({field}) => (
                              <FormItem>
                                  <FormLabel>{t('addCourse_course_title_label')}</FormLabel>
                                  <FormControl>
                                      <Input placeholder={t('addCourse_course_title_placeholder')} {...field} />
                                  </FormControl>
                                  <FormMessage/>
                              </FormItem>
                          )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                              control={form.control}
                              name="category"
                              render={({field}) => (
                                  <FormItem className="flex flex-col">
                                      <FormLabel>{t('addCourse_category_label')}</FormLabel>
                                      <Combobox
                                          options={categoryOptions}
                                          value={field.value}
                                          onChangeAction={field.onChange}
                                          placeholder={t('addCourse_category_placeholder')}
                                          searchPlaceholder={t('combobox_search_placeholder')}
                                          noResultsText={t('combobox_no_results')}
                                      />
                                      <FormMessage/>
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="level"
                              render={({field}) => (
                                  <FormItem className="flex flex-col">
                                      <FormLabel>{t('addCourse_level_label')}</FormLabel>
                                      <FormControl>
                                          <Combobox
                                              options={levelOptions}
                                              value={field.value}
                                              onChangeAction={field.onChange}
                                              placeholder={t('addCourse_level_placeholder')}
                                              searchPlaceholder={t('combobox_search_placeholder')}
                                              noResultsText={t('combobox_no_results')}
                                          />
                                      </FormControl>
                                      <FormMessage/>
                                  </FormItem>
                              )}
                          />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                              control={form.control}
                              name="language"
                              render={({field}) => (
                                  <FormItem className="flex flex-col">
                                      <FormLabel>{t('addCourse_language_label')}</FormLabel>
                                      <FormControl>
                                          <Combobox
                                              options={languageOptions}
                                              value={field.value}
                                              onChangeAction={field.onChange}
                                              placeholder={t('addCourse_language_placeholder')}
                                              searchPlaceholder={t('combobox_search_placeholder')}
                                              noResultsText={t('combobox_no_results')}
                                          />
                                      </FormControl>
                                      <FormMessage/>
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="originalPrice"
                              render={({field}) => (
                                  <FormItem>
                                      <FormLabel>{t('addCourse_original_price_label')}</FormLabel>
                                      <FormControl>
                                          <Input type="number"
                                                 placeholder={t('addCourse_original_price_placeholder')} {...field} />
                                      </FormControl>
                                      <p className="text-xs text-muted-foreground">{t('addCourse_original_price_hint')}</p>
                                      <FormMessage/>
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="price"
                              render={({field}) => (
                                  <FormItem>
                                      <FormLabel>{t('addCourse_sale_price_label')}</FormLabel>
                                      <FormControl>
                                          <Input type="number"
                                                 placeholder={t('addCourse_price_placeholder')} {...field} />
                                      </FormControl>
                                      <FormMessage/>
                                  </FormItem>
                              )}
                          />
                      </div>

                      <div className="space-y-4 rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="course-installment-sale"
                            checked={paymentType === 'installment'}
                            onCheckedChange={(checked) => {
                              const enabled = checked === true;
                              form.setValue('paymentType', enabled ? 'installment' : 'cash', {
                                shouldValidate: true,
                              });
                              if (enabled) {
                                form.setValue(
                                  'installmentPlans',
                                  buildCourseInstallmentPlanRows(Number(salePrice) || 0, 3),
                                  { shouldValidate: true }
                                );
                              } else {
                                form.setValue('installmentPlans', [], { shouldValidate: true });
                              }
                            }}
                          />
                          <Label htmlFor="course-installment-sale" className="cursor-pointer font-medium">
                            {t('addCourse_installment_sale_label')}
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('addCourse_installment_sale_hint')}</p>

                        {paymentType === 'installment' ? (
                          <div className="space-y-3">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>{t('addCourse_installment_count_label')}</Label>
                                <Select
                                  value={String(
                                    installmentPlans?.length >= 2 ? installmentPlans.length : 3
                                  )}
                                  onValueChange={(value) => {
                                    form.setValue(
                                      'installmentPlans',
                                      buildCourseInstallmentPlanRows(
                                        Number(salePrice) || 0,
                                        Number(value)
                                      ),
                                      { shouldValidate: true }
                                    );
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {COURSE_INSTALLMENT_COUNTS.map((count) => (
                                      <SelectItem key={count} value={String(count)}>
                                        {count}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>{t('addCourse_installment_sum_label')}</Label>
                                <div
                                  className={cn(
                                    'flex h-10 items-center rounded-md border px-3 text-sm font-medium',
                                    Math.abs(
                                      installmentPlansSum(installmentPlans ?? []) -
                                        Number(salePrice || 0)
                                    ) > 0.5
                                      ? 'border-destructive text-destructive'
                                      : 'bg-muted'
                                  )}
                                >
                                  {installmentPlansSum(installmentPlans ?? []).toLocaleString(
                                    direction === 'rtl' ? 'fa-IR' : 'en-US'
                                  )}{' '}
                                  /{' '}
                                  {Number(salePrice || 0).toLocaleString(
                                    direction === 'rtl' ? 'fa-IR' : 'en-US'
                                  )}{' '}
                                  {t('addCourse_installment_currency')}
                                </div>
                              </div>
                            </div>

                            {(installmentPlans ?? []).map((row, index) => (
                              <div
                                key={row.installmentNumber}
                                className="grid gap-3 rounded-md border p-3 sm:grid-cols-3"
                              >
                                <div className="flex items-center text-sm font-medium">
                                  {t('addCourse_installment_row_label')} #{row.installmentNumber}
                                </div>
                                {row.installmentNumber === 1 ? (
                                  <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                                    {t('addCourse_installment_at_purchase')}
                                  </div>
                                ) : (
                                  <LocalizedDateTimePicker
                                    value={row.dueDateUtc ?? undefined}
                                    onChange={(date) => {
                                      const next = [...(installmentPlans ?? [])];
                                      next[index] = { ...next[index], dueDateUtc: date ?? null };
                                      form.setValue('installmentPlans', next, {
                                        shouldValidate: true,
                                      });
                                    }}
                                  />
                                )}
                                <Input
                                  type="number"
                                  min={1}
                                  value={row.amountToman}
                                  onChange={(e) => {
                                    const amountToman = Number(e.target.value);
                                    const next = [...(installmentPlans ?? [])];
                                    next[index] = { ...next[index], amountToman };
                                    form.setValue('installmentPlans', next, {
                                      shouldValidate: true,
                                    });
                                  }}
                                />
                              </div>
                            ))}
                            <FormField
                              control={form.control}
                              name="installmentPlans"
                              render={() => <FormMessage />}
                            />
                          </div>
                        ) : null}
                      </div>

                      <div>
                          <FormField
                              control={form.control}
                              name="shortDescription"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>{t('addCourse_course_shortDescription_label')}</FormLabel>
                                      <FormControl>
                                          <Textarea
                                              value={field.value ?? ''}
                                              onChange={field.onChange}
                                              onBlur={field.onBlur}
                                              name={field.name}
                                              ref={field.ref}
                                              placeholder={t('addCourse_course_shortDescription_placeholder')}
                                          />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                              control={form.control}
                              name="deliveryMode"
                              render={({ field }) => (
                                  <FormItem className="flex flex-col">
                                      <FormLabel>{t('addCourse_delivery_mode_label')}</FormLabel>
                                      <FormControl>
                                          <Combobox
                                              options={deliveryModeOptions}
                                              value={field.value}
                                              onChangeAction={field.onChange}
                                              placeholder={t('addCourse_delivery_mode_placeholder')}
                                              searchPlaceholder={t('combobox_search_placeholder')}
                                              noResultsText={t('combobox_no_results')}
                                          />
                                      </FormControl>
                                      <FormDescription>
                                          {field.value === 'desktopLicense'
                                              ? t('addCourse_delivery_mode_desktop_desc')
                                              : t('addCourse_delivery_mode_direct_desc')}
                                      </FormDescription>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                              control={form.control}
                              name="lifecyclePhase"
                              render={({ field }) => (
                                  <FormItem className="flex flex-col">
                                      <FormLabel>{t('addCourse_lifecycle_phase_label')}</FormLabel>
                                      <FormControl>
                                          <Combobox
                                              options={lifecycleOptions}
                                              value={field.value}
                                              onChangeAction={field.onChange}
                                              placeholder={t('addCourse_lifecycle_phase_placeholder')}
                                              searchPlaceholder={t('combobox_search_placeholder')}
                                              noResultsText={t('combobox_no_results')}
                                          />
                                      </FormControl>
                                      <FormDescription>
                                          {t('addCourse_lifecycle_phase_desc')}
                                      </FormDescription>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          {canEditLifecycleSchedule(watchedLifecyclePhase) && (
                          <>
                          <FormField
                              control={form.control}
                              name="registrationDeadlineUtc"
                              render={({ field }) => (
                                  <FormItem className="flex flex-col">
                                      <FormLabel>{t('addCourse_registration_deadline_label')}</FormLabel>
                                      <FormControl>
                                          <LocalizedDateTimePicker
                                              value={field.value}
                                              onChange={field.onChange}
                                              placeholder={t('addCourse_registration_deadline_label')}
                                          />
                                      </FormControl>
                                      <FormDescription>
                                          {t('addCourse_registration_deadline_desc')}
                                      </FormDescription>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="courseStartUtc"
                              render={({ field }) => (
                                  <FormItem className="flex flex-col">
                                      <FormLabel>{t('addCourse_course_start_label')}</FormLabel>
                                      <FormControl>
                                          <LocalizedDateTimePicker
                                              value={field.value}
                                              onChange={field.onChange}
                                              placeholder={t('addCourse_course_start_label')}
                                          />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="courseEndUtc"
                              render={({ field }) => (
                                  <FormItem className="flex flex-col">
                                      <FormLabel>{t('addCourse_course_end_label')}</FormLabel>
                                      <FormControl>
                                          <LocalizedDateTimePicker
                                              value={field.value}
                                              onChange={field.onChange}
                                              placeholder={t('addCourse_course_end_label')}
                                              disableDate={(date) => {
                                                  const start = form.getValues('courseStartUtc');
                                                  return start ? date < start : false;
                                              }}
                                          />
                                      </FormControl>
                                      <FormDescription>
                                          {t('addCourse_course_end_desc')}
                                      </FormDescription>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          </>
                          )}
                          {watchedLifecyclePhase === 'ended' && (
                            <p className="md:col-span-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                              {t('addCourse_lifecycle_schedule_ended_hint')}
                            </p>
                          )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                              control={form.control}
                              name="degreeRequired"
                              render={({field}) => (
                                  <FormItem

                                      className="flex flex-row items-center justify-between rounded-lg border p-4">
                                      <div className="space-y-0.5">
                                          <FormLabel className="text-base">{t('degree_required_label')}</FormLabel>
                                          <FormDescription>{t('degree_required_description')}</FormDescription>
                                      </div>
                                      <FormControl>
                                          <Switch
                                              dir={direction === 'rtl' ? 'ltr' : 'ltr'}
                                              checked={field.value}
                                              onCheckedChange={field.onChange}/>
                                      </FormControl>
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="registrationClosed"
                              render={({field}) => (
                                  <FormItem
                                      className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
                                      <div className="space-y-0.5">
                                          <FormLabel className="text-base">{t('addCourse_registration_closed_label')}</FormLabel>
                                          <FormDescription>{t('addCourse_registration_closed_desc')}</FormDescription>
                                      </div>
                                      <FormControl>
                                          <Switch
                                              dir={direction === 'rtl' ? 'ltr' : 'ltr'}
                                              checked={field.value}
                                              onCheckedChange={field.onChange}/>
                                      </FormControl>
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="status"
                              render={({field}) => (
                                  <FormItem
                                      className="flex flex-row items-center justify-between rounded-lg border p-4">
                                      <div className="space-y-0.5">
                                          <FormLabel className="text-base">{t('publish_immediately_label')}</FormLabel>
                                          <FormDescription>{t('publish_immediately_description')}</FormDescription>
                                      </div>
                                      <FormControl>
                                          <Switch
                                              dir={direction === 'rtl' ? 'ltr' : 'ltr'}
                                              checked={field.value === 'Published'}
                                              onCheckedChange={(checked) => field.onChange(checked ? 'Published' : 'Draft')}
                                          />
                                      </FormControl>
                                  </FormItem>
                              )}
                          />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                              control={form.control}
                              name="isSpecial"
                              render={({field}) => (
                                  <FormItem className="space-y-2">
                                      <FormLabel>{t('addCourse_special_label')}</FormLabel>
                                      <div className="flex items-center gap-4">
                                          <FormControl>
                                              <Switch
                                                  dir={direction === 'rtl' ? 'ltr' : 'ltr'}
                                                  checked={field.value}
                                                  onCheckedChange={field.onChange}
                                              />
                                          </FormControl>
                                          <FormField
                                              control={form.control}
                                              name="specialDetails"
                                              render={({field: specialField}) => (
                                                  <FormControl>
                                                      <Input
                                                          {...specialField}
                                                          placeholder={t('addCourse_special_placeholder')}
                                                          className="flex-1"
                                                          disabled={!field.value}
                                                      />
                                                  </FormControl>
                                              )}
                                          />
                                      </div>
                                  </FormItem>
                              )}
                          />

                      </div>

                      <FormField
                          control={form.control}
                          name="description"
                          render={({field}) => (
                              <FormItem>
                                  <FormLabel>{t('addCourse_description_label')}</FormLabel>
                                  <FormControl>
                                      <CustomRichTextEditor
                                          content={field.value}
                                          onChangeAction={field.onChange}
                                          placeholder={t('addCourse_description_placeholder')}
                                          expandVertically
                                      />
                                  </FormControl>
                                  <FormMessage/>
                              </FormItem>
                          )}
                      />

                  </div>
              </div>

                <div style={{display: currentStep === 2 ? 'block' : 'none'}}>
                    <div className="space-y-8">
                        <div>
                            <Label htmlFor="thumbnail-upload"
                                   className="text-base font-medium">{t('addCourse_thumbnail_label')}</Label>
                            <p className="text-sm text-muted-foreground mb-2">{t('addCourse_thumbnail_description')}</p>
                            <div
                                className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
                                <div className="text-center">
                                    {imagePreview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={imagePreview}
                                          alt={t('addCourse_thumbnail_preview_alt')}
                                          width={200}
                                          height={112}
                                          className="mx-auto h-28 w-[200px] rounded-md object-cover"
                                        />
                                    ) : (
                                        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground"/>
                                    )}
                                    <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                                        <Label
                                            htmlFor="thumbnail-upload"
                                            className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                                        >
                                            <span>{imagePreview ? t('replace_image') : t('upload_file')}</span>
                                            <Input id="thumbnail-upload" name="thumbnail-upload" type="file"
                                                   className="sr-only" accept="image/*" onChange={handleImageChange}/>
                                        </Label>
                                        <p className="pl-1">{t('drag_and_drop')}</p>
                                    </div>
                                    <p className="text-xs leading-5 text-muted-foreground">{t('image_upload_specs_full')}</p>
                                    {imageUploadProgress != null && (
                                      <div className="mx-auto mt-3 w-full max-w-xs space-y-1">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                          <span>{t('addCourse_uploading') || 'Uploading...'}</span>
                                          <span className="tabular-nums">{imageUploadProgress}%</span>
                                        </div>
                                        <Progress value={imageUploadProgress} className="h-2" />
                                      </div>
                                    )}
                                    {imagePreview && (
                                        <p className="text-sm text-green-600 mt-2">{t('addCourse_image_uploaded_success')}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-base font-medium">{t('addCourse_video_label')}</Label>
                            <p className="text-sm text-muted-foreground mb-2">{t('addCourse_video_description')}</p>
                    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
                      <div className="text-center w-full max-w-lg">
                        {videoPreviewUrl ? (
                          <video
                            key={videoPreviewUrl}
                            src={videoPreviewUrl}
                            controls
                            playsInline
                            preload="metadata"
                            className="mx-auto mb-4 max-h-48 w-full rounded-md bg-black"
                          />
                        ) : hasUnplayableIntroVideo ? (
                          <div className="mx-auto mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-4 text-sm text-destructive">
                            {t('addCourse_intro_video_needs_reupload') ||
                              'This intro video is not playable in the browser. Please upload it again (intro videos stay public and are not encrypted).'}
                          </div>
                        ) : (
                            <FileVideo className="mx-auto h-12 w-12 text-muted-foreground" />
                        )}
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm leading-6 text-muted-foreground">
                          <Button
                            type="button"
                            variant="secondary"
                            className="gap-2"
                            onClick={() => setIntroVideoPickerOpen(true)}
                          >
                            <UploadCloud className="h-4 w-4" />
                            {videoPreviewUrl || (typeof videoFile === 'string' && videoFile)
                              ? t('addCourse_video_replace')
                              : (t('media.selectFromLibrary') || t('upload_video'))}
                          </Button>
                          {(videoPreviewUrl || (typeof videoFile === 'string' && videoFile)) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setVideoError(null);
                                setIntroVideoDurationSeconds(undefined);
                                form.setValue('videoUrl', undefined, { shouldDirty: true });
                              }}
                            >
                              {t('addCourse_video_remove')}
                            </Button>
                          )}
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {t('video_upload_specs', { minutes: courseIntroMaxMinutes })}
                        </p>
                          {typeof videoFile === 'string' && videoFile && videoPreviewUrl && !videoError && (
                            <p className="text-sm text-green-600 mt-2">{t('video_uploaded_success')}</p>
                          )}
                        {videoError && <p className="text-sm text-destructive mt-2">{videoError}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {currentStep === 3 && <CourseSessions form={form} courseId={course?.id} />}
              {currentStep === 4 && (
                <>
                  <AdditionalInformation form={form} />
                  <SeoSettingsSection value={seoSettings} onChange={setSeoSettings} className="mt-6" />
                </>
              )}
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t pt-4 mt-0">
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack} type="button">
                  {t('back_button')}
                </Button>
              )}
              <Button onClick={onPrimaryButtonClick} type="button" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentStep < steps.length
                  ? t('next_button')
                  : isEditMode
                    ? t('update_course_button')
                    : t('save_course_button')}
              </Button>
            </DialogFooter>
          </form>
        </Form>

      </DialogContent>
    </Dialog>

      <MediaPickerDialog
        open={introVideoPickerOpen}
        onOpenChange={setIntroVideoPickerOpen}
        acceptTypes={['video']}
        isAdmin
        preferPublicVideoUpload
        onSelect={(item) => {
          void handleIntroVideoSelect(item);
        }}
      />
    </>
  );
}
