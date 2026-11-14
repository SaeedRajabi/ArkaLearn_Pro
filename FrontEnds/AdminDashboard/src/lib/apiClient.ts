'use client';

import axios, { AxiosHeaders, AxiosInstance } from 'axios';
import { toast } from '@/hooks/use-toast';
import { getApiServiceBaseUrl, getStaticBaseUrl, resolveStaticAssetUrl, toSameOriginAssetSrc } from '@/lib/api-config';
import { getRoomAccessToken } from '@/lib/room-access-token';
import { expireSessionAndRedirectToLogin, shouldShowSessionExpiredToast, shouldRedirectOnAuthFailure } from '@/lib/auth/session-expired';
import { isLogoutPending } from '@/lib/auth/logout-client';
import { parseJsonWithLongIds } from '@/lib/parse-json-with-long-ids';

/** Resolved per-request on the client so local-dev switches between proxy vs direct API stay correct. */
const defaultBaseUrl: string = getApiServiceBaseUrl();

function trimTrailingSlashes(value: string): string {
    return value.replace(/\/+$/, '');
}

function stripDuplicateApiServicePrefix(url: string, clientBaseUrl: string): string {
    if (!url || /^https?:\/\//i.test(url)) return url;

    const normalizedBase = trimTrailingSlashes(clientBaseUrl);
    if (!/\/(?:svc|admin-api|api)(?:\/api)?\/service$/i.test(normalizedBase)) return url;

    const withoutServicePrefix = url.replace(/^\/?(?:svc|admin-api|api)(?:\/api)?\/service(?=\/|\?|$)/i, '');
    if (withoutServicePrefix === url) return url;
    if (!withoutServicePrefix) return '/';
    if (/^[?#]/.test(withoutServicePrefix)) return withoutServicePrefix;
    return withoutServicePrefix.startsWith('/') ? withoutServicePrefix : `/${withoutServicePrefix}`;
}

function normalizeApiClientUrl(url: string, clientBaseUrl: string): string {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return trimmedUrl;

    const normalizedBase = trimTrailingSlashes(clientBaseUrl);
    const lowerUrl = trimmedUrl.toLowerCase();
    const lowerBase = normalizedBase.toLowerCase();

    if (lowerUrl === lowerBase) return '/';
    if (lowerUrl.startsWith(`${lowerBase}/`)) {
        return stripDuplicateApiServicePrefix(trimmedUrl.slice(normalizedBase.length) || '/', clientBaseUrl);
    }

    return stripDuplicateApiServicePrefix(trimmedUrl, clientBaseUrl);
}

function isRoomApiUrl(url: unknown): boolean {
    if (typeof url !== 'string') return false;
    const normalized = url.toLowerCase();
    return /(^|\/)room(\/|$|\?)/i.test(normalized);
}

const apiClient:AxiosInstance = axios.create({
    baseURL: defaultBaseUrl,
    withCredentials: true,
    transformResponse: [
        (data) => {
            if (typeof data === 'string' && data.length > 0) {
                try {
                    return parseJsonWithLongIds(data);
                } catch {
                    return data;
                }
            }
            return data;
        },
    ],
});

apiClient.interceptors.request.use((config) => {
    const resolvedBase =
        typeof window !== 'undefined' ? getApiServiceBaseUrl() : defaultBaseUrl;
    config.baseURL = resolvedBase;

    if (typeof config.url === 'string') {
        const effectiveBaseUrl:string =
            typeof config.baseURL === 'string' && config.baseURL.trim().length > 0
                ? config.baseURL
                : resolvedBase;

        config.url = normalizeApiClientUrl(config.url, effectiveBaseUrl);
    }

    // Room seat JWT (no dashboard cookie) — required for e.g. GET /Room/GetRoomFiles.
    // Skip anonymous room login so a stale token cannot block re-login.
    if (typeof window !== 'undefined') {
        const urlStr = String(config.url ?? '');
        const isRoomSeatLogin = urlStr.toLowerCase().includes('userloginintoroom');
        const roomJwt = getRoomAccessToken();
        if (roomJwt && !isRoomSeatLogin && isRoomApiUrl(urlStr)) {
            const headers = AxiosHeaders.from(config.headers ?? {});
            const existing = headers.get('Authorization') ?? headers.get('authorization');
            if (!existing) {
                headers.set('Authorization', `Bearer ${roomJwt}`);
                config.headers = headers;
            }
        }
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl =
            typeof error.config?.url === 'string' ? error.config.url : undefined;

        if (typeof window !== 'undefined' && !error.response) {
            const message = String(error.message ?? '');
            const isDecodeFailure =
                error.code === 'ERR_CONTENT_DECODING_FAILED' ||
                message.includes('CONTENT_DECODING_FAILED');
            if (
                isDecodeFailure ||
                error.code === 'ERR_NETWORK' ||
                message === 'Network Error'
            ) {
                console.error(
                    'API network error — ensure the backend is running and API_URL matches its port (browser uses /svc/Service proxy).',
                    requestUrl,
                    error.config?.baseURL,
                    isDecodeFailure ? '(response decode failed — redeploy dashboard proxy fix)' : ''
                );
            }
        }

        const status = error.response?.status;
        const needsLogin =
            typeof window !== 'undefined' &&
            !isLogoutPending() &&
            shouldRedirectOnAuthFailure(requestUrl) &&
            status === 401;

        if (needsLogin) {
            if (shouldShowSessionExpiredToast()) {
                toast({
                    title: 'Session Expired',
                    description: 'Your session is no longer valid. Please sign in again.',
                    variant: 'destructive',
                });
            }
            expireSessionAndRedirectToLogin(window.location.pathname);
        }

        return Promise.reject(error);
    }
);

export { getApiServiceBaseUrl, getStaticBaseUrl, resolveStaticAssetUrl, toSameOriginAssetSrc };
export default apiClient;
