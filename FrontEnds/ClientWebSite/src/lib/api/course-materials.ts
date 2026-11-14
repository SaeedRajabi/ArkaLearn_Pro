import { asLongId } from '@/lib/id';
import { apiRequest, buildQuery } from './client';
import { uploadMediaAsset } from './media';

export const COURSE_MATERIAL_ACCEPT =
  '.pdf,application/pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z';

export type CourseCurriculumMaterial = {
  id: string;
  courseId: string;
  courseSectionId: string;
  courseLessonId: string | null;
  mediaAssetId: string;
  displayName: string;
  sortOrder: number;
  originalFileName?: string | null;
  fileSizeBytes?: number | null;
  isEncrypted: boolean;
};

function unwrapList(raw: unknown): Record<string, unknown>[] {
  let current: unknown = raw;
  for (let depth = 0; depth < 5; depth += 1) {
    if (Array.isArray(current)) return current as Record<string, unknown>[];
    if (!current || typeof current !== 'object') return [];
    const record = current as Record<string, unknown>;
    current =
      record._data ??
      record.data ??
      record.Data ??
      record.queryResult ??
      record.QueryResult ??
      record.items ??
      record.Items;
  }
  return [];
}

function normalizeMaterial(raw: Record<string, unknown>): CourseCurriculumMaterial {
  const lessonId = raw.courseLessonId ?? raw.CourseLessonId;
  return {
    id: asLongId(raw.id ?? raw.Id),
    courseId: asLongId(raw.courseId ?? raw.CourseId),
    courseSectionId: asLongId(raw.courseSectionId ?? raw.CourseSectionId),
    courseLessonId: lessonId == null ? null : asLongId(lessonId),
    mediaAssetId: asLongId(raw.mediaAssetId ?? raw.MediaAssetId),
    displayName: String(raw.displayName ?? raw.DisplayName ?? ''),
    sortOrder: Number(raw.sortOrder ?? raw.SortOrder ?? 0),
    originalFileName: (raw.originalFileName ?? raw.OriginalFileName) as
      | string
      | null
      | undefined,
    fileSizeBytes: (raw.fileSizeBytes ?? raw.FileSizeBytes) as number | null | undefined,
    isEncrypted: Boolean(raw.isEncrypted ?? raw.IsEncrypted),
  };
}

export async function listCourseCurriculumMaterials(
  courseId: string
): Promise<CourseCurriculumMaterial[]> {
  const raw = await apiRequest<unknown>(
    `CourseMaterial/List${buildQuery({ courseId: asLongId(courseId) })}`
  );
  return unwrapList(raw).map(normalizeMaterial);
}

export async function createCourseCurriculumMaterial(input: {
  courseId: string;
  courseSectionId: string;
  courseLessonId?: string | null;
  mediaAssetId: string;
  displayName: string;
}): Promise<string> {
  const raw = await apiRequest<unknown>('CourseMaterial/Create', {
    method: 'POST',
    body: {
      courseId: Number(asLongId(input.courseId)),
      courseSectionId: Number(asLongId(input.courseSectionId)),
      courseLessonId: input.courseLessonId
        ? Number(asLongId(input.courseLessonId))
        : null,
      mediaAssetId: Number(asLongId(input.mediaAssetId)),
      displayName: input.displayName,
    },
  });

  let current: unknown = raw;
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current === 'string' || typeof current === 'number') return asLongId(current);
    if (!current || typeof current !== 'object') break;
    const record = current as Record<string, unknown>;
    current =
      record._data ??
      record.data ??
      record.Data ??
      record.commandResult ??
      record.CommandResult;
  }
  return '0';
}

export async function deleteCourseCurriculumMaterial(id: string): Promise<void> {
  await apiRequest('CourseMaterial/Delete', {
    method: 'POST',
    body: { materialId: Number(asLongId(id)) },
  });
}

export async function uploadAndAttachCourseMaterial(
  input: {
    courseId: string;
    courseSectionId: string;
    courseLessonId?: string | null;
    file: File;
    encryptForDesktop?: boolean;
  },
  onProgress?: (percent: number) => void
): Promise<string> {
  const uploaded = await uploadMediaAsset(
    {
      file: input.file,
      title: input.file.name,
      encryptForDesktop: input.encryptForDesktop,
    },
    onProgress
  );

  return createCourseCurriculumMaterial({
    courseId: input.courseId,
    courseSectionId: input.courseSectionId,
    courseLessonId: input.courseLessonId,
    mediaAssetId: asLongId(uploaded.id),
    displayName: input.file.name,
  });
}
