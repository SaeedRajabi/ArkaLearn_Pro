import * as z from 'zod';

const ENGLISH_USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/;
const ASCII_ONLY_REGEX = /^[\x00-\x7F]+$/;
const IRAN_MOBILE_REGEX = /^09\d{9}$/;

/** Persian / Arabic-Indic digits → ASCII (common on mobile keyboards in Iran). */
export function toWesternDigits(value: string): string {
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  const arabic = '٠١٢٣٤٥٦٧٨٩';
  return value
    .replace(/[۰-۹]/g, (ch) => String(persian.indexOf(ch)))
    .replace(/[٠-٩]/g, (ch) => String(arabic.indexOf(ch)));
}

export function normalizeIranianMobile(input: string): string | null {
  let digits = toWesternDigits(input).replace(/\D/g, '');
  if (digits.startsWith('0098')) digits = digits.slice(4);
  else if (digits.startsWith('98') && digits.length >= 12) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10 && digits.startsWith('9')) return digits;
  return null;
}

/** Format for API / backend normalizer (e.g. 09182767745). */
export function formatIranianMobileForApi(input: string): string {
  const ascii = toWesternDigits(input.trim());
  const local = normalizeIranianMobile(ascii);
  if (local) return `0${local}`;
  const digits = ascii.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('9')) return `0${digits}`;
  return ascii;
}

export function createRegisterFormSchema(messages: {
  fullNameRequired: string;
  userNameRequired: string;
  userNameEnglish: string;
  emailRequired: string;
  emailEnglish: string;
  phoneRequired: string;
  phoneInvalid: string;
  passwordRequired: string;
  confirmPasswordMatch: string;
  termsRequired: string;
}) {
  return z
    .object({
      fullName: z.string().trim().min(2, { message: messages.fullNameRequired }),
      userName: z
        .string()
        .trim()
        .min(3, { message: messages.userNameRequired })
        .max(30)
        .regex(ENGLISH_USERNAME_REGEX, { message: messages.userNameEnglish }),
      email: z
        .string()
        .trim()
        .toLowerCase()
        .email({ message: messages.emailRequired })
        .refine((v) => ASCII_ONLY_REGEX.test(v), { message: messages.emailEnglish }),
      phoneNumber: z
        .string()
        .trim()
        .min(1, { message: messages.phoneRequired })
        .transform((v) => toWesternDigits(v))
        .refine((v) => IRAN_MOBILE_REGEX.test(v.replace(/\s/g, '')) || normalizeIranianMobile(v) !== null, {
          message: messages.phoneInvalid,
        }),
      password: z.string().min(8, { message: messages.passwordRequired }),
      confirmPassword: z.string(),
      terms: z.boolean().default(false),
      accountType: z.enum(['student', 'professor']),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.confirmPasswordMatch,
      path: ['confirmPassword'],
    })
    .refine((data) => data.terms === true, {
      message: messages.termsRequired,
      path: ['terms'],
    });
}

export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterFormSchema>>;
