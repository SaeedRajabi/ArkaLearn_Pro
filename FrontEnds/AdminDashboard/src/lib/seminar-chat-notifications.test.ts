import { showSeminarChatNotification } from './seminar-chat-notifications';

describe('seminar chat notifications', () => {
  it('uses the localized message title and actual message body', () => {
    const close = jest.fn();
    const notification = jest.fn().mockImplementation(() => ({ close, onclick: null }));
    Object.defineProperty(notification, 'permission', { value: 'granted' });
    Object.defineProperty(global, 'Notification', { configurable: true, value: notification });
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });

    showSeminarChatNotification({
      title: 'پیام جدید از سارا',
      senderName: 'سارا',
      message: 'سلام، کلاس شروع شد.',
      roomName: 'کلاس React',
    });

    expect(notification).toHaveBeenCalledWith('پیام جدید از سارا', {
      body: 'سلام، کلاس شروع شد.',
      tag: 'seminar-chat-کلاس React',
    });
  });
});
