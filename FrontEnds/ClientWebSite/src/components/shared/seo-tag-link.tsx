import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { getTagUrl } from '@/lib/seo/tag-utils';
import { cn } from '@/lib/utils';

interface SeoTagLinkProps {
  tag: string;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline';
}

/** Clickable tag badge that links to the indexable /tags/[slug] landing page. */
export function SeoTagLink({ tag, className, variant = 'secondary' }: SeoTagLinkProps) {
  const href = getTagUrl(tag);
  return (
    <Link href={href} className="inline-flex" title={`${tag} — topics & content`}>
      <Badge variant={variant} className={cn('cursor-pointer transition-colors hover:bg-primary/15 hover:text-primary', className)}>
        {tag}
      </Badge>
    </Link>
  );
}
