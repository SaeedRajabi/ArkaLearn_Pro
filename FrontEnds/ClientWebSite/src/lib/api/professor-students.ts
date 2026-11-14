import { apiRequest, buildQuery } from './client';

import { unwrapApiList } from '@/lib/api/normalize-list';

import { normalizePagedResponse, type PagedData } from './types';

import { asLongId, isValidLongId } from '@/lib/id';



const BASE = 'Course';

const DEFAULT_PAGE_SIZE = 8;



export type ProfessorEnrolledStudent = {

  studentId: number;

  userId: string;

  fullName: string;

  userName?: string;

  email?: string;

  courseId: number;

  courseTitle: string;

  enrollmentDateTime: string;

  isActive: boolean;

};



function mapRow(row: Record<string, unknown>): ProfessorEnrolledStudent {

  return {

    studentId: Number(row.studentId ?? row.StudentId ?? 0),

    userId: asLongId(row.userId ?? row.UserId),

    fullName: String(row.fullName ?? row.FullName ?? ''),

    userName: row.userName != null ? String(row.userName) : row.UserName != null ? String(row.UserName) : undefined,

    email: row.email != null ? String(row.email) : row.Email != null ? String(row.Email) : undefined,

    courseId: Number(row.courseId ?? row.CourseId ?? 0),

    courseTitle: String(row.courseTitle ?? row.CourseTitle ?? ''),

    enrollmentDateTime: String(row.enrollmentDateTime ?? row.EnrollmentDateTime ?? ''),

    isActive: Boolean(row.isActive ?? row.IsActive ?? true),

  };

}



export type ProfessorStudent = {

  studentId: number;

  userId: string;

  fullName: string;

  userName?: string;

  email?: string;

  phoneNumber?: string;

  sourceType: 'course' | 'seminar';

  sourceId: number;

  sourceTitle: string;

  registeredAt: string;

  isActive: boolean;

  managedRoomStudentId?: number | null;

};



function mapStudentRow(row: Record<string, unknown>): ProfessorStudent {

  const sourceTypeRaw = String(row.sourceType ?? row.SourceType ?? 'course').toLowerCase();

  return {

    studentId: Number(row.studentId ?? row.StudentId ?? 0),

    userId: asLongId(row.userId ?? row.UserId),

    fullName: String(row.fullName ?? row.FullName ?? ''),

    userName: row.userName != null ? String(row.userName) : row.UserName != null ? String(row.UserName) : undefined,

    email: row.email != null ? String(row.email) : row.Email != null ? String(row.Email) : undefined,

    phoneNumber:

      row.phoneNumber != null

        ? String(row.phoneNumber)

        : row.PhoneNumber != null

          ? String(row.PhoneNumber)

          : undefined,

    sourceType: sourceTypeRaw === 'seminar' ? 'seminar' : 'course',

    sourceId: Number(row.sourceId ?? row.SourceId ?? 0),

    sourceTitle: String(row.sourceTitle ?? row.SourceTitle ?? ''),

    registeredAt: String(row.registeredAt ?? row.RegisteredAt ?? ''),

    isActive: Boolean(row.isActive ?? row.IsActive ?? true),

    managedRoomStudentId: row.managedRoomStudentId ?? row.ManagedRoomStudentId

      ? Number(row.managedRoomStudentId ?? row.ManagedRoomStudentId)

      : null,

  };

}



export async function searchProfessorStudents(params?: {

  search?: string;

  pageNumber?: number;

  pageSize?: number;

}): Promise<PagedData<ProfessorStudent>> {

  const pageNumber = params?.pageNumber ?? 1;

  const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE;

  const raw = await apiRequest<unknown>(

    `${BASE}/GetMyStudents${buildQuery({

      inputValue: params?.search?.trim() ?? '',

      pageNumber,

      pageSize,

      needTotalCount: true,

      skipCount: (pageNumber - 1) * pageSize,

    })}`

  );

  const paged = normalizePagedResponse<Record<string, unknown>>(raw as never);

  return {

    ...paged,

    queryResult: paged.queryResult

      .map(mapStudentRow)

      .filter((s) => isValidLongId(s.userId) && s.sourceId > 0),

  };

}



export async function getProfessorEnrolledStudents(): Promise<ProfessorEnrolledStudent[]> {

  const raw = await apiRequest<unknown>(`${BASE}/GetMyEnrolledStudents`);

  return unwrapApiList<Record<string, unknown>>(raw)

    .map(mapRow)

    .filter((s) => s.studentId > 0 && s.courseId > 0);

}



export type PortalStudentRoomProfile = {

  portalUserId: string;

  managedRoomStudentId?: number | null;

  firstName: string;

  lastName: string;

  roomUserName?: string | null;

  email?: string | null;

  phone?: string | null;

};



function unwrapApiRecord(raw: unknown): Record<string, unknown> {

  if (!raw || typeof raw !== 'object') return {};

  let cur: unknown = raw;

  for (let depth = 0; depth < 4; depth += 1) {

    if (!cur || typeof cur !== 'object') break;

    const row = cur as Record<string, unknown>;

    if (

      row.portalUserId != null ||

      row.PortalUserId != null ||

      row.id != null ||

      row.Id != null

    ) {

      return row;

    }

    cur = row.data ?? row.Data ?? row.queryResult ?? row.QueryResult;

  }

  return typeof raw === 'object' && raw ? (raw as Record<string, unknown>) : {};

}



function mapPortalProfile(raw: unknown, fallbackPortalUserId?: string): PortalStudentRoomProfile {

  const item = unwrapApiRecord(raw);

  const portalUserId = asLongId(

    item.portalUserId ?? item.PortalUserId ?? fallbackPortalUserId ?? 0

  );

  if (!isValidLongId(portalUserId)) {

    throw new Error('INVALID_PROFILE');

  }

  return {

    portalUserId,

    managedRoomStudentId:

      item.managedRoomStudentId != null || item.ManagedRoomStudentId != null

        ? Number(item.managedRoomStudentId ?? item.ManagedRoomStudentId)

        : null,

    firstName: String(item.firstName ?? item.FirstName ?? ''),

    lastName: String(item.lastName ?? item.LastName ?? ''),

    roomUserName: (item.roomUserName ?? item.RoomUserName ?? null) as string | null,

    email: (item.email ?? item.Email ?? null) as string | null,

    phone: (item.phone ?? item.Phone ?? null) as string | null,

  };

}



export async function getPortalStudentRoomProfile(portalUserId: string): Promise<PortalStudentRoomProfile> {

  const raw = await apiRequest<unknown>(

    `ManagedRoomStudent/GetPortalRoomProfile${buildQuery({ portalUserId })}`

  );

  return mapPortalProfile(raw, portalUserId);

}



export async function upsertPortalStudentRoomProfile(payload: {

  portalUserId: string;

  firstName: string;

  lastName: string;

  roomUserName: string;

  password?: string | null;

}): Promise<number> {

  const raw = await apiRequest<unknown>('ManagedRoomStudent/UpsertPortalRoomProfile', {

    method: 'POST',

    body: payload,

  });

  if (typeof raw === 'number') return raw;

  const obj = raw as Record<string, unknown>;

  return Number(obj?.data ?? obj?.Data ?? raw);

}



export async function removeTeacherStudent(portalUserId: string): Promise<void> {

  await apiRequest('Course/RemoveMyStudent', {

    method: 'POST',

    body: { portalUserId },

  });

}

