'use client';

import Link from 'next/link';
import type { SeminarListItem as SeminarListItemType, Dictionary } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { StartSeminarPaymentButton } from '@/components/features/seminars/start-seminar-payment-button';
import { RemoteImage } from '@/components/shared/remote-image';
import { getSeminarImageUrl } from '@/lib/utils/image-url';

interface SeminarListItemProps {
  seminar: SeminarListItemType;
  dict: Dictionary;
}

export function SeminarListItem({ seminar, dict }: SeminarListItemProps) {
  const lang = dict.header.seminars === 'Seminars' ? 'en' : 'fa';
  const pageDict = dict.seminarsPage;
  const startDate = seminar.startTime ? new Date(seminar.startTime) : null;
  const day = startDate ? startDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'fa-IR', { day: '2-digit' }) : 'â€”';
  const month = startDate ? startDate.toLocaleDateString(lang === 'en' ? 'en-US' : 'fa-IR', { month: 'short' }) : '';
  const timeStr = startDate ? startDate.toTimeString().slice(0, 5) : '';
  const isFree = seminar.isFree ?? seminar.price === 0;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow duration-300 hover:shadow-xl md:flex-row"
    >
      <div className="relative aspect-video shrink-0 md:w-1/3">
        <RemoteImage
          src={getSeminarImageUrl(seminar.thumbnailUrl)}
          alt={seminar.title}
          fill
          className="object-cover"
          data-ai-hint={seminar.title}
        />
        <div className="absolute left-4 top-4 w-16 rounded-lg bg-background/80 p-2 text-center text-foreground backdrop-blur-sm">
            <span className="text-3xl font-bold">{day}</span>
            <span className="block text-sm uppercase">{month}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-6">
        <div className="flex-1">
            {seminar.roomTitle && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{seminar.roomTitle}</Badge>
              </div>
            )}
            <h3 className="mb-2 text-xl font-bold leading-tight line-clamp-2 font-headline">
                <Link href={`/seminars/${seminar.id}`} className="hover:text-primary transition-colors">
                    {seminar.title}
                </Link>
            </h3>
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{timeStr}</span>
                </div>
            </div>
            {seminar.description && (
              <p className="mb-3 text-sm text-muted-foreground line-clamp-3">
                  {seminar.description.replace(/<[^>]*>/g, '').slice(0, 150)}â€¦
              </p>
            )}
        </div>
        <div className="mt-4 flex items-end justify-between">
            <p className="text-2xl font-extrabold text-primary">
                {isFree ? dict.home.free : `$${seminar.price}`}
            </p>
            <div className='flex gap-2'>
                <Button asChild variant="outline">
                    <Link href={`/seminars/${seminar.id}`}>
                        {pageDict.readMore}
                    </Link>
                </Button>
                {isFree ? (
                  <Button asChild>
                    <Link href={`/seminars/${seminar.id}`}>
                      {pageDict.buyTickets}
                    </Link>
                  </Button>
                ) : (
                  <StartSeminarPaymentButton seminarId={seminar.id} label={pageDict.buyTickets} />
                )}
            </div>
        </div>
      </div>
    </motion.div>
  );
}
