'use client';

import * as React from 'react';
import Link from 'next/link';
import { Trash2, X } from 'lucide-react';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import {
  deleteNotification,
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotificationItem,
} from '@/lib/api/notifications';
import { useAuth } from '@/contexts/auth-context';
import { useSupportNotificationSettings } from '@/hooks/use-support-notifications';
import { useProjectQaHub } from '@/hooks/use-project-qa-hub';
import { useCommunityQaHub } from '@/hooks/use-community-qa-hub';
import { useEngagementHub } from '@/hooks/use-engagement-hub';
import { useSupportChatHub } from '@/hooks/use-support-chat-hub';
import {
  formatNotificationText,
  getNotificationIconKind,
  type NotificationIconKind,
} from '@/lib/notification-format';
import { BRAND_ICON_192_PATH } from '@/lib/seo/brand';
import styles from './notification-bell.module.css';

interface NotificationBellProps {
  dict: Dictionary;
  lang: 'en' | 'fa';
}

function TypeIcon({ kind }: { kind: NotificationIconKind }) {
  const cls = {
    question: styles.iconQuestion,
    answer: styles.iconAnswer,
    order: styles.iconOrder,
    success: styles.iconSuccess,
    error: styles.iconError,
    admin: styles.iconAdmin,
    default: styles.iconDefault,
  }[kind];

  return (
    <span className={`${styles.iconWrap} ${cls}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND_ICON_192_PATH} alt="" className={styles.brandLogo} />
    </span>
  );
}

function resolveNotificationLink(linkUrl?: string | null) {
  if (!linkUrl) return '/account';
  if (linkUrl.startsWith('http')) return linkUrl;
  return linkUrl.startsWith('/') ? linkUrl : `/${linkUrl}`;
}

export function NotificationBell({ dict, lang }: NotificationBellProps) {
  const { user } = useAuth();
  const { playSound, showBrowserNotification } = useSupportNotificationSettings();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [count, setCount] = React.useState(0);
  const [items, setItems] = React.useState<UserNotificationItem[]>([]);
  const [open, setOpen] = React.useState(false);
  const prevCountRef = React.useRef(0);
  const initializedRef = React.useRef(false);
  const isRtl = lang === 'fa';

  const t = (key: string, def: string) => getDictValue(dict, key, def);

  const refresh = React.useCallback(async () => {
    try {
      const [c, list] = await Promise.all([getUnreadNotificationCount(), getMyNotifications(15)]);
      if (initializedRef.current && c > prevCountRef.current) {
        playSound();
        const latest = list.find((item) => !item.isRead) ?? list[0];
        if (latest) {
          const text = formatNotificationText(latest, lang);
          showBrowserNotification(text.title, text.body, () => {
            window.location.href = resolveNotificationLink(latest.linkUrl);
          });
        }
      }
      initializedRef.current = true;
      prevCountRef.current = c;
      setCount(c);
      setItems(list);
    } catch {
      setCount(0);
      setItems([]);
    }
  }, [lang, playSound, showBrowserNotification]);

  useProjectQaHub({
    userId: user?.id ?? null,
    handlers: user?.id
      ? {
          onNotificationPulse: () => void refresh(),
          onAnswerPosted: () => void refresh(),
        }
      : undefined,
  });

  useCommunityQaHub({
    userId: user?.id ?? null,
    handlers: user?.id
      ? {
          onNotificationPulse: () => void refresh(),
          onReplyPosted: () => void refresh(),
        }
      : undefined,
  });

  useEngagementHub({
    userId: user?.id ?? null,
    handlers: user?.id
      ? {
          onNotificationPulse: () => void refresh(),
          onCommentAdded: () => void refresh(),
          onLikeChanged: () => void refresh(),
        }
      : undefined,
  });

  useSupportChatHub({
    userId: user?.id,
    handlers: {
      onNotificationPulse: () => void refresh(),
      onMessagePosted: () => void refresh(),
      onConversationOpened: () => void refresh(),
    },
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
        aria-label={t('notifications.title', 'Notifications')}
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
            aria-label={t('notifications.title', 'Notifications')}
          >
            <div className={styles.header}>
              <h2 className={styles.headerTitle}>{t('notifications.title', 'Notifications')}</h2>
              {hasUnread && (
                <button type="button" className={styles.markAll} onClick={() => void handleMarkAll()}>
                  {t('notifications.markAllRead', 'Mark all read')}
                </button>
              )}
            </div>

            <ul className={styles.list}>
              {items.length === 0 ? (
                <li className={styles.empty}>{t('notifications.empty', 'No notifications.')}</li>
              ) : (
                items.map((item) => {
                  const text = formatNotificationText(item, lang);
                  const iconKind = getNotificationIconKind(item.type);
                  return (
                    <li key={item.id} className={styles.itemRow}>
                      <Link
                        href={resolveNotificationLink(item.linkUrl)}
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
                        <button
                          type="button"
                          className={styles.actionBtn}
                          aria-label={t('notifications.close', 'Close notification')}
                          title={t('notifications.dismiss', 'Dismiss')}
                          onClick={(e) => void handleDismiss(e, item)}
                        >
                          <X className={styles.actionIcon} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                          aria-label={t('notifications.delete', 'Delete')}
                          title={t('notifications.delete', 'Delete')}
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
          </div>
        </>
      )}
    </div>
  );
}
