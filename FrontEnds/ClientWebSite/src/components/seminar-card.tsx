'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SeminarListItem, Dictionary } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';
import { RemoteImage } from '@/components/shared/remote-image';
import { getSeminarImageUrl } from '@/lib/utils/image-url';
import { useSeminarFavorites } from '@/contexts/seminar-favorites-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface SeminarCardProps {
  seminar: SeminarListItem;
  dict: Dictionary;
}

export function SeminarCard({ seminar, dict }: SeminarCardProps) {
  const [isBusy, setIsBusy] = useState(false);
  const { isFavorite, toggleFavorite } = useSeminarFavorites();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const lang = (dict.header as any).seminars === 'Seminars' ? 'en' : 'fa';
  const isFree = seminar.isFree ?? seminar.price === 0;
  const startDate = seminar.startTime ? new Date(seminar.startTime) : null;
  const dateStr = startDate ? startDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'fa-IR') : '';
  const timeStr = startDate ? startDate.toTimeString().slice(0, 5) : '';

  const handleFavoriteClick = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: 'نیاز به ورود',
        description: 'برای افزودن سمینار به علاقه‌مندی‌ها، لطفا وارد حساب کاربری شوید.',
      });
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    if (isBusy) return;
    setIsBusy(true);
    const ok = await toggleFavorite(seminar.id);
    if (!ok) {
      toast({
        title: 'خطا',
        description: 'امکان به‌روزرسانی علاقه‌مندی‌ها وجود ندارد. دوباره تلاش کنید.',
        variant: 'destructive',
      });
    }
    setIsBusy(false);
  };
  const favorited = isFavorite(seminar.id);

  return (
    <motion.div 
      whileHover={{ y: -8 }} 
      transition={{ type: 'spring', stiffness: 300 }}
      className="h-full"
    >
      <Card 
        className="flex h-full flex-col overflow-hidden shadow-sm transition-shadow duration-300 hover:shadow-2xl"
      >
        <CardHeader className="p-0">
          <div className="relative aspect-video">
            <RemoteImage
              src={getSeminarImageUrl(seminar.thumbnailUrl)}
              alt={seminar.title}
              fill
              className="object-cover"
              data-ai-hint={seminar.title}
            />
            <div className="absolute top-3 right-3 flex gap-2">
              {seminar.roomTitle && (
                <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm">
                  {seminar.roomTitle}
                </Badge>
              )}
            </div>
            <Button
              size="icon" 
              variant="ghost" 
              className="absolute top-2 left-2 rounded-full bg-white/50 text-foreground hover:bg-white/80 hover:text-rose-500 backdrop-blur-sm"
              onClick={handleFavoriteClick}
              disabled={isBusy}
            >
              <Heart className={cn("h-5 w-5", favorited && "fill-rose-500 text-rose-500")} />
              <span className="sr-only">Add to favorites</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-4">
          <CardTitle className="mb-2 h-14 text-lg font-bold leading-tight line-clamp-2 font-headline">
              <Link href={`/seminars/${seminar.id}`} className="hover:text-primary transition-colors">
                  {seminar.title}
              </Link>
          </CardTitle>
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{dateStr}</span>
              </div>
              <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{timeStr}</span>
              </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <p className="text-lg font-extrabold text-primary">
              {isFree ? (dict.home as any).free : `$${seminar.price}`}
          </p>
          <Link href={`/seminars/${seminar.id}`} className="text-sm font-semibold text-primary hover:underline">
            {lang === 'en' ? 'View Details' : 'مشاهده جزئیات'}
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
