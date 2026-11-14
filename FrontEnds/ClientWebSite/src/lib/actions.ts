
'use server';

import { cookies } from 'next/headers';

export async function setLanguage(lang: 'en' | 'fa') {
  (await cookies()).set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 30 });
}
