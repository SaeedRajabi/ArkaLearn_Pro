import { getPlainTextLengthFromHtml } from '@/lib/utils/advertisement-limits';

export type AdvertisementContentPolicyViolation = {
  field: 'title' | 'workExperience' | 'description' | 'tags';
  message: string;
};

const HTML_TAG_REGEX = /<[^>]+>/g;
const WHITESPACE_REGEX = /\s+/g;

/** Common tech/product names that contain dots but are not URLs. */
const TECH_TERM_PATTERNS = [
  /\bASP\.NET(?:\s+Core)?\b/gi,
  /\.NET(?:\s+Framework)?\b/gi,
  /\bNext\.js\b/gi,
  /\bNode\.js\b/gi,
  /\bVue\.js\b/gi,
  /\bReact\.js\b/gi,
  /\bThree\.js\b/gi,
  /\bExpress\.js\b/gi,
  /\bD3\.js\b/gi,
  /\bChart\.js\b/gi,
  /\bNuxt\.js\b/gi,
  /\bNest\.js\b/gi,
  /\bBackbone\.js\b/gi,
  /\bSocket\.IO\b/gi,
  /\bCI\/CD\b/gi,
];

const PHONE_REGEX =
  /(?<!\d)(?:\+?\d{1,3}[\s\-().]*)?(?:0?9\d{2}[\s\-().]*\d{3}[\s\-().]*\d{4}|0\d{2,3}[\s\-().]*\d{3,4}[\s\-().]*\d{3,4})(?!\d)|(?<!\d)\d{7,15}(?!\d)/i;

const EXPLICIT_URL_REGEX = /https?:\/\/[^\s<>"']+|www\.[^\s<>"']+/i;

const BARE_DOMAIN_REGEX =
  /\b[a-z0-9][a-z0-9-]{3,62}[a-z0-9]\.(?:com|ir|net|org|io|dev|app|me|co|info|biz|site|online|shop|store|blog|link|xyz|tech|edu|ac\.ir|co\.ir|org\.ir|gov\.ir)(?:\/[^\s<>"']*)?\b/i;

const EMAIL_REGEX = /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i;

const SOCIAL_REGEX =
  /(?:https?:\/\/(?:t\.me|telegram\.|wa\.me|whatsapp\.|instagram\.|linkedin\.|github\.|gitlab\.|bale\.|rubika\.|eitaa\.|aparat\.|youtube\.|youtu\.be|twitter\.|x\.com|facebook\.)[^\s<>"']+|(?:^|\s)(?:t\.me\/|telegram\.me\/|wa\.me\/|instagram\.com\/|linkedin\.com\/|github\.com\/)[^\s<>"']+)/i;

const PERSIAN_CONTACT_HINT_REGEX =
  /(سایت\s*(?:شخصی|خودم|ما|من)|وب\s*سایت|وبسایت|شماره\s*تماس|تماس\s*بگیرید|واتس\s*اپ|واتساپ|اینستا(?:گرام)?|لینکدین\s*من|گیت\s*ه(?:اب)?\s*من|پیام\s*دهید|پیام\s*بدهید|دایرکت\s*بدهید|کانال\s*تلگرام|گروه\s*تلگرام|شماره\s*موبایل|موبایل\s*من|تماس\s*مستقیم|برند\s*شخصی)/i;

function neutralizeTechTerms(text: string): string {
  let result = text;
  for (const pattern of TECH_TERM_PATTERNS) {
    result = result.replace(pattern, ' ');
  }
  return result;
}

function containsLikelyUrl(text: string): boolean {
  const normalized = neutralizeTechTerms(text);
  return EXPLICIT_URL_REGEX.test(normalized) || BARE_DOMAIN_REGEX.test(normalized);
}

function stripHtml(html: string): string {
  if (!html.trim()) return '';
  const decoded = html.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ' ');
  return decoded.replace(WHITESPACE_REGEX, ' ').trim();
}

function checkText(
  text: string,
  field: AdvertisementContentPolicyViolation['field'],
  messages: Record<string, string>
): AdvertisementContentPolicyViolation | null {
  if (!text.trim()) return null;

  if (PHONE_REGEX.test(text)) {
    return { field, message: messages.phone ?? 'Do not include phone numbers in ad text.' };
  }
  if (EMAIL_REGEX.test(text)) {
    return { field, message: messages.email ?? 'Do not include email addresses in ad text.' };
  }
  if (containsLikelyUrl(text)) {
    return { field, message: messages.url ?? 'Do not include website links in ad text.' };
  }
  if (SOCIAL_REGEX.test(text)) {
    return { field, message: messages.social ?? 'Do not include social media links in ad text.' };
  }
  if (PERSIAN_CONTACT_HINT_REGEX.test(text)) {
    return { field, message: messages.offPlatform ?? 'Ad text must only describe your teaching skills.' };
  }

  return null;
}

export function validateAdvertisementContentPolicy(input: {
  title: string;
  workExperience: string;
  descriptionHtml: string;
  tags: string[];
  messages?: Partial<Record<'phone' | 'email' | 'url' | 'social' | 'offPlatform', string>>;
}): AdvertisementContentPolicyViolation | null {
  const messages = input.messages ?? {};
  const checks: Array<[AdvertisementContentPolicyViolation['field'], string]> = [
    ['title', input.title],
    ['workExperience', input.workExperience],
    ['description', stripHtml(input.descriptionHtml)],
    ['tags', input.tags.join(', ')],
  ];

  for (const [field, text] of checks) {
    const violation = checkText(text, field, messages);
    if (violation) return violation;
  }

  return null;
}

export function hasAdvertisementContactDetails(ad: {
  contactPhone?: string | null;
  websiteUrl?: string | null;
  baleLink?: string | null;
  telegramLink?: string | null;
  whatsAppLink?: string | null;
  gitHubLink?: string | null;
  linkedInLink?: string | null;
}): boolean {
  return Boolean(
    ad.contactPhone?.trim() ||
      ad.websiteUrl?.trim() ||
      ad.baleLink?.trim() ||
      ad.telegramLink?.trim() ||
      ad.whatsAppLink?.trim() ||
      ad.gitHubLink?.trim() ||
      ad.linkedInLink?.trim()
  );
}

export { stripHtml as stripAdvertisementHtml, getPlainTextLengthFromHtml };
