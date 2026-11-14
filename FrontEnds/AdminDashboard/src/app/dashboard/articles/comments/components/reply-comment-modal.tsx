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
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { addArticleComment } from '@/services/article-api.service';

interface ReplyCommentModalProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  comment: {
    id: string;
    articleId: string;
    userName: string;
    userAvatarUrl?: string;
    userInitials: string;
    comment: string;
  };
  onSuccessAction?: () => void;
}

export function ReplyCommentModal({ open, onOpenChangeAction, comment, onSuccessAction }: ReplyCommentModalProps) {
  const { t } = useLanguage();
  const onOpenChange = onOpenChangeAction;
  const onSuccess = onSuccessAction;
  const { toast } = useToast();
  const [replyText, setReplyText] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async () => {
    if (!replyText.trim()) return;

    setSaving(true);
    try {
      await addArticleComment({
        articleId: Number(comment.articleId),
        content: replyText,
        rating: 0,
        like: 0,
        parentId: Number(comment.id),
      });
      toast({
        title: t('reply_sent_title'),
        description: t('reply_sent_description'),
      });
      setReplyText('');
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_reply') || 'Failed to send reply.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('reply_to_comment_title')}</DialogTitle>
          <DialogDescription>{t('reply_to_comment_description')}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="p-4 border rounded-md bg-muted/50">
            <div className="flex items-start gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={comment.userAvatarUrl} alt={comment.userName} />
                <AvatarFallback>{comment.userInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{comment.userName}</p>
                <p className="text-sm text-muted-foreground">{comment.comment}</p>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel_button')}
          </Button>
          <Button onClick={handleSubmit} disabled={!replyText.trim() || saving}>
            {saving ? t('saving') || 'Saving...' : t('send_reply_button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
