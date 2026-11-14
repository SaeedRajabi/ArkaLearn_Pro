'use client';

import * as React from 'react';
import { getSupportChatClientSettings } from '@/lib/api/support-chat';
import { BRAND_FAVICON_PATH } from '@/lib/seo/brand';
import { normalizeNotificationSoundKey, playNotificationSound } from '@/lib/notification-sound';

let cachedSoundKey: string | null = null;

async function resolveSoundKey(): Promise<string> {
  if (cachedSoundKey) return cachedSoundKey;
  try {
    const settings = await getSupportChatClientSettings();
    cachedSoundKey = normalizeNotificationSoundKey(settings.notificationSoundKey);
  } catch {
    cachedSoundKey = 'chime';
  }
  return cachedSoundKey;
}

export function useSupportNotificationSettings() {
  const [soundKey, setSoundKey] = React.useState('chime');
  const [browserPermission, setBrowserPermission] = React.useState<NotificationPermission>('default');

  React.useEffect(() => {
    void resolveSoundKey().then(setSoundKey);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  const playSound = React.useCallback(() => {
    playNotificationSound(soundKey);
  }, [soundKey]);

  const requestBrowserPermission = React.useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    setBrowserPermission(result);
    return result === 'granted';
  }, []);

  const showBrowserNotification = React.useCallback(
    (title: string, body: string, onClick?: () => void) => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      if (document.visibilityState === 'visible') return;

      const notification = new Notification(title, {
        body,
        icon: BRAND_FAVICON_PATH,
        tag: 'support-chat',
      });
      notification.onclick = () => {
        window.focus();
        onClick?.();
        notification.close();
      };
    },
    []
  );

  return {
    soundKey,
    browserPermission,
    playSound,
    requestBrowserPermission,
    showBrowserNotification,
  };
}
