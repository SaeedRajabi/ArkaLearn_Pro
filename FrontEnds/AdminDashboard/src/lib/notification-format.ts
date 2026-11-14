export type NotificationDisplayItem = {
  id: number;
  title: string;
  body: string;
  type: string;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationIconKind =
  | 'question'
  | 'answer'
  | 'order'
  | 'success'
  | 'error'
  | 'admin'
  | 'default';

const TYPE_ICON: Record<string, NotificationIconKind> = {
  project_question_submitted: 'question',
  project_question_approved: 'success',
  project_question_rejected: 'error',
  project_question_answered: 'answer',
  project_order_submitted: 'order',
  project_order_approved: 'success',
  project_order_rejected: 'error',
  admin_new_project_question: 'admin',
  admin_new_project_order: 'admin',
  admin_new_contact_request: 'admin',
  admin_new_platform_ticket: 'admin',
  admin_platform_ticket_message: 'admin',
  support_conversation_opened: 'admin',
  support_message_received: 'admin',
  teacher_profile_pending: 'admin',
  teacher_advertisement_pending: 'admin',
  student_shared_file_uploaded: 'success',
  teacher_shared_file_downloaded: 'success',
};
const PERSIAN_DIGITS = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
const toFa = (s: string) => s.replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);

function extractQuoted(text: string): string[] {
  return [...text.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function formatDateFa(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function formatDateEn(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatFa(item: NotificationDisplayItem): { title: string; body: string } {
  const quotes = extractQuoted(item.body);
  const p0 = quotes[0] ?? '';
  const p1 = quotes[1] ?? '';

  switch (item.type) {
    case 'project_question_submitted':
      return {
        title: 'پرسش ثبت شد',
        body: p0
          ? `پرسش شما درباره «${p0}» ثبت شد و در انتظار تأیید مدیر است.`
          : 'پرسش شما ثبت شد و در انتظار تأیید مدیر است.',
      };
    case 'project_question_approved':
      return {
        title: 'پرسش تأیید شد',
        body: p0
          ? `پرسش شما درباره «${p0}» تأیید شد و برای همه نمایش داده می‌شود.`
          : 'پرسش شما تأیید شد و برای همه نمایش داده می‌شود.',
      };
    case 'project_question_rejected':
      return {
        title: 'پرسش رد شد',
        body: p0 ? `پرسش شما درباره «${p0}» تأیید نشد.` : 'پرسش شما تأیید نشد.',
      };
    case 'project_question_answered':
      return {
        title: 'پاسخ جدید',
        body: p1
          ? `مدیر به پرسش شما درباره «${p1}» پاسخ داد.`
          : p0
            ? `مدیر به پرسش شما درباره «${p0}» پاسخ داد.`
            : 'مدیر به پرسش شما پاسخ داد.',
      };
    case 'project_order_submitted':
      return {
        title: 'سفارش پروژه ثبت شد',
        body: p0
          ? `درخواست پروژه «${p0}» با موفقیت ثبت شد و به‌زودی بررسی می‌شود.`
          : 'درخواست پروژه شما ثبت شد و به‌زودی بررسی می‌شود.',
      };
    case 'project_order_approved':
      return {
        title: 'سفارش پروژه تأیید شد',
        body: p0 ? `درخواست پروژه «${p0}» تأیید شد.` : 'درخواست پروژه شما تأیید شد.',
      };
    case 'project_order_rejected':
      return {
        title: 'سفارش پروژه رد شد',
        body: p0 ? `درخواست پروژه «${p0}» تأیید نشد.` : 'درخواست پروژه شما تأیید نشد.',
      };
    case 'admin_new_project_question':
      return {
        title: 'پرسش جدید پروژه',
        body: p0 ? `پرسش جدید درباره «${p0}» ثبت شده است.` : 'یک پرسش جدید پروژه ثبت شده است.',
      };
    case 'admin_new_project_order':
      return {
        title: 'سفارش پروژه جدید',
        body: p0 ? `سفارش پروژه جدید: «${p0}»` : 'یک سفارش پروژه جدید ثبت شده است.',
      };
    case 'admin_new_contact_request':
      return {
        title: 'درخواست تماس جدید',
        body: p0 ? `درخواست ارتباط جدید: ${p0}` : 'یک درخواست تماس جدید ثبت شده است.',
      };
    case 'teacher_profile_pending':
      return {
        title: 'تأیید پروفایل استاد',
        body: p0
          ? `استاد «${p0}» تغییراتی در پروفایل داده و منتظر تأیید است.`
          : 'یک استاد تغییراتی در پروفایل داده و منتظر تأیید است.',
      };
    case 'teacher_advertisement_pending':
      return {
        title: 'تأیید تبلیغ استاد',
        body: p1
          ? `استاد «${p0}» تغییراتی در تبلیغ «${p1}» داده و منتظر تأیید است.`
          : p0
            ? `استاد «${p0}» تغییراتی در تبلیغ داده و منتظر تأیید است.`
            : 'یک استاد تغییراتی در تبلیغ داده و منتظر تأیید است.',
      };
    case 'student_shared_file_uploaded':
      return {
        title: 'فایل جلسه جدید',
        body: item.body,
      };
    case 'teacher_shared_file_downloaded':
      return {
        title: 'دانلود فایل توسط دانشجو',
        body: item.body,
      };
    default:
      return { title: item.title, body: item.body };
  }
}

export function getNotificationIconKind(type: string): NotificationIconKind {
  return TYPE_ICON[type] ?? 'default';
}

export function formatNotificationText1(
  item: NotificationDisplayItem,
  lang: 'en' | 'fa'
): { title: string; body: string; timeLabel: string } {
  const timeLabel = lang === 'fa' ? formatDateFa(item.createdAt) : formatDateEn(item.createdAt);
  if (lang === 'fa') {
    const fa = formatFa(item);
    return { ...fa, timeLabel };
  }
  return { title: item.title, body: item.body, timeLabel };
}


export function formatNotificationText(item:NotificationDisplayItem, lang: 'en' | 'fa') {
  const timeLabel = lang === 'fa' ? formatDateFa(item.createdAt) : formatDateEn(item.createdAt);
  if (lang === 'fa') {
    const fa = formatFa(item);
    return { title: toFa(fa.title), body: toFa(fa.body), timeLabel };
  }
  return { title: item.title, body: item.body, timeLabel };
}