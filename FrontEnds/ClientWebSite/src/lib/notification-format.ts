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
  community_thread_reply: 'answer',
  exam_assigned: 'question',
  exam_submitted: 'admin',
  exam_graded: 'success',
  education_plan_assigned: 'success',
  education_plan_removed: 'error',
  student_shared_file_uploaded: 'success',
  teacher_shared_file_downloaded: 'success',
  course_enrollment: 'admin',
  course_enrollment_pending: 'admin',
  course_review_submitted: 'admin',
  course_review_approved: 'success',
  course_review_replied: 'answer',
  article_comment_submitted: 'admin',
  promotional_video_comment: 'admin',
  promotional_video_liked: 'success',
  support_conversation_opened: 'question',
  support_message_received: 'answer',
  teacher_profile_approved: 'success',
  teacher_profile_rejected: 'error',
  teacher_advertisement_approved: 'success',
  teacher_advertisement_rejected: 'error',
  teacher_new_course: 'success',
  teacher_new_book: 'success',
  teacher_new_article: 'success',
  teacher_new_video: 'success',
  teacher_new_portfolio_article: 'success',
};

function extractQuoted(text: string): string[] {
  return [...text.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function formatDateFa(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('fa-IR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
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
        body: p0
          ? `پرسش شما درباره «${p0}» تأیید نشد.`
          : 'پرسش شما تأیید نشد.',
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
        body: p0
          ? `درخواست پروژه «${p0}» تأیید شد.`
          : 'درخواست پروژه شما تأیید شد.',
      };
    case 'project_order_rejected':
      return {
        title: 'سفارش پروژه رد شد',
        body: p0
          ? `درخواست پروژه «${p0}» تأیید نشد.`
          : 'درخواست پروژه شما تأیید نشد.',
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
    case 'community_thread_reply':
      return {
        title: 'پاسخ جدید در بحث',
        body: p0
          ? `پاسخ جدید در بحث «${p0}» ثبت شد.`
          : 'پاسخ جدید در بحثی که دنبال می‌کنید ثبت شد.',
      };
    case 'exam_assigned':
      return {
        title: 'امتحان جدید',
        body: p0 ? `امتحان «${p0}» به شما اختصاص داده شد.` : 'یک امتحان جدید به شما اختصاص داده شد.',
      };
    case 'exam_submitted':
      return {
        title: 'تحویل آزمون',
        body: p0 ? `آزمون «${p0}» توسط دانشجو تحویل شد.` : 'یک آزمون توسط دانشجو تحویل شد.',
      };
    case 'exam_graded':
      return {
        title: 'نتیجه آزمون',
        body: p0 ? `امتحان «${p0}» تصحیح شد.` : 'امتحان شما تصحیح شد.',
      };
    case 'education_plan_assigned':
      return {
        title: 'پلن آموزشی جدید',
        body: p1
          ? `پلن آموزشی «${p0}» توسط استاد «${p1}» برای شما تعریف شد.`
          : p0
            ? `پلن آموزشی «${p0}» برای شما تعریف شد.`
            : 'یک پلن آموزشی جدید برای شما تعریف شد.',
      };
    case 'education_plan_removed':
      return {
        title: 'حذف پلن آموزشی',
        body: p1
          ? `پلن آموزشی «${p0}» توسط استاد «${p1}» از حساب شما حذف شد.`
          : p0
            ? `پلن آموزشی «${p0}» از حساب شما حذف شد.`
            : 'یک پلن آموزشی از حساب شما حذف شد.',
      };
    case 'course_enrollment':
      return {
        title: 'ثبت‌نام دانشجو',
        body: p1
          ? `دانشجو در دوره «${p1}» ثبت‌نام کرد.`
          : p0
            ? `«${p0}» در یکی از دوره‌های شما ثبت‌نام کرد.`
            : 'یک دانشجوی جدید در دوره شما ثبت‌نام کرد.',
      };
    case 'course_enrollment_pending':
      return {
        title: 'ثبت‌نام در انتظار تأیید',
        body: p1
          ? `ثبت‌نام جدید در دوره «${p1}» در انتظار تأیید است.`
          : 'ثبت‌نام جدیدی در انتظار تأیید است.',
      };
    case 'course_review_submitted':
      return {
        title: 'نظر جدید دوره',
        body: p1
          ? `دانشجو برای دوره «${p1}» نظر جدید ثبت کرد.`
          : p0
            ? `«${p0}» برای یکی از دوره‌های شما نظر ثبت کرد.`
            : 'یک دانشجو برای دوره شما نظر جدید ثبت کرد.',
      };
    case 'course_review_approved':
      return {
        title: 'نظر شما تأیید شد',
        body: p0
          ? `نظر شما در دوره «${p0}» تأیید شد و اکنون عمومی است.`
          : 'نظر شما تأیید شد و اکنون عمومی است.',
      };
    case 'course_review_replied':
      return {
        title: 'پاسخ استاد',
        body: p1
          ? `استاد به نظر شما در دوره «${p1}» پاسخ داد.`
          : p0
            ? `«${p0}» به نظر شما پاسخ داد.`
            : 'استاد به نظر شما پاسخ داد.',
      };
    case 'article_comment_submitted':
      return {
        title: 'دیدگاه جدید مقاله',
        body: p1
          ? `«${p0}» برای مقاله «${p1}» دیدگاه ثبت کرد.`
          : p0
            ? `«${p0}» برای یکی از مقالات شما دیدگاه ثبت کرد.`
            : 'دیدگاه جدیدی برای مقاله شما ثبت شد.',
      };
    case 'promotional_video_comment':
      return {
        title: 'کامنت جدید ویدیو',
        body: p1
          ? `«${p0}» برای ویدیو «${p1}» نظر گذاشت.`
          : p0
            ? `«${p0}» برای یکی از ویدیوهای شما نظر گذاشت.`
            : 'نظر جدیدی برای ویدیوی تبلیغاتی شما ثبت شد.',
      };
    case 'promotional_video_liked':
      return {
        title: 'لایک ویدیو',
        body: p0
          ? `ویدیوی «${p0}» لایک شد.`
          : 'یکی از ویدیوهای تبلیغاتی شما لایک شد.',
      };
    case 'support_conversation_opened':
      return {
        title: 'سوال جدید از دانشجو',
        body: item.body || 'یک دانشجو موضوع پشتیبانی جدیدی ثبت کرد.',
      };
    case 'support_message_received':
      return {
        title: item.title || 'پیام پشتیبانی',
        body: item.body || 'پیام جدیدی در گفتگوی پشتیبانی دریافت شد.',
      };
    case 'teacher_profile_approved':
      return {
        title: 'پروفایل تأیید شد',
        body: 'درخواست تأیید پروفایل شما تأیید شد و پروفایل شما اکنون در سایت منتشر شده است.',
      };
    case 'teacher_profile_rejected':
      return {
        title: 'پروفایل رد شد',
        body: p0
          ? `درخواست تأیید پروفایل شما رد شد. دلیل: «${p0}»`
          : 'درخواست تأیید پروفایل شما رد شد. لطفاً اطلاعات را اصلاح و مجدداً ارسال کنید.',
      };
    case 'teacher_advertisement_approved':
      return {
        title: 'تبلیغ تأیید شد',
        body: p0
          ? `تبلیغ «${p0}» تأیید شد و در صفحه آگهی‌ها نمایش داده می‌شود.`
          : 'تبلیغ شما تأیید شد و در صفحه آگهی‌ها نمایش داده می‌شود.',
      };
    case 'teacher_advertisement_rejected':
      return {
        title: 'تبلیغ رد شد',
        body: p1
          ? `تبلیغ «${p0}» رد شد. دلیل: «${p1}»`
          : p0
            ? `تبلیغ «${p0}» رد شد. لطفاً اصلاح و مجدداً ارسال کنید.`
            : 'تبلیغ شما رد شد. لطفاً اصلاح و مجدداً ارسال کنید.',
      };
    case 'teacher_new_course':
      return {
        title: 'دوره جدید از استاد دنبال‌شده',
        body: p1
          ? `استاد «${p0}» دوره «${p1}» را منتشر کرد.`
          : p0
            ? `استاد «${p0}» یک دوره جدید منتشر کرد.`
            : 'استادی که دنبال می‌کنید یک دوره جدید منتشر کرد.',
      };
    case 'teacher_new_book':
      return {
        title: 'کتاب جدید از استاد دنبال‌شده',
        body: p1
          ? `استاد «${p0}» کتاب «${p1}» را منتشر کرد.`
          : p0
            ? `استاد «${p0}» یک کتاب جدید منتشر کرد.`
            : 'استادی که دنبال می‌کنید یک کتاب جدید منتشر کرد.',
      };
    case 'teacher_new_article':
      return {
        title: 'مقاله جدید از استاد دنبال‌شده',
        body: p1
          ? `استاد «${p0}» مقاله «${p1}» را منتشر کرد.`
          : p0
            ? `استاد «${p0}» یک مقاله جدید منتشر کرد.`
            : 'استادی که دنبال می‌کنید یک مقاله جدید منتشر کرد.',
      };
    case 'teacher_new_video':
      return {
        title: 'ویدیو جدید از استاد دنبال‌شده',
        body: p1
          ? `استاد «${p0}» ویدیو «${p1}» را منتشر کرد.`
          : p0
            ? `استاد «${p0}» یک ویدیو جدید منتشر کرد.`
            : 'استادی که دنبال می‌کنید یک ویدیو جدید منتشر کرد.',
      };
    case 'teacher_new_portfolio_article':
      return {
        title: 'محتوای جدید از استاد دنبال‌شده',
        body: p1
          ? `استاد «${p0}» «${p1}» را منتشر کرد.`
          : p0
            ? `استاد «${p0}» محتوای جدیدی منتشر کرد.`
            : 'استادی که دنبال می‌کنید محتوای جدیدی منتشر کرد.',
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

export function formatNotificationText(
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
