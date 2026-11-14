import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import apiClient from '@/lib/apiClient';

/**
 * IIS/Plesk often blocks PUT before Next.js sees the request (405 on the dashboard host).
 * The API accepts the same payloads on POST for update endpoints.
 */
export function apiWriteUpdate<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  return apiClient.post<T>(url, data, config);
}

/** IIS/Plesk often blocks DELETE; the API accepts POST on the same delete routes. */
export function apiWriteDelete<T = unknown>(
  url: string,
  params?: Record<string, string | number | boolean>,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  return apiClient.post<T>(url, null, { ...config, params });
}
