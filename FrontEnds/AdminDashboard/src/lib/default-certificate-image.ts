import { resolveStaticAssetUrl } from '@/lib/api-config';

export const DEFAULT_CERTIFICATE_IMAGE_PATH = '/icons/certificate-default-image.png';

export function resolveDegreeImageUrl(degreeImage?: string | null): string {
  const trimmed = degreeImage?.trim();
  if (!trimmed) return DEFAULT_CERTIFICATE_IMAGE_PATH;
  if (trimmed.startsWith('/icons/')) return trimmed;
  const resolved = resolveStaticAssetUrl(trimmed);
  return resolved.trim() || DEFAULT_CERTIFICATE_IMAGE_PATH;
}
