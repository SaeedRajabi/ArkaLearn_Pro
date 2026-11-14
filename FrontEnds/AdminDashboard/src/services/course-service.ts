import type { Course } from '@/lib/types';
import {CourseAddedStringResponseType, PagedData, ResponseMessageType} from "@/lib/responseTypes";
import courseEndpoints from "@/endpoints/courseEndpoints";
import apiClient from "@/lib/apiClient";
import { unwrapApiList } from '@/lib/api/normalize-list';
import { apiWriteUpdate } from '@/lib/api-write';
import {
    getCommandMessages,
    getCommandStatus,
    getUserFacingApiErrorMessage,
    isDuplicateTitleResponse,
} from '@/lib/api-command-result';

const API_STATUS_OK = 1;

export const getCourseById = async (courseId: string): Promise<Course | null> => {
    const queryParams = new URLSearchParams({
        CourseId: courseId.toString(),
        // Add other params if needed by backend, though CourseId should be enough
    });

    return await apiClient.get(`${courseEndpoints.GetById}?${queryParams.toString()}`, {
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true,
    }).then(response => {
        const d = response.data;
        if (response.status === 204 || d === '' || d == null) return null;
        return d;
    }).catch(error => {
        console.error(error);
        if ((error as any).response?.status !== 401) {
            return null; // Or handle error appropriately
        }
        return null;
    });
};

export const getCourses = async (
    searchTerm= "",
    pageNumber = 1,
    pageSize = 10,
    skipCount = 0,
    needTotalCount = true,
    sortBy= "",
    sortAscending = true
): Promise<PagedData<Course>> => {
    const queryParams = new URLSearchParams({
        inputValue: searchTerm,
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString(),
        skipCount: skipCount.toString(),
        needTotalCount: needTotalCount.toString(),
        sortBy: sortBy,
        sortAscending: sortAscending.toString()
    });

    return  await apiClient.get(`${courseEndpoints.Search}?${queryParams.toString()}`, {
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials : true,
    }).then(response => {
        return  response.data;
    }).catch(error => {
        console.error(error);
        if ((error as any).response?.status !== 401) {
            return {
                action: "destructive",
                title: 'save_error_title',
                description: 'save_error_description'
            };
        }
    });
};

export async function addCourses(formData: FormData): Promise<ResponseMessageType | undefined> {

    try {
        const response = await apiClient.post(courseEndpoints.Add, formData, { withCredentials: true });
        if (isDuplicateTitleResponse(response.data)) {
            return {
                action: 'destructive',
                title: 'duplicate_title_title',
                description: 'duplicate_title_description',
            };
        }
        if (response.status === 200 || response.status === 201 || response.status === 202) {
            return {
                action: 'default',
                title: 'addCourse_toast_success_title',
                description: 'addCourse_toast_success_description',
            };
        }
        return {
            action: 'destructive',
            title: 'save_error_title',
            description: 'save_error_description',
        };
    } catch (error) {
        console.error('Error adding course:', error);
        if ((error as { response?: { status?: number } })?.response?.status === 401) return;
        const msg = getUserFacingApiErrorMessage(error, 'save_error_description');
        return {
            action: 'destructive',
            title: isDuplicateTitleResponse((error as { response?: { data?: unknown } })?.response?.data)
                ? 'duplicate_title_title'
                : 'save_error_title',
            description: msg || (isDuplicateTitleResponse((error as { response?: { data?: unknown } })?.response?.data)
                ? 'duplicate_title_description'
                : 'save_error_description'),
        };
    }
}

export async function deleteCoursePermanently(courseId: string | number): Promise<void> {
    await apiClient.delete(courseEndpoints.Delete, {
        params: { courseId },
        withCredentials: true,
    });
}

export type CourseFormPayload = {
    title: string;
    shortDescription?: string;
    description: string;
    level: string;
    language?: 'fa' | 'en' | string;
    price: number;
    originalPrice?: number;
    paymentType?: 'cash' | 'installment';
    installmentPlans?: {
        installmentNumber: number;
        amountToman: number;
        dueDateUtc?: string | Date | null;
    }[];
    category: string;
    status: 'Published' | 'Draft';
    degreeRequired?: boolean;
    tags?: string[];
    prerequisites?: string;
    faqs?: { id: string; question: string; answer: string }[];
    sections?: { id: string; title: string; lessons: {
        id: string;
        title: string;
        videoTitle?: string;
        videoUrl?: string;
        durationSeconds?: number;
        hasVideo?: boolean;
        videoFile?: File;
        mediaAssetId?: number | string;
        removeVideo?: boolean;
        isPublished?: boolean;
    }[] }[];
    thumbnailUrl?: File | string;
    videoUrl?: File | string;
    introVideoDurationSeconds?: number;
    deliveryMode?: 'directDownload' | 'desktopLicense';
    lifecyclePhase?: 'notStarted' | 'inProgress' | 'ended';
    registrationClosed?: boolean;
    registrationDeadlineUtc?: string | Date;
    courseStartUtc?: string | Date;
    courseEndUtc?: string | Date;
    seoTitle?: string | null;
    metaDescription?: string | null;
    ogImageUrl?: string | null;
};

function appendCourseFormFields(formData: FormData, course: CourseFormPayload, courseId?: string) {
    if (courseId) {
        formData.append('CourseId', String(courseId));
    }
    formData.append('Title', course.title);
    formData.append('Description', course.shortDescription ?? '');
    formData.append('LongDescription', course.description);
    formData.append('CourseLevel', (course.level || 'beginner').trim().toLowerCase());
    formData.append('Language', (course.language || 'fa').trim().toLowerCase());
    formData.append('CoursePrice', course.price.toString());
    if (course.originalPrice != null && course.originalPrice > 0) {
        formData.append('OriginalPrice', course.originalPrice.toString());
    }
    formData.append('CategoryId', course.category);
    formData.append('IsPublish', course.status === 'Published' ? 'true' : 'false');
    formData.append('IsCertificate', course.degreeRequired === true ? 'true' : 'false');
    formData.append('DeliveryMode', course.deliveryMode ?? 'directDownload');
    formData.append('LifecyclePhase', course.lifecyclePhase ?? 'notStarted');
    formData.append('IsRegistrationClosed', course.registrationClosed === true ? 'true' : 'false');
    if (course.registrationDeadlineUtc) {
        formData.append('RegistrationDeadlineUtc', new Date(course.registrationDeadlineUtc).toISOString());
    }
    if (course.courseStartUtc) {
        formData.append('CourseStartUtc', new Date(course.courseStartUtc).toISOString());
    }
    if (course.courseEndUtc) {
        formData.append('CourseEndUtc', new Date(course.courseEndUtc).toISOString());
    }

    if (course.thumbnailUrl instanceof File) {
        formData.append('TitleImage', course.thumbnailUrl);
    } else if (typeof course.thumbnailUrl === 'string' && course.thumbnailUrl.trim()) {
        formData.append('TitleImageUrl', course.thumbnailUrl.trim());
    }
    if (course.videoUrl instanceof File) {
        formData.append('VideoInfo', course.videoUrl);
    } else if (typeof course.videoUrl === 'string' && course.videoUrl.trim()) {
        const introUrl = course.videoUrl.trim();
        // Never send desktop-DRM schemes as course intro; they are not web-playable.
        if (!introUrl.toLowerCase().startsWith('drm://')) {
            formData.append('VideoInfoUrl', introUrl);
        }
    }
    if (course.introVideoDurationSeconds != null && course.introVideoDurationSeconds > 0) {
        formData.append('IntroVideoDurationSeconds', String(course.introVideoDurationSeconds));
    }

    formData.append('SessionsJson', JSON.stringify((course.sections ?? []).map((section) => ({
        id: section.id,
        title: section.title,
        lessons: (section.lessons ?? []).map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            videoTitle: lesson.videoTitle ?? lesson.title,
            videoUrl: lesson.videoFile ? undefined : lesson.videoUrl,
            mediaAssetId: lesson.mediaAssetId != null && Number(lesson.mediaAssetId) > 0
                ? Number(lesson.mediaAssetId)
                : undefined,
            durationSeconds: lesson.durationSeconds ?? 0,
            removeVideo: lesson.removeVideo === true,
            isPublished: lesson.isPublished === true,
        })),
    }))));
    formData.append('KeywordsJson', JSON.stringify(course.tags ?? []));
    formData.append('PaymentType', course.paymentType === 'installment' ? 'Installment' : 'Cash');
    if (course.paymentType === 'installment' && course.installmentPlans?.length) {
        formData.append(
            'InstallmentPlansJson',
            JSON.stringify(
                course.installmentPlans.map((p) => ({
                    installmentNumber: p.installmentNumber,
                    amountToman: Number(p.amountToman) || 0,
                    dueDateUtc:
                        p.installmentNumber === 1 || !p.dueDateUtc
                            ? null
                            : new Date(p.dueDateUtc).toISOString(),
                }))
            )
        );
    } else {
        formData.append('InstallmentPlansJson', '[]');
    }
    if (course.seoTitle) formData.append('SeoTitle', course.seoTitle);
    if (course.metaDescription) formData.append('MetaDescription', course.metaDescription);
    if (course.ogImageUrl) formData.append('OgImageUrl', course.ogImageUrl);

    for (const section of course.sections ?? []) {
        for (const lesson of section.lessons ?? []) {
            if (lesson.videoFile instanceof File) {
                formData.append(`lessonVideo_${lesson.id}`, lesson.videoFile);
                formData.append(`lessonVideoDuration_${lesson.id}`, String(lesson.durationSeconds ?? 0));
                if (lesson.videoTitle) {
                    formData.append(`lessonVideoTitle_${lesson.id}`, lesson.videoTitle);
                }
            }
        }
    }

    const prerequisitesArray = course.prerequisites
        ?.toString()
        .split(/[\r\n;؛]+/)
        .map((x) => x.trim())
        .map((x) => (x.length > 100 ? x.slice(0, 100).trim() : x))
        .filter((x) => x.length > 0) ?? [];

    formData.append('DependenciesJson', JSON.stringify(prerequisitesArray));
    formData.append('QuestionJson', JSON.stringify(course.faqs ?? []));
}

export function buildCourseFormData(course: CourseFormPayload, options?: { courseId?: string; userId?: string; teacherId?: string }) {
    const formData = new FormData();
    if (options?.userId) formData.append('UserId', options.userId);
    if (options?.teacherId) formData.append('TeacherId', options.teacherId);
    appendCourseFormFields(formData, course, options?.courseId);
    return formData;
}

export async function updateCourses(
    courseId: string,
    course: CourseFormPayload,
): Promise<ResponseMessageType | undefined> {
    const formData = buildCourseFormData(course, { courseId });

    try {
        const response = await apiWriteUpdate(courseEndpoints.Update, formData, { withCredentials: true });
        const body = response.data;
        if (isDuplicateTitleResponse(body)) {
            return {
                action: 'destructive',
                title: 'duplicate_title_title',
                description: 'duplicate_title_description',
            };
        }
        const status = getCommandStatus(body);
        if (status === API_STATUS_OK || response.status === 200 || response.status === 201 || response.status === 202) {
            return {
                action: 'default',
                title: 'editCourse_toast_success_title',
                description: 'editCourse_toast_success_description',
            };
        }
        return {
            action: 'destructive',
            title: 'save_error_title',
            description: 'save_error_description',
        };
    } catch (error) {
        console.error('Error updating course:', error);
        if ((error as { response?: { status?: number } })?.response?.status === 401) return;
        const msg = getUserFacingApiErrorMessage(error, 'save_error_description');
        return {
            action: 'destructive',
            title: isDuplicateTitleResponse((error as { response?: { data?: unknown } })?.response?.data)
                ? 'duplicate_title_title'
                : 'save_error_title',
            description:
                msg ||
                (isDuplicateTitleResponse((error as { response?: { data?: unknown } })?.response?.data)
                    ? 'duplicate_title_description'
                    : 'save_error_description'),
        };
    }
}

export type PendingCourseModerationDto = {
  itemType: 'course' | 'lesson_video' | string;
  courseId: number;
  lessonId?: number;
  teacherId: number;
  teacherUserId?: number;
  teacherDisplayName: string;
  teacherUserName: string;
  title: string;
  courseTitle?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  submittedAtUtc?: string;
};

function mapPendingCourseModeration(raw: Record<string, unknown>): PendingCourseModerationDto {
  return {
    itemType: String(raw.itemType ?? raw.ItemType ?? ''),
    courseId: Number(raw.courseId ?? raw.CourseId ?? 0),
    lessonId: Number(raw.lessonId ?? raw.LessonId ?? 0) || undefined,
    teacherId: Number(raw.teacherId ?? raw.TeacherId ?? 0),
    teacherUserId: Number(raw.teacherUserId ?? raw.TeacherUserId ?? 0) || undefined,
    teacherDisplayName: String(raw.teacherDisplayName ?? raw.TeacherDisplayName ?? ''),
    teacherUserName: String(raw.teacherUserName ?? raw.TeacherUserName ?? ''),
    title: String(raw.title ?? raw.Title ?? ''),
    courseTitle: String(raw.courseTitle ?? raw.CourseTitle ?? '') || undefined,
    previewUrl: String(raw.previewUrl ?? raw.PreviewUrl ?? '') || undefined,
    thumbnailUrl: String(raw.thumbnailUrl ?? raw.ThumbnailUrl ?? '') || undefined,
    submittedAtUtc: String(raw.submittedAtUtc ?? raw.SubmittedAtUtc ?? '') || undefined,
  };
}

export async function getPendingCourseModeration(): Promise<PendingCourseModerationDto[]> {
  const response = await apiClient.get<unknown>(courseEndpoints.GetPendingModeration, {
    withCredentials: true,
  });
  return unwrapApiList<Record<string, unknown>>(response.data).map(mapPendingCourseModeration);
}

export async function reviewCourseModeration(payload: {
  itemType: string;
  courseId: number;
  lessonId?: number;
  approve: boolean;
  rejectionNote?: string;
}): Promise<void> {
  await apiWriteUpdate(courseEndpoints.ReviewModeration, {
    ItemType: payload.itemType,
    CourseId: payload.courseId,
    LessonId: payload.lessonId ?? null,
    Approve: payload.approve,
    RejectionNote: payload.rejectionNote ?? '',
  });
}