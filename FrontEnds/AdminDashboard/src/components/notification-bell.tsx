'use client';

import * as React from 'react';
import Link from 'next/link';
import { Trash2, X, Check, Bell } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import {
  deleteNotification,
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotificationItem,
} from '@/services/user-notification-api.service';
import { playNotificationSound } from '@/lib/notification-sound';
import { useAuth } from '@/components/auth/auth-provider';
import { useProjectQaHub } from '@/hooks/use-project-qa-hub';
import { usePlatformSupportTicketHub } from '@/hooks/use-platform-support-ticket-hub';
import { useSupportChatHub } from '@/hooks/use-support-chat-hub';
import {
  formatNotificationText,
  getNotificationIconKind,
  type NotificationIconKind,
} from '@/lib/notification-format';
import styles from './notification-bell.module.css';

function TypeIcon({ kind }: { kind: NotificationIconKind }) {
  const bg = {
    question: styles.iconQuestion,
    answer: styles.iconAnswer,
    order: styles.iconOrder,
    success: styles.iconSuccess,
    error: styles.iconError,
    admin: styles.iconAdmin,
    default: styles.iconDefault,
  }[kind];

  return (
    <span className={`${styles.iconWrap} ${bg}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon.png" alt="" className={styles.brandLogo} />
    </span>
  );
}

export function NotificationBell() {
  const { t, locale } = useLanguage();
  const { authUser } = useAuth();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [count, setCount] = React.useState(0);
  const [items, setItems] = React.useState<UserNotificationItem[]>([]);
  const [open, setOpen] = React.useState(false);
  const prevCountRef = React.useRef(0);
  const initializedRef = React.useRef(false);
  const isRtl = locale === 'fa';

  const refresh = React.useCallback(async (options?: { skipSound?: boolean }) => {
    try {
      const [c, list] = await Promise.all([getUnreadNotificationCount(), getMyNotifications(15)]);
      if (initializedRef.current && c > prevCountRef.current && !options?.skipSound) {
        playNotificationSound();
      }
      initializedRef.current = true;
      prevCountRef.current = c;
      setCount(c);
      setItems(list);
    } catch {
      setCount(0);
      setItems([]);
    }
  }, []);

  const handleNotificationPulse = React.useCallback(() => {
    playNotificationSound();
    void refresh({ skipSound: true });
  }, [refresh]);

  const handleRealtimeRefresh = React.useCallback(() => {
    void refresh();
  }, [refresh]);

  useProjectQaHub({
    userId: authUser?.id,
    isAdmin: true,
    handlers: authUser?.id
      ? {
          onNotificationPulse: handleNotificationPulse,
          onQuestionSubmitted: handleRealtimeRefresh,
        }
      : undefined,
  });

  usePlatformSupportTicketHub({
    userId: authUser?.id,
    isAdmin: true,
    enabled: Boolean(authUser?.id),
    handlers: authUser?.id
      ? {
          onNotificationPulse: handleNotificationPulse,
          onTicketOpened: handleRealtimeRefresh,
          onMessagePosted: handleRealtimeRefresh,
        }
      : undefined,
  });

  useSupportChatHub({
    userId: authUser?.id,
    enabled: Boolean(authUser?.id),
    handlers: authUser?.id
      ? {
          onNotificationPulse: handleNotificationPulse,
          onConversationOpened: handleRealtimeRefresh,
          onMessagePosted: handleRealtimeRefresh,
        }
      : undefined,
  });

  React.useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 15000);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onPointer);
    };
  }, [open]);

  const removeItemLocally = (id: number, wasUnread: boolean) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setCount((c) => Math.max(0, c - 1));
  };

  const handleOpenItem = async (item: UserNotificationItem) => {
    if (!item.isRead) {
      try {
        await markNotificationRead(item.id);
        setCount((c) => Math.max(0, c - 1));
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  };

  const handleMarkRead = async (e: React.MouseEvent, item: UserNotificationItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.isRead) return;
    try {
      await markNotificationRead(item.id);
      setCount((c) => Math.max(0, c - 1));
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
    } catch {
      /* ignore */
    }
  };

  const handleDismiss = async (e: React.MouseEvent, item: UserNotificationItem) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!item.isRead) {
        await markNotificationRead(item.id);
        setCount((c) => Math.max(0, c - 1));
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      } else {
        await deleteNotification(item.id);
        removeItemLocally(item.id, false);
      }
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (e: React.MouseEvent, item: UserNotificationItem) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteNotification(item.id);
      removeItemLocally(item.id, !item.isRead);
    } catch {
      /* ignore */
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setCount(0);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      /* ignore */
    }
  };

  const hasUnread = count > 0;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={t('notifications_title')}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (next) void refresh();
            return next;
          });
        }}
      >
        <svg className={styles.bellIcon} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
        {count > 0 && <span className={styles.badge}>{count > 99 ? '99+' : count}</span>}
      </button>

      {open && (
        <>
          <div className={styles.backdrop} aria-hidden onClick={() => setOpen(false)} />
          <div
            className={`${styles.panel} ${isRtl ? styles.panelRtl : ''}`}
            dir={isRtl ? 'rtl' : 'ltr'}
            role="dialog"
            aria-label={t('notifications_title')}
          >
            <div className={styles.header}>
              <h2 className={styles.headerTitle}>{t('notifications_title')}</h2>
              {hasUnread && (
                <button type="button" className={styles.markAll} onClick={() => void handleMarkAll()}>
                  {t('notifications_mark_all_read')}
                </button>
              )}
            </div>

            <ul className={styles.list}>
              {items.length === 0 ? (
                <li className={styles.empty}>{t('notifications_empty')}</li>
              ) : (
                items.map((item) => {
                  const text = formatNotificationText(item, locale);
                  const iconKind = getNotificationIconKind(item.type);
                  const href = item.linkUrl?.startsWith('/') ? item.linkUrl : item.linkUrl || '#';
                  return (
                    <li key={item.id} className={styles.itemRow}>
                      <Link
                        href={href}
                        className={`${styles.item} ${!item.isRead ? styles.itemUnread : ''}`}
                        onClick={() => void handleOpenItem(item)}
                      >
                        <TypeIcon kind={iconKind} />
                        <div className={styles.content}>
                          <p className={styles.itemTitle}>{text.title}</p>
                          <p className={styles.itemBody}>{text.body}</p>
                          <span className={styles.itemTime}>{text.timeLabel}</span>
                        </div>
                      </Link>
                      <div className={styles.itemActions}>
                        {!item.isRead && (
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnRead}`}
                            aria-label={t('notifications_mark_read')}
                            title={t('notifications_mark_read')}
                            onClick={(e) => void handleMarkRead(e, item)}
                          >
                            <Check className={styles.actionIcon} aria-hidden />
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.actionBtn}
                          aria-label={t('notifications_close')}
                          title={t('notifications_dismiss')}
                          onClick={(e) => void handleDismiss(e, item)}
                        >
                          <X className={styles.actionIcon} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                          aria-label={t('notifications_delete')}
                          title={t('notifications_delete')}
                          onClick={(e) => void handleDelete(e, item)}
                        >
                          <Trash2 className={styles.actionIcon} aria-hidden />
                        </button>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>

            <div className={styles.footer}>
              <Link href="/dashboard/notifications" className={styles.viewAll} onClick={() => setOpen(false)}>
                <Bell className={styles.viewAllIcon} aria-hidden />
                {t('notifications_view_all')}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
