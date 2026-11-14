'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ArticleListItem, Dictionary } from '@/types';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { RemoteImage } from '@/components/shared/remote-image';
import { getArticleImageUrl } from '@/lib/utils/image-url';
import { useArticleFavorites } from '@/contexts/article-favorites-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
const MotionLink = motion(Link);

interface ArticleCardProps {
  article: ArticleListItem;
  dict: Dictionary;
  className?: string;
}

export function ArticleCard({ article, dict, className }: ArticleCardProps) {
  const [isBusy, setIsBusy] = useState(false);
  const { isFavorite, toggleFavorite } = useArticleFavorites();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const lang = (dict.header as any).articles === 'Articles' ? 'en' : 'fa';
  const dateStr = article.publishedAt ?? article.createdAt;
  
  const handleFavoriteClick = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: 'نیاز به ورود',
        description: 'برای افزودن مقاله به علاقه‌مندی‌ها، لطفا وارد حساب کاربری شوید.',
      });
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    if (isBusy) return;
    setIsBusy(true);
    const ok = await toggleFavorite(article.id);
    if (!ok) {
      toast({
        title: 'خطا',
        description: 'امکان به‌روزرسانی علاقه‌مندی‌ها وجود ندارد. دوباره تلاش کنید.',
        variant: 'destructive',
      });
    }
    setIsBusy(false);
  };
  const favorited = isFavorite(article.id);

  return (
    <MotionLink 
      href={`/articles/${article.slug}`}
      className={cn(
        "group relative block h-full w-full overflow-hidden rounded-lg shadow-lg min-h-[20rem]",
        className
      )}
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <RemoteImage
        src={getArticleImageUrl(article.thumbnailUrl)}
        alt={article.title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        data-ai-hint={article.title}
      />
      {article.categoryName && (
        <Badge 
          variant="secondary" 
          className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-secondary-foreground transition-opacity duration-300 group-hover:opacity-0"
        >
          {article.categoryName}
        </Badge>
      )}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <Button 
          size="icon" 
          variant="ghost" 
          className="absolute top-2 right-2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-rose-500 backdrop-blur-sm"
          onClick={handleFavoriteClick}
          disabled={isBusy}
        >
          <Heart className={cn("h-5 w-5", favorited && "fill-rose-500 text-rose-500")} />
          <span className="sr-only">Add to favorites</span>
        </Button>
        <h3 className="mb-2 text-lg font-bold leading-tight line-clamp-3 font-headline">
            {article.title}
        </h3>
        <div className="flex items-center justify-between text-sm text-gray-300">
            <span>{article.summary ? article.summary.slice(0, 30) + '…' : ''}</span>
            <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                <span>{dateStr ? new Date(dateStr).toLocaleDateString(lang === 'en' ? 'en-US' : 'fa-IR') : ''}</span>
            </div>
        </div>
      </div>
    </MotionLink>
  );
}
