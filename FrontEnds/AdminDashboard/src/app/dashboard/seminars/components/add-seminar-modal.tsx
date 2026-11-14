

'use client';

import * as React from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { UploadCloud, FileVideo, Plus, Trash2, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CustomRichTextEditor } from '@/components/ui/custom-rich-text-editor';
import { useLanguage } from '@/components/language-provider';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { LocalizedDateTimePicker } from '@/components/ui/localized-date-time-picker';
import { useAuth } from '@/components/auth-provider';
import { useStore } from '@/lib/store';
import { getRoomsByOwnerId, type RoomListItem } from '@/services/room-service';
import {
  addSeminar as apiAddSeminar,
  getSeminarById,
  updateSeminar as apiUpdateSeminar,
  uploadSeminarMedia,
} from '@/services/seminar-api.service';
import { resolveStaticAssetUrl } from '@/lib/apiClient';
import { getSeminarIntroStreamUrl, getSeminarRecordingStreamUrl } from '@/lib/api-config';
import { searchTags } from '@/services/tag-api.service';
import type { Seminar } from '@/lib/types';
import { DefaultSeminarImage } from '@/components/seminar/default-seminar-image';

const stepsConfig = (t: (key: string) => string) => [
  { id: 1, name: t('addSeminar_step1_name') },
  { id: 2, name: t('addSeminar_step2_name') },
  { id: 3, name: t('addSeminar_step3_name') },
];

const seminarDetailsSchema = (t: (key: string) => string) =>
  z.object({
    title: z.string().min(1, t('addSeminar_validation_title_required')),
    description: z.string().min(1, t('addSeminar_validation_description_required')),
    category: z.string().optional(),
    level: z.string().optional(),
    language: z.string().optional(),
    endDate: z.date().optional(),
    capacity: z.coerce.number().min(1, t('addSeminar_validation_capacity_min')),
    price: z.coerce.number().min(0).default(0),
    isFree: z.coerce.boolean().default(true),
    status: z.coerce.number().min(0).max(4).default(1),
    isPublic: z.coerce.boolean().default(true),
    location: z.string().min(1, t('addSeminar_validation_location_required')),
    date: z.date({ required_error: t('addSeminar_validation_date_required') }),
    roomId: z.union([z.string(), z.number()]).optional().nullable(),
  });

type SeminarDetailsForm = z.infer<ReturnType<typeof seminarDetailsSchema>>;

type FAQ = {
  id: string;
  question: string;
  answer: string;
};

function resolveSeminarRoomId(
  raw: string | number | null | undefined,
  rooms: RoomListItem[]
): number | null {
  if (raw == null || raw === 'none' || raw === '') return null;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) return null;
  return rooms.some((room) => room.roomId === id) ? id : null;
}

function normalizeFaqs(raw: Seminar['faqs'] | undefined): FAQ[] {
  if (!raw?.length) return [];
  return raw.map((faq, index) => ({
    id: faq.id ? String(faq.id) : `faq-${index}`,
    question: faq.question ?? '',
    answer: faq.answer ?? '',
  }));
}

function applySeminarToFormState(
  full: Seminar,
  form: UseFormReturn<SeminarDetailsForm>,
  setters: {
    setTags: (v: string[]) => void;
    setPrerequisites: (v: string) => void;
    setFaqs: (v: FAQ[]) => void;
    setImagePreview: (v: string | null) => void;
    setThumbnailFile: (v: File | null) => void;
    setVideoFile: (v: File | null) => void;
    setRecordingFile: (v: File | null) => void;
    setMaxCompletedStep: (v: number) => void;
    stepsLength: number;
  }
) {
  const startDate = new Date(full.date);
  const loadedEnd = full.endTime ? new Date(full.endTime) : undefined;
  const validEnd =
    loadedEnd && !Number.isNaN(loadedEnd.getTime()) && loadedEnd > startDate ? loadedEnd : undefined;
  form.reset({
    title: full.title,
    description: full.description || '',
    category: full.category || '',
    level: full.level || '',
    language: 'fa',
    location: full.location || 'Online',
    date: startDate,
    endDate: validEnd,
    capacity: full.capacity ?? 100,
    price: full.price ?? 0,
    isFree: full.isFree ?? true,
    status: full.statusNumeric ?? 1,
    isPublic: full.isPublic ?? true,
    roomId: full.roomId ?? null,
  });
  setters.setTags(full.tags ?? []);
  setters.setPrerequisites(full.prerequisites ?? '');
  setters.setFaqs(normalizeFaqs(full.faqs));
  setters.setImagePreview(
    full.thumbnailUrl ? resolveStaticAssetUrl(full.thumbnailUrl) : null
  );
  setters.setThumbnailFile(null);
  setters.setVideoFile(null);
  setters.setRecordingFile(null);
  setters.setMaxCompletedStep(setters.stepsLength);
}

function AdditionalInformation({
  tags,
  setTags,
  tagInput,
  setTagInput,
  prerequisites,
  setPrerequisites,
  faqs,
  setFaqs,
}: {
  tags: string[];
  setTags: (v: string[] | ((prev: string[]) => string[])) => void;
  tagInput: string;
  setTagInput: (v: string) => void;
  prerequisites: string;
  setPrerequisites: (v: string) => void;
  faqs: FAQ[];
  setFaqs: (v: FAQ[] | ((prev: FAQ[]) => FAQ[])) => void;
}) {
  const { t } = useLanguage();

  const handleTagAdd = () => {
    if (tagInput.trim() !== '' && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const [tagSuggestions, setTagSuggestions] = React.useState<string[]>([]);
  const [tagSuggestionsOpen, setTagSuggestionsOpen] = React.useState(false);
  const tagSearchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!tagInput.trim()) {
      setTagSuggestions([]);
      return;
    }
    if (tagSearchTimeoutRef.current) clearTimeout(tagSearchTimeoutRef.current);
    tagSearchTimeoutRef.current = setTimeout(() => {
      searchTags({ tagName: tagInput.trim(), pageSize: 15 })
        .then((list) => setTagSuggestions(list.filter((n) => !tags.includes(n))))
        .catch(() => setTagSuggestions([]));
      tagSearchTimeoutRef.current = null;
    }, 250);
    return () => {
      if (tagSearchTimeoutRef.current) clearTimeout(tagSearchTimeoutRef.current);
    };
  }, [tagInput, tags]);

  const handleSelectSuggestion = (name: string) => {
    if (name && !tags.includes(name)) setTags([...tags, name]);
    setTagInput('');
    setTagSuggestions([]);
    setTagSuggestionsOpen(false);
  };

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
      {/* Seminar Tags */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{t('addSeminar_tags_title')}</h3>
        <p className="text-sm text-muted-foreground">{t('addSeminar_tags_description')}</p>
        <p className="text-xs text-muted-foreground">{t('addSeminar_tags_suggest_hint') ?? 'با تایپ، تگ‌های قبلاً ثبت‌شده پیشنهاد می‌شوند؛ از لیست انتخاب کنید یا تگ جدید اضافه کنید.'}</p>
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder={t('addSeminar_tags_placeholder')}
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setTagSuggestionsOpen(true);
              }}
              onFocus={() => tagSuggestions.length > 0 && setTagSuggestionsOpen(true)}
              onBlur={() => setTimeout(() => setTagSuggestionsOpen(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTagAdd();
                }
              }}
            />
            {tagSuggestionsOpen && tagSuggestions.length > 0 && (
              <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover py-1 shadow-md max-h-48 overflow-auto">
                {tagSuggestions.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                      onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(name); }}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button type="button" onClick={handleTagAdd}>{t('addSeminar_tags_add_button')}</Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-base py-1">
              {tag}
              <button onClick={() => handleTagRemove(tag)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                <X className="h-3 w-3" />
                <span className="sr-only">{t('remove_tag').replace('{tag}', tag)}</span>
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Prerequisites */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{t('addSeminar_prerequisites_title')}</h3>
        <p className="text-sm text-muted-foreground">{t('addSeminar_prerequisites_description')}</p>
        <Textarea 
          placeholder={t('addSeminar_prerequisites_placeholder')}
          value={prerequisites}
          onChange={(e) => setPrerequisites(e.target.value)}
        />
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t('addSeminar_faq_title')}</h3>
            <p className="text-sm text-muted-foreground">{t('addSeminar_faq_description')}</p>
          </div>
          <Button type="button" variant="outline" onClick={addFaq}><Plus className="mr-2 h-4 w-4" /> {t('addSeminar_faq_add_button')}</Button>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={faq.id} className="p-4 border rounded-md bg-card space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor={`faq-q-${index}`} className="font-medium">{t('addSeminar_faq_question_label')} {index + 1}</Label>
                <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeFaq(faq.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input 
                id={`faq-q-${index}`}
                placeholder={t('addSeminar_faq_question_placeholder')}
                value={faq.question}
                onChange={(e) => handleFaqChange(faq.id, 'question', e.target.value)}
              />
              <Label htmlFor={`faq-a-${index}`} className="font-medium">{t('addSeminar_faq_answer_label')} {index + 1}</Label>
              <Textarea 
                id={`faq-a-${index}`}
                placeholder={t('addSeminar_faq_answer_placeholder')}
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


export function AddSeminarModal({
  open,
  onOpenChangeAction,
  seminar,
  onSuccessAction,
}: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  seminar?: Seminar | null;
  onSuccessAction?: () => void;
}) {
  const { t, direction } = useLanguage();
  const onOpenChange = onOpenChangeAction;
  const onSuccess = onSuccessAction;
  const steps = stepsConfig(t);
  const [currentStep, setCurrentStep] = React.useState(1);
  const [maxCompletedStep, setMaxCompletedStep] = React.useState(1);
  const { toast } = useToast();
  
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = React.useState<File | null>(null);
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [recordingFile, setRecordingFile] = React.useState<File | null>(null);
  const [videoError, setVideoError] = React.useState<string | null>(null);
  const [rooms, setRooms] = React.useState<RoomListItem[]>([]);
  const [roomsLoading, setRoomsLoading] = React.useState(false);
  const { categories } = useStore();
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState('');
  const [prerequisites, setPrerequisites] = React.useState('');
  const [faqs, setFaqs] = React.useState<FAQ[]>([]);
  const { user } = useAuth();
  const [loadedSeminar, setLoadedSeminar] = React.useState<Seminar | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [minRegisteredCapacity, setMinRegisteredCapacity] = React.useState(1);
  const [introVideoBlobUrl, setIntroVideoBlobUrl] = React.useState<string | null>(null);
  const [recordingBlobUrl, setRecordingBlobUrl] = React.useState<string | null>(null);

  const isEditMode = !!seminar?.id;
  const activeSeminar = loadedSeminar ?? seminar ?? null;

  React.useEffect(() => {
    if (!open || !user?.id) return;
    setRoomsLoading(true);
    getRoomsByOwnerId({ userId: Number(user.id), pageSize: 200 })
      .then((res) => setRooms(res.queryResult ?? []))
      .catch(() => setRooms([]))
      .finally(() => setRoomsLoading(false));
  }, [open, user?.id]);

  const form = useForm<SeminarDetailsForm>({
    resolver: zodResolver(seminarDetailsSchema(t)),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      level: '',
      language: 'fa',
      location: t('addSeminar_location_default'),
      capacity: 100,
      price: 0,
      isFree: true,
      status: 1,
      isPublic: true,
      roomId: null,
    },
  });

  React.useEffect(() => {
    if (!open || !isEditMode || roomsLoading || !loadedSeminar) return;
    const current = form.getValues('roomId');
    if (current == null || current === 'none') return;
    const id = Number(current);
    if (!Number.isFinite(id) || id <= 0) {
      form.setValue('roomId', null);
      return;
    }
    if (rooms.length > 0 && !rooms.some((room) => room.roomId === id)) {
      form.setValue('roomId', null);
      toast({
        title: t('addSeminar_room_missing_title'),
        description: t('addSeminar_room_missing_cleared'),
      });
    }
  }, [open, isEditMode, roomsLoading, loadedSeminar, rooms, form, toast, t]);

  const resetAddForm = React.useCallback(() => {
    form.reset({
      title: '',
      description: '',
      category: '',
      level: '',
      language: 'fa',
      location: t('addSeminar_location_default'),
      date: undefined,
      endDate: undefined,
      capacity: 100,
      price: 0,
      isFree: true,
      status: 1,
      isPublic: true,
      roomId: null,
    });
    setTags([]);
    setTagInput('');
    setPrerequisites('');
    setFaqs([]);
    setImagePreview(null);
    setThumbnailFile(null);
    setVideoFile(null);
    setRecordingFile(null);
    setVideoError(null);
    setCurrentStep(1);
    setMaxCompletedStep(1);
    setLoadedSeminar(null);
    setMinRegisteredCapacity(1);
  }, [form, t]);

  React.useEffect(() => {
    if (!videoFile) {
      setIntroVideoBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setIntroVideoBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  React.useEffect(() => {
    if (!recordingFile) {
      setRecordingBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(recordingFile);
    setRecordingBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recordingFile]);

  React.useEffect(() => {
    if (!open) return;

    if (!isEditMode || !seminar?.id) {
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setLoadedSeminar(null);
    setCurrentStep(1);

    getSeminarById(seminar.id)
      .then((full) => {
        if (cancelled) return;
        if (!full) {
          toast({
            variant: 'destructive',
            title: t('validation_error_title'),
            description: t('editSeminar_load_failed') ?? 'Could not load seminar details.',
          });
          onOpenChange(false);
          return;
        }
        setLoadedSeminar(full);
        setMinRegisteredCapacity(Math.max(1, full.attendees ?? 0));
        applySeminarToFormState(full, form, {
          setTags,
          setPrerequisites,
          setFaqs,
          setImagePreview,
          setThumbnailFile,
          setVideoFile,
          setRecordingFile,
          setMaxCompletedStep,
          stepsLength: steps.length,
        });
      })
      .catch(() => {
        if (!cancelled) {
          toast({
            variant: 'destructive',
            title: t('validation_error_title'),
            description: t('editSeminar_load_failed') ?? 'Could not load seminar details.',
          });
          onOpenChange(false);
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when seminar id or open state changes
  }, [open, isEditMode, seminar?.id, steps.length, resetAddForm]);

  const introVideoPlayUrl =
    introVideoBlobUrl ??
    (activeSeminar?.videoUrl && activeSeminar.id
      ? getSeminarIntroStreamUrl(activeSeminar.id)
      : null);

  const recordingPlayUrl =
    recordingBlobUrl ??
    (activeSeminar?.hasRecording && activeSeminar.id
      ? getSeminarRecordingStreamUrl(activeSeminar.id)
      : null);

  const clearNewIntroVideo = () => {
    setVideoFile(null);
    setVideoError(null);
  };

  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoError(null);
      setVideoFile(file);

      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoElement.src);
        if (videoElement.duration > 300) {
          setVideoError(t('addCourse_video_error'));
          setVideoFile(null);
        }
      };
      videoElement.src = URL.createObjectURL(file);
    }
  };


  const handleStepClick = (step: number) => {
    if (step <= maxCompletedStep) {
      setCurrentStep(step);
    }
  };
  
  const handleNext = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('validation_error_description'),
      });
      return;
    }
    if (currentStep < steps.length) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (nextStep > maxCompletedStep) {
        setMaxCompletedStep(nextStep);
      }
    }
  };

  const onPrimaryButtonClick = () => {
    if (currentStep < steps.length) {
      handleNext();
    } else {
      form.handleSubmit(handleSave)();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const [saving, setSaving] = React.useState(false);

  const handleSave = async (values: SeminarDetailsForm) => {
    const start = values.date ? new Date(values.date) : new Date();
    const end = values.endDate
      ? new Date(values.endDate)
      : new Date(start.getTime() + 2 * 60 * 60 * 1000);

    if (end <= start) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('addSeminar_validation_end_after_start'),
      });
      return;
    }

    if (values.capacity < minRegisteredCapacity) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('addSeminar_validation_capacity_registrations').replace(
          '{count}',
          String(minRegisteredCapacity)
        ),
      });
      return;
    }

    const roomId = resolveSeminarRoomId(values.roomId, rooms);
    if (values.roomId != null && values.roomId !== 'none' && roomId == null) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('addSeminar_room_invalid'),
      });
      return;
    }

    const tagsJson = tags.length > 0 ? JSON.stringify(tags) : undefined;
    const validFaqs = faqs.filter((faq) => faq.question.trim() || faq.answer.trim());
    const faqsJson = validFaqs.length > 0 ? JSON.stringify(validFaqs) : undefined;

    setSaving(true);
    try {
      if (isEditMode && activeSeminar) {
        await apiUpdateSeminar({
          id: Number(activeSeminar.id),
          title: values.title.trim(),
          description: values.description,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          capacity: values.capacity,
          price: values.price,
          isFree: Boolean(values.isFree),
          status: values.status,
          isPublic: Boolean(values.isPublic),
          roomId,
          tagsJson: tagsJson ?? null,
          prerequisites: prerequisites.trim() || null,
          faqsJson: faqsJson ?? null,
          thumbnailUrl: activeSeminar.thumbnailUrl ?? null,
          videoUrl: activeSeminar.videoUrl ?? null,
          recordingVideoUrl: activeSeminar.recordingVideoUrl ?? null,
          entryLink: activeSeminar.entryLink ?? null,
        });
        if (thumbnailFile || videoFile || recordingFile) {
          await uploadSeminarMedia(Number(activeSeminar.id), {
            thumbnailFile: thumbnailFile ?? null,
            videoFile: videoFile ?? null,
            recordingFile: recordingFile ?? null,
            mediaKind: recordingFile ? 'recording' : 'intro',
          });
        }
        toast({
          title: t('editSeminar_toast_success_title'),
          description: t('editSeminar_toast_success_description'),
        });
      } else {
        const newId = await apiAddSeminar({
          title: values.title.trim(),
          description: values.description,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          capacity: values.capacity,
          price: values.price,
          isFree: Boolean(values.isFree),
          status: values.status,
          isPublic: Boolean(values.isPublic),
          roomId,
          tagsJson: tagsJson ?? null,
          prerequisites: prerequisites.trim() || null,
          faqsJson: faqsJson ?? null,
        });
        if (thumbnailFile || videoFile) {
          await uploadSeminarMedia(Number(newId), {
            thumbnailFile: thumbnailFile ?? null,
            videoFile: videoFile ?? null,
          });
        }
        toast({
          title: t('addSeminar_toast_success_title'),
          description: t('addSeminar_toast_success_description'),
        });
        resetAddForm();
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: (err as Error)?.message ?? t('addSeminar_save_failed'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('editSeminar_title') : t('addSeminar_title')}</DialogTitle>
          <DialogDescription>{isEditMode ? t('editSeminar_description') : t('addSeminar_description')}</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto pr-6 py-4 -mr-6 relative">
          {detailLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-md bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {t('editSeminar_loading') ?? 'Loading seminar…'}
              </p>
            </div>
          )}
          <div className={cn('flex justify-between items-start mb-8 ml-3', detailLoading && 'pointer-events-none opacity-40')}>
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
            <form
              onSubmit={(e) => { e.preventDefault(); onPrimaryButtonClick(); }}
              className={cn('space-y-6 ml-3', detailLoading && 'pointer-events-none opacity-40')}
            >
              <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addSeminar_seminar_title_label')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('addSeminar_seminar_title_placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>{t('addSeminar_datetime_label')}</FormLabel>
                          <FormControl>
                            <LocalizedDateTimePicker
                              value={field.value}
                              onChange={field.onChange}
                              placeholder={t('addSeminar_datetime_placeholder')}
                              disableDate={
                                isEditMode
                                  ? undefined
                                  : (date) => {
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);
                                      return date < today;
                                    }
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('addSeminar_location_label')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('addSeminar_location_placeholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="roomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addSeminar_room_label') ?? 'اتاق گفتگو آنلاین'}</FormLabel>
                        <Select
                          dir={direction}
                          onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                          value={field.value != null ? String(field.value) : 'none'}
                          disabled={roomsLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={roomsLoading ? '...' : (t('addSeminar_room_placeholder') ?? 'بدون اتاق')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">{t('addSeminar_room_none') ?? 'بدون اتاق'}</SelectItem>
                            {rooms.map((r) => (
                              <SelectItem key={r.roomId} value={String(r.roomId)}>{r.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('addSeminar_end_datetime_label')}</FormLabel>
                          <FormControl>
                            <LocalizedDateTimePicker
                              value={field.value}
                              onChange={field.onChange}
                              placeholder={t('addSeminar_end_datetime_placeholder')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('addSeminar_capacity_label')}</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('addSeminar_price_label')}</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('addSeminar_status_label')}</FormLabel>
                          <Select dir={direction} onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">{t('seminar_status_draft')}</SelectItem>
                              <SelectItem value="1">{t('seminar_status_published')}</SelectItem>
                              <SelectItem value="2">{t('seminar_status_ongoing')}</SelectItem>
                              <SelectItem value="3">{t('seminar_status_completed')}</SelectItem>
                              <SelectItem value="4">{t('seminar_status_cancelled')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isFree"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 pt-8">
                          <FormControl>
                            <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                          </FormControl>
                          <FormLabel className="!mt-0">{t('addSeminar_is_free_label')}</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 pt-8">
                          <FormControl>
                            <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                          </FormControl>
                          <FormLabel className="!mt-0">{t('addSeminar_is_public_label')}</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('addCourse_category_label')}</FormLabel>
                          <Select dir={direction} onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('addCourse_category_placeholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map((cat) => (
                                  <SelectItem key={cat.categoryId} value={String(cat.categoryId)}>
                                    {cat.categoryName}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('addCourse_level_label')}</FormLabel>
                          <Select dir={direction} onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('addCourse_level_placeholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">{t('level_beginner')}</SelectItem>
                              <SelectItem value="intermediate">{t('level_intermediate')}</SelectItem>
                              <SelectItem value="advanced">{t('level_advanced')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('addCourse_language_label')}</FormLabel>
                          <Select dir={direction} onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('addCourse_language_placeholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="en">{t('language_en')}</SelectItem>
                              <SelectItem value="fa">{t('language_fa')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('addSeminar_description_label')}</FormLabel>
                        <FormControl>
                          <CustomRichTextEditor
                            content={field.value}
                            onChangeAction={field.onChange}
                            placeholder={t('addSeminar_description_placeholder')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                <div className="space-y-8">
                  <div>
                    <Label htmlFor="seminar-thumbnail-upload" className="text-base font-medium">{t('addSeminar_thumbnail_label')}</Label>
                    <p className="text-sm text-muted-foreground mb-2">{t('addSeminar_thumbnail_description')}</p>
                    <div className="mt-2 rounded-lg border border-dashed border-input px-6 py-8">
                      <div className="mx-auto max-w-md text-center">
                        {imagePreview ? (
                          <div className="relative mx-auto aspect-video w-full max-w-sm overflow-hidden rounded-md border bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imagePreview}
                              alt={t('addSeminar_thumbnail_label')}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <DefaultSeminarImage className="mx-auto max-w-xs aspect-video" />
                        )}
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Label
                            htmlFor="seminar-thumbnail-upload"
                            className="cursor-pointer rounded-md bg-background px-3 py-1.5 font-semibold text-primary ring-offset-background hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {imagePreview ? (t('replace_image') ?? 'Replace image') : t('upload_file')}
                            <Input id="seminar-thumbnail-upload" name="thumbnail-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                          </Label>
                          <span className="text-muted-foreground">{t('drag_and_drop')}</span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{t('image_upload_specs_full')}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="seminar-video-upload" className="text-base font-medium">{t('addSeminar_video_label')}</Label>
                    <p className="text-sm text-muted-foreground mb-2">{t('addSeminar_video_description')}</p>
                    <div className="mt-2 space-y-4 rounded-lg border border-dashed border-input px-6 py-8">
                      {introVideoPlayUrl ? (
                        <div className="mx-auto max-w-lg space-y-3">
                          <video
                            key={introVideoPlayUrl}
                            src={introVideoPlayUrl}
                            controls
                            playsInline
                            preload="metadata"
                            className="aspect-video w-full rounded-md border bg-black"
                          />
                          <p className="text-center text-xs text-muted-foreground">
                            {videoFile
                              ? (t('addSeminar_video_new_preview') ?? 'New video (not saved until you click Save)')
                              : (t('addSeminar_video_saved') ?? 'Current introduction video')}
                          </p>
                          <div className="flex flex-wrap justify-center gap-2">
                            <Label
                              htmlFor="seminar-video-upload"
                              className="inline-flex cursor-pointer items-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                            >
                              {t('addSeminar_video_replace') ?? 'Replace video'}
                              <Input id="seminar-video-upload" name="video-upload" type="file" className="sr-only" accept="video/*" onChange={handleVideoChange} />
                            </Label>
                            {videoFile && (
                              <Button type="button" variant="outline" size="sm" onClick={clearNewIntroVideo}>
                                {t('addSeminar_video_revert') ?? 'Use saved video'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <FileVideo className="mx-auto h-12 w-12 text-muted-foreground" />
                          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
                            <Label
                              htmlFor="seminar-video-upload"
                              className="cursor-pointer rounded-md bg-background px-3 py-1.5 font-semibold text-primary hover:text-primary/80"
                            >
                              <span>{t('upload_video')}</span>
                              <Input id="seminar-video-upload" name="video-upload" type="file" className="sr-only" accept="video/*" onChange={handleVideoChange} />
                            </Label>
                            <span>{t('drag_and_drop')}</span>
                          </div>
                        </div>
                      )}
                      <p className="text-center text-xs text-muted-foreground">{t('video_upload_specs')}</p>
                      {videoFile && !videoError && (
                        <p className="text-center text-sm text-green-600">{t('selected_video')}: {videoFile.name}</p>
                      )}
                      {videoError && <p className="text-center text-sm text-destructive">{videoError}</p>}
                    </div>
                  </div>

                  {(form.watch('status') === 3 || activeSeminar?.status === 'Completed') && (
                    <div>
                      <Label htmlFor="seminar-recording-upload" className="text-base font-medium">
                        {t('addSeminar_recording_label') ?? 'Recorded seminar video (after event)'}
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('addSeminar_recording_description') ??
                          'Upload only after the seminar has ended. Registered students can watch on the client site.'}
                      </p>
                      <div className="mt-2 space-y-4 rounded-lg border border-dashed border-input px-6 py-8">
                        {recordingPlayUrl && (
                          <div className="mx-auto max-w-lg">
                            <video
                              key={recordingPlayUrl}
                              src={recordingPlayUrl}
                              controls
                              playsInline
                              preload="metadata"
                              className="aspect-video w-full rounded-md border bg-black"
                            />
                          </div>
                        )}
                        <div className="text-center">
                          <Label
                            htmlFor="seminar-recording-upload"
                            className="inline-flex cursor-pointer rounded-md bg-background px-3 py-2 font-semibold text-primary hover:text-primary/80"
                          >
                            <span>{recordingPlayUrl ? (t('replace_video') ?? 'Replace recording') : t('upload_video')}</span>
                            <Input
                              id="seminar-recording-upload"
                              type="file"
                              className="sr-only"
                              accept="video/*"
                              onChange={(e) => setRecordingFile(e.target.files?.[0] ?? null)}
                            />
                          </Label>
                          {recordingFile && (
                            <p className="mt-2 text-sm text-green-600">{recordingFile.name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {currentStep === 3 && (
                <AdditionalInformation
                  tags={tags}
                  setTags={setTags}
                  tagInput={tagInput}
                  setTagInput={setTagInput}
                  prerequisites={prerequisites}
                  setPrerequisites={setPrerequisites}
                  faqs={faqs}
                  setFaqs={setFaqs}
                />
              )}

              <DialogFooter className="mt-auto pt-4 border-t">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={handleBack} type="button">
                    {t('back_button')}
                  </Button>
                )}
                <Button type="button" onClick={onPrimaryButtonClick} disabled={saving || detailLoading}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentStep < steps.length
                    ? t('next_button')
                    : isEditMode
                    ? t('save_changes')
                    : t('save_seminar_button')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
