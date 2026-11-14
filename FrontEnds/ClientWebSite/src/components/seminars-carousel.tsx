'use client';

import * as React from 'react';
import createDOMPurify from 'dompurify';
import Image from 'next/image';
import Link from 'next/link';
import type { Dictionary } from '@/lib/definitions';
import type { SeminarListItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getSeminarImageUrl } from '@/lib/utils/image-url';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock3, Play, Star, UsersRound } from 'lucide-react';

interface SeminarsCarouselProps {
    dict: Dictionary;
    seminars: SeminarListItem[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

type SeminarCategory = {
    id: string;
    label: string;
    title: string;
    description: string;
    keywords: string[];
    chips: string[];
};

const categoriesByLang: Record<'en' | 'fa', SeminarCategory[]> = {
    en: [
        {
            id: 'design',
            label: 'Art & Design',
            title: 'Art & Design',
            description: 'Join creative seminars focused on design thinking, visual storytelling, and better digital experiences.',
            keywords: ['art', 'design', 'graphic', 'web', 'ui', 'ux'],
            chips: ['Design', 'Creative Skills', 'Portfolio'],
        },
        {
            id: 'development',
            label: 'Development',
            title: 'Development',
            description: 'Learn practical development skills from expert-led sessions and real project examples.',
            keywords: ['development', 'programming', 'code', 'react', 'next', 'asp', 'web'],
            chips: ['Frontend', 'Backend', 'Projects'],
        },
        {
            id: 'data',
            label: 'Data Science',
            title: 'Data Science',
            description: 'Explore data, analytics, automation, and AI topics with focused live seminars.',
            keywords: ['data', 'science', 'ai', 'machine', 'analytics', 'هوش', 'داده'],
            chips: ['AI', 'Analytics', 'Automation'],
        },
        {
            id: 'marketing',
            label: 'Marketing',
            title: 'Marketing',
            description: 'Improve campaign planning, digital growth, and online brand strategy through practical workshops.',
            keywords: ['marketing', 'seo', 'brand', 'growth', 'مارکتینگ', 'بازاریابی'],
            chips: ['SEO', 'Growth', 'Branding'],
        },
        {
            id: 'finance',
            label: 'Finance',
            title: 'Finance',
            description: 'Build stronger business decisions with finance, pricing, and planning seminars.',
            keywords: ['finance', 'business', 'pricing', 'مالی', 'کسب'],
            chips: ['Business', 'Pricing', 'Planning'],
        },
    ],
    fa: [
        {
            id: 'design',
            label: 'طراحی',
            title: 'طراحی و هنر دیجیتال',
            description: 'در سمینارهای خلاقانه طراحی، تجربه کاربری و ساخت محصول‌های زیباتر شرکت کنید.',
            keywords: ['art', 'design', 'graphic', 'web', 'ui', 'ux', 'طراحی', 'گرافیک'],
            chips: ['طراحی', 'تجربه کاربری', 'نمونه‌کار'],
        },
        {
            id: 'development',
            label: 'برنامه‌نویسی',
            title: 'توسعه و برنامه‌نویسی',
            description: 'مهارت‌های کاربردی توسعه نرم‌افزار را در جلسه‌های زنده و پروژه‌محور یاد بگیرید.',
            keywords: ['development', 'programming', 'code', 'react', 'next', 'asp', 'web', 'برنامه', 'کدنویسی'],
            chips: ['فرانت‌اند', 'بک‌اند', 'پروژه'],
        },
        {
            id: 'data',
            label: 'داده و هوش مصنوعی',
            title: 'داده و هوش مصنوعی',
            description: 'موضوعات داده، تحلیل، اتوماسیون و هوش مصنوعی را در سمینارهای تخصصی دنبال کنید.',
            keywords: ['data', 'science', 'ai', 'machine', 'analytics', 'هوش', 'داده'],
            chips: ['هوش مصنوعی', 'تحلیل داده', 'اتوماسیون'],
        },
        {
            id: 'marketing',
            label: 'بازاریابی',
            title: 'بازاریابی دیجیتال',
            description: 'برای رشد آنلاین، سئو، برندینگ و کمپین‌های هدفمند از کارگاه‌های عملی استفاده کنید.',
            keywords: ['marketing', 'seo', 'brand', 'growth', 'مارکتینگ', 'بازاریابی', 'سئو'],
            chips: ['سئو', 'رشد', 'برندینگ'],
        },
        {
            id: 'finance',
            label: 'کسب و کار',
            title: 'مالی و کسب و کار',
            description: 'با سمینارهای مالی، قیمت‌گذاری و برنامه‌ریزی، تصمیم‌های تجاری دقیق‌تری بگیرید.',
            keywords: ['finance', 'business', 'pricing', 'مالی', 'کسب'],
            chips: ['کسب و کار', 'قیمت‌گذاری', 'برنامه‌ریزی'],
        },
    ],
};

function findSeminarForCategory(
    seminars: SeminarListItem[],
    category: SeminarCategory,
    fallbackIndex: number
): SeminarListItem | null {
    if (seminars.length === 0) return null;

    const sorted = [...seminars].sort((a, b) => (b.registeredCount ?? 0) - (a.registeredCount ?? 0));
    const matched = sorted.find((seminar) => {
        const haystack = `${seminar.title ?? ''} ${seminar.description ?? ''} ${seminar.roomTitle ?? ''}`.toLowerCase();
        return category.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
    });

    return matched ?? sorted[fallbackIndex % sorted.length] ?? null;
}

export default function SeminarsCarousel({ dict, seminars: propSeminars }: SeminarsCarouselProps) {
    const seminars:SeminarListItem[] = propSeminars;
    const sectionDict:any = dict.seminarsSection;
    const lang : "en" | "fa" = dict.header.seminars === 'Seminars' ? 'en' : 'fa';
    const dir = lang === 'fa' ? 'rtl' : 'ltr';
    const categories = categoriesByLang[lang];
    const [activeCategoryId, setActiveCategoryId] = React.useState(categories[0].id);
    const activeIndex = Math.max(0, categories.findIndex((category) => category.id === activeCategoryId));
    const activeCategory = categories[activeIndex] ?? categories[0];
    const activeSeminar =
        findSeminarForCategory(seminars, activeCategory, activeIndex) ?? seminars[0] ?? null;
    const descriptionHtml = React.useMemo(() => {
        const html = activeSeminar?.description || activeCategory.description;
        if (typeof window === 'undefined') return html;

        const DOMPurify = createDOMPurify(window);
        return DOMPurify.sanitize(html, {
            USE_PROFILES: { html: true },
            ADD_ATTR: ['style', 'class', 'dir'],
        });
    }, [activeCategory.description, activeSeminar?.description]);
    const isFree = activeSeminar ? activeSeminar.isFree || activeSeminar.price === 0 : false;
    const startDate = activeSeminar?.startTime ? new Date(activeSeminar.startTime) : null;
    const dateLabel = startDate
        ? new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(startDate)
        : '-';
    const timeLabel = startDate
        ? new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(startDate)
        : '-';
    const detailHref = activeSeminar ? `/seminars/${activeSeminar.id}` : '/seminars';

    return (
        <motion.div 
            dir={dir} 
            className="relative overflow-hidden bg-muted/40 py-14 sm:py-16 lg:py-20"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
        >
            <svg
                aria-hidden="true"
                className="pointer-events-none absolute -start-24 -top-24 hidden h-72 w-[52rem] text-primary/20 dark:text-primary/10 lg:block"
                viewBox="0 0 822.2 301.9"
                fill="none"
            >
                <path
                    d="M752.5 51.9c-4.5 3.9-8.9 7.8-13.4 11.8-51.5 45.3-104.8 92.2-171.7 101.4-39.9 5.5-80.2-3.4-119.2-12.1-32.3-7.2-65.6-14.6-98.9-13.9-66.5 1.3-128.9 35.2-175.7 64.6-11.9 7.5-23.9 15.3-35.5 22.8-40.5 26.4-82.5 53.8-128.4 70.7-2.1.8-4.2 1.5-6.2 2.2L0 301.9"
                    stroke="currentColor"
                    strokeWidth="2"
                />
            </svg>
            <svg
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-20 -end-24 h-72 w-[52rem] text-amber-400/50 dark:text-amber-400/25"
                viewBox="0 0 822.2 301.9"
                fill="none"
            >
                <path
                    d="M752.5 51.9c-4.5 3.9-8.9 7.8-13.4 11.8-51.5 45.3-104.8 92.2-171.7 101.4-39.9 5.5-80.2-3.4-119.2-12.1-32.3-7.2-65.6-14.6-98.9-13.9-66.5 1.3-128.9 35.2-175.7 64.6-11.9 7.5-23.9 15.3-35.5 22.8-40.5 26.4-82.5 53.8-128.4 70.7-2.1.8-4.2 1.5-6.2 2.2L0 301.9"
                    stroke="currentColor"
                    strokeWidth="2"
                />
            </svg>

            <div className="container relative z-10 mx-auto px-4" dir={dir}>
                <motion.div variants={itemVariants} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="font-headline text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                            {sectionDict.popularTitle ?? (lang === 'fa' ? 'محبوب‌ترین سمینارها' : 'Most Popular Seminars')}
                        </h2>
                        <p className={cn("mt-3 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg", lang === 'fa' && 'font-subtitle')}>
                            {sectionDict.popularSubtitle ??
                                (lang === 'fa'
                                    ? 'بر اساس دسته‌بندی مورد علاقه خود، سمینارهای پرطرفدار و کاربردی را پیدا کنید.'
                                    : 'Explore the most useful seminars by category and find the best live session for your goals.')}
                        </p>
                    </div>
                    <Button asChild variant="outline" className="w-fit rounded-full bg-background/80 backdrop-blur">
                        <Link href="/seminars">
                            {sectionDict.viewAll ?? (lang === 'fa' ? 'مشاهده همه سمینارها' : 'View all seminars')}
                            {lang === 'fa' ? <ArrowLeft className="ms-2 h-4 w-4" /> : <ArrowRight className="ms-2 h-4 w-4" />}
                        </Link>
                    </Button>
                </motion.div>

                <motion.div variants={itemVariants} className="mt-8">
                    <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {categories.map((category) => (
                            <Button
                                key={category.id}
                                type="button"
                                size="sm"
                                variant={activeCategoryId === category.id ? 'default' : 'secondary'}
                                className={cn(
                                    'shrink-0 rounded-lg px-4 shadow-sm',
                                    activeCategoryId !== category.id && 'bg-primary/10 text-primary hover:bg-primary/15'
                                )}
                                onClick={() => setActiveCategoryId(category.id)}
                            >
                                {category.label}
                            </Button>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    key={activeCategory.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] lg:items-center"
                >
                    <div className="space-y-5">
                        <div>
                            <h3 className="text-2xl font-bold text-foreground sm:text-3xl">
                                {activeSeminar?.title || activeCategory.title}
                            </h3>
                            <div
                                className="prose prose-sm mt-3 line-clamp-5 max-w-2xl text-muted-foreground dark:prose-invert prose-p:my-0 prose-p:leading-7 prose-span:leading-7 sm:prose-base"
                                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {activeCategory.chips.map((chip, index) => (
                                <Badge
                                    key={chip}
                                    variant={index === 0 ? 'default' : 'secondary'}
                                    className={cn(index === 0 ? 'bg-foreground text-background hover:bg-foreground/90' : 'bg-background/80')}
                                >
                                    {chip}
                                </Badge>
                            ))}
                        </div>

                        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                            <div className="rounded-2xl bg-background/80 p-4 shadow-sm backdrop-blur">
                                <CalendarDays className="mb-2 h-5 w-5 text-primary" />
                                <p className="font-medium text-foreground">{dateLabel}</p>
                                <p>{lang === 'fa' ? 'تاریخ برگزاری' : 'Seminar date'}</p>
                            </div>
                            <div className="rounded-2xl bg-background/80 p-4 shadow-sm backdrop-blur">
                                <Clock3 className="mb-2 h-5 w-5 text-primary" />
                                <p className="font-medium text-foreground">{timeLabel}</p>
                                <p>{lang === 'fa' ? 'زمان شروع' : 'Start time'}</p>
                            </div>
                            <div className="rounded-2xl bg-background/80 p-4 shadow-sm backdrop-blur">
                                <UsersRound className="mb-2 h-5 w-5 text-primary" />
                                <p className="font-medium text-foreground">
                                    {activeSeminar?.registeredCount?.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US') ?? '0'}
                                </p>
                                <p>{lang === 'fa' ? 'شرکت‌کننده' : 'Registered'}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button asChild className="rounded-lg">
                                <Link href={detailHref}>
                                    {lang === 'fa' ? 'مشاهده جزئیات سمینار' : 'View seminar details'}
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="rounded-lg bg-background/70">
                                <Link href="/seminars">
                                    {lang === 'fa' ? 'رفتن به همه سمینارها' : 'Go to all seminars'}
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -end-6 -top-8 hidden h-24 w-24 rounded-full bg-primary/20 lg:block" />
                        <div className="overflow-hidden rounded-2xl border bg-background p-2 shadow-2xl">
                            <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                                <Image
                                    src={getSeminarImageUrl(activeSeminar?.thumbnailUrl)}
                                    alt={activeSeminar?.title || activeCategory.title}
                                    fill
                                    className="object-cover"
                                    sizes="(min-width: 1024px) 42vw, 100vw"
                                />
                                <div className="absolute inset-0 bg-black/20" />
                                <Link
                                    href={detailHref}
                                    className="absolute inset-0 flex items-center justify-center"
                                    aria-label={lang === 'fa' ? 'مشاهده سمینار' : 'View seminar'}
                                >
                                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-background text-primary shadow-xl transition-transform hover:scale-105">
                                        <Play className="ms-1 h-7 w-7 fill-current" />
                                    </span>
                                </Link>
                            </div>

                            <div className="grid gap-3 p-4 sm:grid-cols-3">
                                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                    <div>
                                        <Badge className="mb-1 bg-cyan-500 text-white hover:bg-cyan-500">
                                            {lang === 'fa' ? 'آنلاین' : 'Live'}
                                        </Badge>
                                        <p className="font-bold text-foreground">
                                            {isFree ? (dict.home as any).free : `$${activeSeminar?.price ?? 0}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                                    <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                                    <div>
                                        <Badge variant="secondary" className="mb-1">
                                            {lang === 'fa' ? 'محبوب' : 'Popular'}
                                        </Badge>
                                        <p className="font-bold text-foreground">4.8</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                                    <UsersRound className="h-6 w-6 text-primary" />
                                    <div>
                                        <Badge variant="secondary" className="mb-1">
                                            {lang === 'fa' ? 'ظرفیت' : 'Seats'}
                                        </Badge>
                                        <p className="font-bold text-foreground">
                                            {activeSeminar?.capacity?.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US') ?? '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
