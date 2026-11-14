'use client';

import {
  emitSessionExpired,
  getRequestUrl,
  shouldHandleUnauthorizedApiResponse,
} from '@/lib/auth/session-expired';
import { clearAuthData } from '@/lib/auth';

let installed = false;

async function responseIndicatesBlockedAccount(response: Response): Promise<boolean> {
  if (response.status !== 403 && response.status !== 400) return false;
  try {
    const clone = response.clone();
    const payload = await clone.json();
    const message = JSON.stringify(payload).toLowerCase();
    return message.includes('account blocked');
  } catch {
    return false;
  }
}

/** Intercepts browser fetch calls so raw requests also trigger session-expired logout. */
export function installFetchSessionHandler(): () => void {
  if (typeof window === 'undefined' || installed) return () => {};

  installed = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await originalFetch(input, init);

    if (response.status === 401) {
      const url = getRequestUrl(input);
      if (shouldHandleUnauthorizedApiResponse(url)) {
        emitSessionExpired();
      }
    } else if (await responseIndicatesBlockedAccount(response)) {
      clearAuthData();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.replace('/login?blocked=1');
      }
    }

    return response;
  };

  return () => {
    window.fetch = originalFetch;
    installed = false;
  };
}
