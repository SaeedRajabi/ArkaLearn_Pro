'use client';

import * as React from 'react';
import {
  Bell,
  BellOff,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { useAuth } from '@/components/auth/auth-provider';
import { useProjectQaHub } from '@/hooks/use-project-qa-hub';
import { playNotificationSound } from '@/lib/notification-sound';
import {
  formatNotificationText,
  getNotificationIconKind,
} from '@/lib/notification-format';
import {
  deleteNotification,
  getMyNotificationsPaged,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotificationItem,
} from '@/services/user-notification-api.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import styles from './notifications-page.module.css';
import {toPersianDigits} from "@/lib/utils/format/digits";
import NotificationShowModal, {TypeIcon} from "@/components/notifications/notification-show-modal"



const PAGE_SIZE = 5;



export default function NotificationsPage() {
  const { t, locale } = useLanguage();
  const { authUser } = useAuth();
  const [items, setItems] = React.useState<UserNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const isRtl = locale === 'fa';
  const [selected, setSelected] = React.useState<UserNotificationItem | null>(null);
  const selectedLive = selected ? items.find((n) => n.id === selected.id) ?? selected : null;
  const fmt = (value: string | number) => (isRtl ? toPersianDigits(value) : String(value));

  const handleOpen = (item: UserNotificationItem) => {
    setSelected(item);
    void handleMarkRead(item); // اگر خوانده شده بود، خودش return می‌کند
  };

  const handleDeleteFromModal = async () => {
    if (!selected) return;
    const target = selected;
    setSelected(null);
    await handleDelete(target);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const refresh = React.useCallback(
    async (targetPage = page, options?: { skipSound?: boolean }) => {
      setLoading(true);
      try {
        const [count, paged] = await Promise.all([
          getUnreadNotificationCount(),
          getMyNotificationsPaged(targetPage, PAGE_SIZE),
        ]);
        setUnreadCount(count);
        setTotalCount(paged.totalCount);
        setItems(paged.items);
        setPage(paged.page);

        if (
          !options?.skipSound &&
          count > 0 &&
          paged.page === 1 &&
          paged.items.some((item) => !item.isRead)
        ) {
          /* pulse handler plays sound */
        }
      } catch {
        setUnreadCount(0);
        setTotalCount(0);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [page],
  );

  const handleNotificationPulse = React.useCallback(() => {
    playNotificationSound();
    void refresh(1, { skipSound: true });
  }, [refresh]);

  useProjectQaHub({
    userId: authUser?.id,
    isAdmin: true,
    handlers: {
      onNotificationPulse: handleNotificationPulse,
      onQuestionSubmitted: () => void refresh(page),
    },
  });

  React.useEffect(() => {
    void refresh(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkRead = async (item: UserNotificationItem) => {
    if (item.isRead) return;
    try {
      await markNotificationRead(item.id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
    } catch {
      /* ignore */
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (item: UserNotificationItem) => {
    try {
      await deleteNotification(item.id);
      const nextTotal = Math.max(0, totalCount - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      const nextPage = page > nextTotalPages ? nextTotalPages : page;
      if (!item.isRead) setUnreadCount((c) => Math.max(0, c - 1));
      setTotalCount(nextTotal);
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        setItems((prev) => prev.filter((n) => n.id !== item.id));
      }
    } catch {
      /* ignore */
    }
  };

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className={styles.page} dir={isRtl ? 'rtl' : 'ltr'}>
      <Card className={styles.heroCard}>
        <CardHeader className={styles.heroHeader}>
          <div className={styles.heroMain}>
            <div className={styles.heroIcon}>
              <Bell aria-hidden />
            </div>
            <div>
              <h1 className={styles.title}>{t('notifications_title')}</h1>
              <p className={styles.subtitle}>{t('notifications_description')}</p>
            </div>
          </div>
          <div className={styles.heroActions}>
            <div className={styles.stats}>
              <span className={styles.statPill}>
                {t('notifications_total_count').replace('{count}', fmt(String(totalCount)))}
              </span>
              {unreadCount > 0 && (
                <span className={`${styles.statPill} ${styles.statPillUnread}`}>
                  {t('notifications_unread_count').replace('{count}', String(unreadCount))}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button type="button" variant="secondary" size="sm" onClick={() => void handleMarkAll()}>
                <Check className="h-4 w-4" aria-hidden />
                {t('notifications_mark_all_read')}
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <Card className={styles.listCard}>
        <CardContent className={styles.listBody}>
          {loading ? (
            <div className={styles.skeletonList}>
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <div key={index} className={styles.skeletonRow}>
                  <Skeleton className={styles.skeletonIcon} />
                  <div className={styles.skeletonContent}>
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <BellOff aria-hidden />
              </div>
              <p className={styles.emptyTitle}>{t('notifications_empty')}</p>
              <p className={styles.emptyHint}>{t('notifications_empty_hint')}</p>
            </div>
          ) : (
            <ul className={styles.list}>
              {items.map((item) => {
                const text = formatNotificationText(item, locale);
                const iconKind = getNotificationIconKind(item.type);
                return (
                  <li
                    key={item.id}
                    className={`${styles.row} ${!item.isRead ? styles.rowUnread : ''}`}
                  >
                    {!item.isRead && <span className={styles.unreadAccent} aria-hidden />}
                    <button
                        type="button"
                        className={styles.rowLink}
                        onClick={() => handleOpen(item)}
                    >
                      <TypeIcon kind={iconKind} />
                      <div className={styles.content}>
                        <div className={styles.titleRow}>
                          <p className={`${styles.itemTitle} ${!item.isRead ? styles.itemTitleUnread : ''}`}>
                            {text.title}
                          </p>
                          {!item.isRead && (
                              <Badge variant="secondary" className={styles.unreadBadge}>
                                {t('notifications_unread_badge')}
                              </Badge>
                          )}
                        </div>
                        <p className={styles.itemBody}>{text.body}</p>
                        <span className={styles.itemTime}>{fmt(text.timeLabel)}</span>
                      </div>
                    </button>

                    <div className={styles.actions}>
                      {!item.isRead && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={styles.actionBtn}
                          aria-label={t('notifications_mark_read')}
                          title={t('notifications_mark_read')}
                          onClick={() => void handleMarkRead(item)}
                        >
                          <Check className="h-4 w-4" aria-hidden />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                        aria-label={t('notifications_delete')}
                        title={t('notifications_delete')}
                        onClick={() => void handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>

        {!loading && totalCount > 0 && (
          <CardFooter className={styles.footer}>
            <p className={styles.summary}>
              {t('notifications_page_summary')
                .replace('{from}', fmt(String(rangeStart)))
                .replace('{to}', fmt(String(rangeEnd)))
                .replace('{total}', fmt(String(totalCount)))}
            </p>
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  {t('pagination_previous')}
                </Button>
                <span className={styles.pageIndicator}>
                  {t('notifications_page_indicator')
                    .replace('{page}', fmt(String(page)))
                    .replace('{totalPages}', fmt(String(totalPages)))}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  {t('pagination_next')}
                  {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </CardFooter>
        )}
      </Card>
      <NotificationShowModal
          item={selectedLive}
          onClose={() => setSelected(null)}
          onDelete={handleDeleteFromModal}
          locale={locale}
          isRtl={isRtl}
          t={t}
      />


    </div>
  );
}
