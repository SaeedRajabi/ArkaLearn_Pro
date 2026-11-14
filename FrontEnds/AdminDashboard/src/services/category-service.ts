import type { Category, CategoryDetail } from '@/lib/types';
import { PagedData, ResponseMessageType } from '@/lib/responseTypes';
import apiClient from '@/lib/apiClient';
import { getCommandStatus, getCommandMessages, API_STATUS_EXIST } from '@/lib/api-command-result';
import { mapRawCategory } from '@/lib/category-utils';

export const getCategories = async (
  searchTerm = '',
  pageNumber = 1,
  pageSize = 500,
  skipCount = 0,
  needTotalCount = true,
  sortBy = '',
  sortAscending = true
): Promise<PagedData<Category>> => {
  try {
    const response = await apiClient.get<PagedData<Record<string, unknown>>>('/Category/SearchCategories', {
      params: {
        categoryName: searchTerm,
        pageNumber,
        pageSize,
        skipCount,
        needTotalCount,
        sortBy,
        sortAscending,
      },
    });
    return response.data as PagedData<Category>;
  } catch (error) {
    console.error('خطا در دریافت اطلاعات از API:', error);
    return {
      queryResult: { $values: [] },
      pageNumber: 1,
      pageSize: 10,
      totalCount: 0,
      skipCount: 0,
      needTotalCount: true,
      sortBy: '',
      sortAscending: true,
    };
  }
};


function unwrapQueryPayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as Record<string, unknown>;
  const nested = obj.data ?? obj.Data ?? obj.result ?? obj.Result;
  if (nested && typeof nested === 'object') return nested as Record<string, unknown>;
  return obj;
}

export async function getCategoryById(categoryId: string | number): Promise<CategoryDetail | null> {
  try {
    const response = await apiClient.get('/Category/GetById', {
      params: { categoryId },
    });
    const raw = unwrapQueryPayload(response.data);
    if (!raw) return null;

    const id = raw.id ?? raw.Id ?? raw.categoryId ?? raw.CategoryId;
    if (id == null) return null;

    const childrenRaw = raw.children ?? raw.Children;
    const childrenList = Array.isArray(childrenRaw)
      ? childrenRaw
      : childrenRaw &&
          typeof childrenRaw === 'object' &&
          Array.isArray((childrenRaw as { $values?: unknown[] }).$values)
        ? (childrenRaw as { $values: Record<string, unknown>[] }).$values
        : [];

    const mapped = mapRawCategory({
      categoryId: id,
      name: raw.categoryName ?? raw.CategoryName,
      description: raw.categoryDescription ?? raw.CategoryDescription,
      imageUrl: raw.imageUrl ?? raw.ImageUrl,
      parentId: raw.parentId ?? raw.ParentId,
      parentName: raw.parentName ?? raw.ParentName,
      courseCount: raw.courseCount ?? raw.CourseCount ?? 0,
    });

    return {
      ...mapped,
      children: childrenList.map((child) => {
        const childRecord = child as Record<string, unknown>;
        return {
          categoryId: String(childRecord.id ?? childRecord.Id ?? childRecord.categoryId ?? childRecord.CategoryId ?? ''),
          categoryName: String(childRecord.categoryName ?? childRecord.CategoryName ?? childRecord.name ?? childRecord.Name ?? ''),
          categoryImage: String(childRecord.imageUrl ?? childRecord.ImageUrl ?? '').trim() || undefined,
          courseCount: Number(childRecord.courseCount ?? childRecord.CourseCount ?? 0),
        };
      }),
    };
  } catch (error) {
    console.error('خطا در دریافت دسته‌بندی:', error);
    return null;
  }
}

/** پارامترهای افزودن دسته‌بندی */
export type AddCategoryParams = {
  categoryName: string;
  description: string;
  parentId?: number | null;
  categoryImage?: File | null;
};

export type UpdateCategoryParams = {
  categoryId: string | number;
  categoryName: string;
  description: string;
  parentId?: number | null;
  categoryImage?: File | null;
};

/**
 * ارسال دسته‌بندی جدید به API و ذخیره در دیتابیس.
 */
export async function addCategoryApi(params: AddCategoryParams): Promise<ResponseMessageType> {
  const formData = new FormData();
  formData.append('CategoryName', params.categoryName.trim());
  formData.append('Description', params.description.trim());
  if (params.parentId != null && params.parentId !== 0) {
    formData.append('ParentId', String(params.parentId));
  }
  if (params.categoryImage && params.categoryImage.size > 0) {
    formData.append('CategoryImage', params.categoryImage);
  }

  try {
    const response = await apiClient.post('/Category/add-category', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const body = response.data;

    if (getCommandStatus(body) === API_STATUS_EXIST) {
      return {
        action: 'destructive',
        title: 'duplicate_title_title',
        description: getCommandMessages(body)[0] || 'duplicate_title_description',
      };
    }

    return {
      action: 'default',
      title: 'addCategory_toast_success_title',
      description: 'addCategory_toast_success_description',
    };
  } catch (error) {
    console.error('خطا در ارسال دسته‌بندی:', error);
    const body =
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as { response?: { data?: unknown; status?: number } }).response?.data;

    if (getCommandStatus(body) === API_STATUS_EXIST) {
      return {
        action: 'destructive',
        title: 'duplicate_title_title',
        description: getCommandMessages(body)[0] || 'duplicate_title_description',
      };
    }

    return {
      action: 'destructive',
      title: 'addCategory_toast_errors_title',
      description: 'addCategory_toast_errors_description',
    };
  }
}

export async function updateCategoryApi(params: UpdateCategoryParams): Promise<ResponseMessageType> {
  const formData = new FormData();
  formData.append('CategoryId', String(params.categoryId));
  formData.append('CategoryName', params.categoryName.trim());
  formData.append('Description', params.description.trim());
  formData.append('ParentId', String(params.parentId != null && params.parentId !== 0 ? params.parentId : 0));
  if (params.categoryImage && params.categoryImage.size > 0) {
    formData.append('CategoryImage', params.categoryImage);
  }

  try {
    const response = await apiClient.post('/Category/update-category', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const body = response.data;

    if (getCommandStatus(body) === API_STATUS_EXIST) {
      return {
        action: 'destructive',
        title: 'duplicate_title_title',
        description: getCommandMessages(body)[0] || 'duplicate_title_description',
      };
    }

    return {
      action: 'default',
      title: 'editCategory_toast_success_title',
      description: 'editCategory_toast_success_description',
    };
  } catch (error) {
    console.error('خطا در به‌روزرسانی دسته‌بندی:', error);
    const body =
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as { response?: { data?: unknown } }).response?.data;

    if (getCommandStatus(body) === API_STATUS_EXIST) {
      return {
        action: 'destructive',
        title: 'duplicate_title_title',
        description: getCommandMessages(body)[0] || 'duplicate_title_description',
      };
    }

    return {
      action: 'destructive',
      title: 'addCategory_toast_errors_title',
      description: 'addCategory_toast_errors_description',
    };
  }
}

export async function deleteCategoryPermanently(categoryId: string | number): Promise<void> {
  await apiClient.delete('/Category/Delete', { params: { categoryId } });
}
