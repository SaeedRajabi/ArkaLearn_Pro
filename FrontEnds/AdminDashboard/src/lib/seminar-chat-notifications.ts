/** Browser notifications for seminar room chat (when tab is in background). */

export async function ensureChatNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'unsupported';
  }
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function showSeminarChatNotification(opts: {
  title: string;
  senderName: string;
  message: string;
  roomName?: string;
}): void {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  if (typeof document !== 'undefined' && !document.hidden) return;

  const body =
    opts.message.length > 140 ? `${opts.message.slice(0, 137)}...` : opts.message;

  try {
    const n = new Notification(opts.title, {
      body,
      tag: `seminar-chat-${opts.roomName ?? 'room'}`,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* ignore */
  }
}
