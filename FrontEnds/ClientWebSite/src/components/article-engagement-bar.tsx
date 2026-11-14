'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { getArticleReactionSummary, setArticleReaction } from '@/lib/api/articles';
import { useToast } from '@/hooks/use-toast';

interface ArticleEngagementBarProps {
    articleId: number;
    initialLikes: number;
    initialDislikes: number;
    dict: Dictionary;
}

export function ArticleEngagementBar({ articleId, initialLikes, initialDislikes, dict }: ArticleEngagementBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading } = useAuth();
    const { toast } = useToast();
    const [vote, setVote] = useState<-1 | 0 | 1>(0);
    const [likes, setLikes] = useState(initialLikes);
    const [dislikes, setDislikes] = useState(initialDislikes);
    const [isSaving, setIsSaving] = useState(false);
    const pageDict = dict.articlesPage as Record<string, string>;
    const isFa = dict.header.articles !== 'Articles';

    useEffect(() => {
        let mounted = true;

        getArticleReactionSummary(articleId)
            .then((summary) => {
                if (!mounted) return;
                setLikes(summary.likes);
                setDislikes(summary.dislikes);
                setVote(summary.myReaction);
            })
            .catch(() => {
                // Public article content should remain readable even if engagement counters fail.
            });

        return () => {
            mounted = false;
        };
    }, [articleId]);

    const requireLogin = () => {
        const returnUrl = pathname ? encodeURIComponent(pathname) : '';
        router.push(returnUrl ? `/login?returnUrl=${returnUrl}` : '/login');
    };

    const submitReaction = async (nextReaction: -1 | 0 | 1) => {
        if (isLoading) return;
        if (!isAuthenticated) {
            requireLogin();
            return;
        }

        const previous = { vote, likes, dislikes };
        setVote(nextReaction);
        setLikes((value) => value + (nextReaction === 1 ? 1 : 0) - (vote === 1 ? 1 : 0));
        setDislikes((value) => value + (nextReaction === -1 ? 1 : 0) - (vote === -1 ? 1 : 0));

        setIsSaving(true);
        try {
            const summary = await setArticleReaction(articleId, nextReaction);
            setLikes(summary.likes);
            setDislikes(summary.dislikes);
            setVote(summary.myReaction);
        } catch {
            setVote(previous.vote);
            setLikes(previous.likes);
            setDislikes(previous.dislikes);
            toast({
                title: pageDict.reactionFailed ?? (isFa ? 'ثبت بازخورد انجام نشد' : 'Could not save reaction'),
                description: pageDict.loginRequired ?? (isFa ? 'برای ثبت بازخورد باید وارد حساب کاربری شوید.' : 'Please sign in to react to this article.'),
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLike = () => {
        void submitReaction(vote === 1 ? 0 : 1);
    };

    const handleDislike = () => {
        void submitReaction(vote === -1 ? 0 : -1);
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 rounded-lg border bg-muted/50">
            <h3 className="text-lg font-semibold">{pageDict.helpful}</h3>
            <div className="flex items-center gap-4">
                <Button variant="outline" size="lg" className="flex items-center gap-2" onClick={handleLike} disabled={isSaving}>
                    <ThumbsUp className={cn("h-5 w-5", vote === 1 && 'text-primary fill-primary/20')} /> 
                    <span>{likes}</span>
                </Button>
                <Button variant="outline" size="lg" className="flex items-center gap-2" onClick={handleDislike} disabled={isSaving}>
                    <ThumbsDown className={cn("h-5 w-5", vote === -1 && 'text-destructive fill-destructive/20')} /> 
                    <span>{dislikes}</span>
                </Button>
            </div>
        </div>
    );
}
