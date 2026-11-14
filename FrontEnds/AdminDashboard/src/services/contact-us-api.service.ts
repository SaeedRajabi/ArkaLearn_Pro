import apiClient from '@/lib/apiClient';
import { apiWriteUpdate } from '@/lib/api-write';
import { getCommandMessages, isCommandResponseSuccess } from '@/lib/api-command-result';

const BASE = '/ContactUs';

export type ContactUsSettingsDto = {
  id?: number;
  pageTitle: string;
  pageSubtitle: string;
  heroTitle: string;
  heroSubtitle: string;
  headquartersTitle: string;
  headquartersAddress: string;
  headquartersPhone: string;
  headquartersEmail: string;
  contactInfoTitle: string;
  contactInfoPhone: string;
  contactInfoEmail: string;
  salesSupportTitle: string;
  salesSupportPhone: string;
  salesSupportEmail: string;
  formTitle: string;
  formDescription: string;
  mapEmbedUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  linkedInUrl: string;
  lastModifiedAt?: string;
};

export type UpsertContactUsPayload = Omit<ContactUsSettingsDto, 'id' | 'lastModifiedAt'>;

function normalizeContactUs(raw: Record<string, unknown>): ContactUsSettingsDto {
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

function unwrapContactUsPayload(payload: unknown): Record<string, unknown> | null {
  let cur: unknown = payload;
  for (let depth = 0; depth < 8; depth++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) return null;
    const obj = cur as Record<string, unknown>;
    if ('heroTitle' in obj || 'HeroTitle' in obj || 'pageTitle' in obj || 'PageTitle' in obj) return obj;
    const next = obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult ?? obj.result ?? obj.Result;
    if (next === cur) break;
    cur = next;
  }
  return null;
}

export const DEFAULT_CONTACT_US_SETTINGS: UpsertContactUsPayload = {
  pageTitle: 'تماس با ما',
  pageSubtitle: 'برای مشاوره، نمایندگی فروش یا پشتیبانی با ما در ارتباط باشید.',
  heroTitle: 'با ما در ارتباط باشید',
  heroSubtitle: 'تیم آرکا نرم افزار آماده پاسخگویی به سوالات و درخواست‌های شماست.',
  headquartersTitle: 'دفتر مرکزی',
  headquartersAddress: 'تهران، میدان ولیعصر، خیابان ولیعصر، پلاک ۱۲۳۴',
  headquartersPhone: '09367991020',
  headquartersEmail: 'admin.arkasoftware@gmail.com',
  contactInfoTitle: 'اطلاعات تماس',
  contactInfoPhone: '09367991020',
  contactInfoEmail: 'admin.arkasoftware@gmail.com',
  salesSupportTitle: 'پشتیبانی فروش',
  salesSupportPhone: '09367991020',
  salesSupportEmail: 'admin.arkasoftware@gmail.com',
  formTitle: 'با ما در ارتباط باشید',
  formDescription:
    'برای درخواست نمایندگی لطفا با بخش فروش شرکت تماس بگیرید یا فرم را پر کنید سپس همکاران ما با شما تماس خواهند گرفت.',
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3239.847!2d51.389!3d35.721!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzXCsDQzJzE1LjYiTiA1McKwMjMnMjAuNCJF!5e0!3m2!1sfa!2sir!4v1',
  facebookUrl: '',
  twitterUrl: '',
  instagramUrl: '',
  linkedInUrl: '',
};

export async function getContactUsSettings(): Promise<ContactUsSettingsDto | null> {
  try {
    const { data } = await apiClient.get<unknown>(`${BASE}/Get`);
    const layer = unwrapContactUsPayload(data);
    if (!layer) return null;
    return normalizeContactUs(layer);
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw error;
  }
}

export async function upsertContactUsSettings(payload: UpsertContactUsPayload): Promise<void> {
  const res = await apiWriteUpdate(`${BASE}/Upsert`, payload);
  if (!isCommandResponseSuccess(res.data, res.status)) {
    const msgs = getCommandMessages(res.data);
    throw new Error(msgs[0] || 'Failed to save contact settings.');
  }
}
