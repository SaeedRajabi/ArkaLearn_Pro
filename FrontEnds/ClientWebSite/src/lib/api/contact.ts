import { cache } from 'react';
import { apiRequest } from './client';
import type { OtpSessionResponse } from './sms';
import type { ContactUsQri } from './types';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_DISPLAY_FA,
} from '@/lib/constants/contact';

const BASE = 'ContactUs';

function unwrapData<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root;
  return (typeof layer === 'object' && layer !== null ? layer : root) as T;
}

export async function sendContactEmailOtp(body: {
  fullName: string;
  email: string;
}): Promise<OtpSessionResponse> {
  const raw = await apiRequest<unknown>('SupportTicket/EmailOtp/Send', {
    method: 'POST',
    body,
    timeoutMs: 35000,
  });
  const data = unwrapData<Record<string, unknown>>(raw);
  if (!data?.sessionId && !data?.SessionId) {
    throw new Error('Failed to send verification code.');
  }
  return {
    sessionId: String(data.sessionId ?? data.SessionId),
    resendCooldownSeconds: Number(data.resendCooldownSeconds ?? data.ResendCooldownSeconds ?? 120),
    expiresInSeconds: Number(data.expiresInSeconds ?? data.ExpiresInSeconds ?? 600),
  };
}

export async function submitContactRequest(body: {
  fullName: string;
  email: string;
  message: string;
  emailOtpSessionId: string;
  emailOtpCode: string;
}): Promise<string> {
  const raw = await apiRequest<unknown>('SupportTicket/Submit', {
    method: 'POST',
    body: {
      fullName: body.fullName,
      email: body.email.trim().toLowerCase(),
      message: body.message,
      emailOtpSessionId: body.emailOtpSessionId,
      emailOtpCode: body.emailOtpCode,
    },
    timeoutMs: 35000,
  });
  const data = unwrapData<Record<string, unknown>>(raw);
  const ticketId = data?.data ?? data?.Data ?? data;
  if (typeof ticketId === 'string' || typeof ticketId === 'number') {
    return String(ticketId);
  }
  if (data && typeof data === 'object') {
    const id = (data as Record<string, unknown>).id ?? (data as Record<string, unknown>).Id;
    if (id != null) return String(id);
  }
  return '';
}

function normalizeContactUs(raw: Record<string, unknown>): ContactUsQri {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    pageTitle: String(raw.pageTitle ?? raw.PageTitle ?? ''),
    pageSubtitle: String(raw.pageSubtitle ?? raw.PageSubtitle ?? ''),
    heroTitle: String(raw.heroTitle ?? raw.HeroTitle ?? ''),
    heroSubtitle: String(raw.heroSubtitle ?? raw.HeroSubtitle ?? ''),
    headquartersTitle: String(raw.headquartersTitle ?? raw.HeadquartersTitle ?? ''),
    headquartersAddress: String(raw.headquartersAddress ?? raw.HeadquartersAddress ?? ''),
    headquartersPhone: String(raw.headquartersPhone ?? raw.HeadquartersPhone ?? ''),
    headquartersEmail: String(raw.headquartersEmail ?? raw.HeadquartersEmail ?? ''),
    contactInfoTitle: String(raw.contactInfoTitle ?? raw.ContactInfoTitle ?? ''),
    contactInfoPhone: String(raw.contactInfoPhone ?? raw.ContactInfoPhone ?? ''),
    contactInfoEmail: String(raw.contactInfoEmail ?? raw.ContactInfoEmail ?? ''),
    salesSupportTitle: String(raw.salesSupportTitle ?? raw.SalesSupportTitle ?? ''),
    salesSupportPhone: String(raw.salesSupportPhone ?? raw.SalesSupportPhone ?? ''),
    salesSupportEmail: String(raw.salesSupportEmail ?? raw.SalesSupportEmail ?? ''),
    formTitle: String(raw.formTitle ?? raw.FormTitle ?? ''),
    formDescription: String(raw.formDescription ?? raw.FormDescription ?? ''),
    mapEmbedUrl: String(raw.mapEmbedUrl ?? raw.MapEmbedUrl ?? ''),
    facebookUrl: String(raw.facebookUrl ?? raw.FacebookUrl ?? ''),
    twitterUrl: String(raw.twitterUrl ?? raw.TwitterUrl ?? ''),
    instagramUrl: String(raw.instagramUrl ?? raw.InstagramUrl ?? ''),
    linkedInUrl: String(raw.linkedInUrl ?? raw.LinkedInUrl ?? ''),
    lastModifiedAt: String(raw.lastModifiedAt ?? raw.LastModifiedAt ?? ''),
  };
}

export type ResolvedContactDisplay = {
  phone: string;
  phoneTel: string;
  email: string;
  socialLinks: Array<{ label: string; url: string }>;
};

function toTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits ? `tel:${digits}` : '';
}

export function resolveContactDisplay(
  contactContent: ContactUsQri | null | undefined,
  lang: 'en' | 'fa'
): ResolvedContactDisplay {
  const fallbackPhone = lang === 'fa' ? CONTACT_PHONE_DISPLAY_FA : CONTACT_PHONE;
  const phone = contactContent?.contactInfoPhone?.trim() || fallbackPhone;
  const rawForTel = contactContent?.contactInfoPhone?.trim() || CONTACT_PHONE;
  const email = contactContent?.contactInfoEmail?.trim() || CONTACT_EMAIL;

  const socialLinks = [
    { label: 'LinkedIn', url: contactContent?.linkedInUrl?.trim() },
    { label: 'Twitter', url: contactContent?.twitterUrl?.trim() },
    { label: 'Instagram', url: contactContent?.instagramUrl?.trim() },
    { label: 'Facebook', url: contactContent?.facebookUrl?.trim() },
  ].filter((item): item is { label: string; url: string } => Boolean(item.url));

  return {
    phone,
    phoneTel: toTelHref(rawForTel),
    email,
    socialLinks,
  };
}

export const getContactUsPage = cache(async (): Promise<ContactUsQri | null> => {
  try {
    const result = await apiRequest<Record<string, unknown>>(`${BASE}/Get`, {
      method: 'GET',
      timeoutMs: 8000,
    });
    if (!result || typeof result !== 'object') return null;
    return normalizeContactUs(result);
  } catch {
    return null;
  }
});
