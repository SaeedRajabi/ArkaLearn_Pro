import 'server-only';
import type { Dictionary } from '@/types';
import { promises as fs } from 'fs';
import path from 'path';

export const getDictionary = async (locale: 'en' | 'fa'): Promise<Dictionary> => {
    const dictionaries = {
        en: async () => {
            const file = await fs.readFile(path.join(process.cwd(), 'src/lib/locales/en.json'), 'utf8');
            return JSON.parse(file);
        },
        fa: async () => {
            const file = await fs.readFile(path.join(process.cwd(), 'src/lib/locales/fa.json'), 'utf8');
            return JSON.parse(file);
        },
    };

    if (locale === 'fa') {
        try {
            return await dictionaries.fa();
        } catch (e) {
            return dictionaries.en();
        }
    }
    return dictionaries.en();
};
