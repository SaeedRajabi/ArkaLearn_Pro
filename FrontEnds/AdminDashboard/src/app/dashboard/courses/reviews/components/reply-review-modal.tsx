
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/components/language-provider';
import { useStore } from '@/lib/store';
import type { CourseReview } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth-provider';

interface ReplyReviewModalProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  review: CourseReview;
}

export function ReplyReviewModal({ open, onOpenChangeAction, review }: ReplyReviewModalProps) {
  const { t } = useLanguage();
  const onOpenChange = onOpenChangeAction;
  const { replyToReview } = useStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [replyText, setReplyText] = React.useState('');

  const handleSubmit = () => {
    if (!replyText.trim() || !user) return;

    replyToReview(review.id, {
      parentId: review.id,
      courseId: review.courseId,
      userId: user.id,
      userName: user.name,
      userInitials: user.initials,
      userAvatarUrl: user.avatarUrl,
      comment: replyText,
      createdAt: new Date(),
    });

    toast({
      title: t('reply_sent_title'),
      description: t('reply_sent_description'),
    });
    setReplyText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('reply_to_review_title')}</DialogTitle>
          <DialogDescription>{t('reply_to_review_description')}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="p-4 border rounded-md bg-muted/50">
            <div className="flex items-start gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={review.userAvatarUrl} alt={review.userName} />
                <AvatarFallback>{review.userInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{review.userName}</p>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              </div>
            </div>
          </div>
          <Textarea
            placeholder={t('reply_placeholder')}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={5}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel_button')}</Button>
          <Button onClick={handleSubmit} disabled={!replyText.trim()}>{t('send_reply_button')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

