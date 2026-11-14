
'use client'

import { useLanguage } from "@/components/language-provider";
import { SummaryGenerator } from '@/components/summary/summary-generator';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SummaryPage() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const [initialSummary, setInitialSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const summaryParam = searchParams.get('summary');
        if (summaryParam) {
            try {
                const parsedSummary = JSON.parse(decodeURIComponent(summaryParam));
                setInitialSummary(parsedSummary);
            } catch (error) {
                console.error("Failed to parse summary from URL", error);
            }
        }
        setIsLoading(false);
    }, [searchParams]);

    if (isLoading) {
        return (
            <div className="mx-auto grid w-full max-w-4xl gap-4">
                <div className="flex flex-col space-y-1.5">
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                    {t('summaryToolTitle')}
                    </h1>
                    <p className="text-muted-foreground">{t('summaryToolDesc')}</p>
                </div>
                <p>Loading summary...</p>
            </div>
        );
    }
    
    return (
        <div className="mx-auto grid w-full max-w-4xl gap-4">
        <div className="flex flex-col space-y-1.5">
            <h1 className="font-headline text-3xl font-bold tracking-tight">
            {t('summaryToolTitle')}
            </h1>
            <p className="text-muted-foreground">{t('summaryToolDesc')}</p>
        </div>
        <SummaryGenerator initialData={initialSummary} />
        </div>
    );
}
