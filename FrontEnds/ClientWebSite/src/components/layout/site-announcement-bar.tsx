import type { CSSProperties } from 'react';
import type { SiteAnnouncementQri } from '@/lib/api/site-announcement';
import { RichHtmlContent } from '@/components/shared/rich-html-content';
import { getAboutImageUrl } from '@/lib/utils/image-url';
import { cn } from '@/lib/utils';

type SiteAnnouncementBarProps = {
  announcement: SiteAnnouncementQri;
  dir: 'ltr' | 'rtl';
};

function buildBarStyle(announcement: SiteAnnouncementQri): CSSProperties {
  if (announcement.backgroundType === 1) {
    return {
      background: `linear-gradient(${announcement.gradientAngle}deg, ${announcement.gradientStartColor}, ${announcement.gradientEndColor})`,
    };
  }

  if (announcement.backgroundType === 2 && announcement.backgroundImageUrl) {
    const imageUrl = getAboutImageUrl(announcement.backgroundImageUrl, '');
    if (imageUrl) {
      return {
        backgroundImage: `url("${imageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
  }

  return { backgroundColor: announcement.backgroundColor };
}

export function SiteAnnouncementBar({ announcement, dir }: SiteAnnouncementBarProps) {
  if (!announcement.isEnabled) return null;

  const hasContent = announcement.contentHtml?.replace(/<[^>]*>/g, '').trim().length > 0;
  if (!hasContent) return null;

  const barStyle = buildBarStyle(announcement);

  return (
    <aside
      role="region"
      aria-label="Site announcement"
      dir={dir}
      className={cn(
        'site-announcement-bar w-full overflow-hidden',
        'max-h-[200px]'
      )}
      style={{ ...barStyle, color: announcement.textColor }}
    >
      <div className="mx-auto max-h-[200px] w-full max-w-full overflow-y-auto px-3 py-2 sm:px-4 sm:py-3">
        <RichHtmlContent
          html={announcement.contentHtml}
          dir={dir}
          className={cn(
            'site-announcement-content text-sm leading-snug sm:text-base',
            'prose-p:my-0 prose-p:text-inherit prose-headings:my-0 prose-headings:text-inherit',
            'prose-a:text-inherit prose-a:underline prose-strong:text-inherit',
            '[&_img]:inline-block [&_img]:max-h-20 [&_img]:max-w-full [&_img]:align-middle sm:[&_img]:max-h-24'
          )}
        />
      </div>
    </aside>
  );
}
