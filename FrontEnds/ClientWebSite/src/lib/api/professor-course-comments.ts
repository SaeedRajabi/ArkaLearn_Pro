import { apiRequest, buildQuery } from './client';
import { unwrapApiList } from '@/lib/api/normalize-list';
import {
  addCourseComment,
  approveCourseComment,
  deleteCourseComment,
  type CourseCommentQri,
} from '@/lib/api/courses';

const BASE = 'Course';

export type ProfessorCourseComment = CourseCommentQri;

function mapComment(row: Record<string, unknown>): ProfessorCourseComment {
  const author = (row.author ?? row.Author) as Record<string, unknown> | undefined;
  const replies = row.replies ?? row.Replies;

  return {
    id: Number(row.id ?? row.Id ?? 0),
    courseId: Number(row.courseId ?? row.CourseId ?? 0),
    courseTitle: String(row.courseTitle ?? row.CourseTitle ?? ''),
    rating: Number(row.rating ?? row.Rating ?? 0),
    text: String(row.text ?? row.Text ?? ''),
    likes: Number(row.likes ?? row.Likes ?? 0),
    isApproved: Boolean(row.isApproved ?? row.IsApproved),
    timeStamp: String(row.timeStamp ?? row.TimeStamp ?? ''),
    parentId: row.parentId != null ? Number(row.parentId) : row.ParentId != null ? Number(row.ParentId) : null,
    author: author
      ? {
          id: Number(author.id ?? author.Id ?? 0),
          fullName: author.fullName != null ? String(author.fullName) : author.FullName != null ? String(author.FullName) : undefined,
          userName: author.userName != null ? String(author.userName) : author.UserName != null ? String(author.UserName) : undefined,
          avatarUrl: author.avatarUrl != null ? String(author.avatarUrl) : author.AvatarUrl != null ? String(author.AvatarUrl) : undefined,
        }
      : null,
    replies: unwrapApiList<Record<string, unknown>>(replies).map(mapComment),
  };
}

export async function getProfessorCourseComments(params?: {
  courseId?: number;
  onlyPending?: boolean;
}): Promise<ProfessorCourseComment[]> {
  const q: Record<string, string | number | boolean> = {};
  if (params?.courseId != null) q.courseId = params.courseId;
  if (params?.onlyPending != null) q.onlyPending = params.onlyPending;

  const raw = await apiRequest<unknown>(`${BASE}/GetTeacherComments${buildQuery(q)}`);
  return unwrapApiList<Record<string, unknown>>(raw)
    .map(mapComment)
    .filter((c) => c.id > 0);
}

export async function replyToCourseComment(params: {
  courseId: number;
  parentId: number;
  content: string;
}): Promise<string> {
  return addCourseComment({
    courseId: params.courseId,
    content: params.content,
    rating: 0,
    parentId: params.parentId,
  });
}

export { approveCourseComment, deleteCourseComment };
