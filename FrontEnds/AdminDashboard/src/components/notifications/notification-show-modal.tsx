import * as React from 'react';
import Link from 'next/link';
import { Bell, CheckCircle2, MessageCircleQuestion, MessageSquareReply, ShieldAlert, ShoppingBag, Trash2, XCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    formatNotificationText,
    getNotificationIconKind,
    type NotificationIconKind,
} from '@/lib/notification-format';
import type { UserNotificationItem } from '@/services/user-notification-api.service';
import styles from '@/app/dashboard/notifications/notifications-page.module.css';

export function TypeIcon({ kind }: { kind: NotificationIconKind }) {
    const iconClass = `${styles.iconWrap} ${styles[`icon_${kind}`] ?? styles.icon_default}`;
    const icons: Record<NotificationIconKind, React.ReactNode> = {
        question: <MessageCircleQuestion className={styles.iconSvg} aria-hidden />,
        answer: <MessageSquareReply className={styles.iconSvg} aria-hidden />,
        order: <ShoppingBag className={styles.iconSvg} aria-hidden />,
        success: <CheckCircle2 className={styles.iconSvg} aria-hidden />,
        error: <XCircle className={styles.iconSvg} aria-hidden />,
        admin: <ShieldAlert className={styles.iconSvg} aria-hidden />,
        default: <Bell className={styles.iconSvg} aria-hidden />,
    };
    return <span className={iconClass}>{icons[kind]}</span>;
}

type NotificationShowModalProps = {
    /** اعلان فعلی؛ null یعنی مدال بسته است */
    item: UserNotificationItem | null;
    onClose: () => void;
    onDelete: (item: UserNotificationItem) => void | Promise<void>;
    locale: 'en' | 'fa';
    isRtl: boolean;
    t: (key: string) => string;
};

export default function NotificationShowModal({
                                                  item,
                                                  onClose,
                                                  onDelete,
                                                  locale,
                                                  isRtl,
                                                  t,
                                              }: NotificationShowModalProps) {
    if (!item) {
        return <Dialog open={false} onOpenChange={() => {}} />;
    }

    const text = formatNotificationText(item, locale);
    const hasLink = !!item.linkUrl && item.linkUrl !== '#';

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent dir={isRtl ? 'rtl' : 'ltr'} className="sm:max-w-md">
                <DialogHeader className={isRtl ? 'text-right' : 'text-left'}>
                    <div className="flex items-center gap-3">
                        <TypeIcon kind={getNotificationIconKind(item.type)} />
                        <DialogTitle>{text.title}</DialogTitle>
                    </div>
                    <DialogDescription className="whitespace-pre-line pt-2 text-foreground/80">
                        {text.body}
                    </DialogDescription>
                </DialogHeader>

                <span className={styles.itemTime}>{text.timeLabel}</span>

                <DialogFooter className="gap-2 sm:gap-2">
                    {hasLink && (
                        <Button asChild variant="secondary">
                            <Link href={item.linkUrl!}>{t('notifications_open_link')}</Link>
                        </Button>
                    )}
                    <Button variant="outline" onClick={onClose}>
                        {t('actions_close')}
                    </Button>
                    <Button variant="destructive" onClick={() => void onDelete(item)}>
                        <Trash2 className="h-4 w-4" aria-hidden />
                        {t('notifications_delete')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
