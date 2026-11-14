/** Edge-safe site URL helpers (no Node.js fs/path APIs). */

const PROD_SITE_URL = 'https://arkasoftware.ir';

function normalizeSiteUrl(raw?: string): string {
  const candidate =
    raw || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : PROD_SITE_URL);

  try {
    const u = new URL(candidate);
    let hostname = u.hostname.toLowerCase();
    let protocol = u.protocol;

    if (hostname === 'www.arkasoftware.ir') {
      hostname = 'arkasoftware.ir';
    }
    if (hostname === 'arkasoftware.ir') {
      protocol = 'https:';
      hostname = 'arkasoftware.ir';
    }

    const normalized = `${protocol}//${hostname}`;
    return normalized.replace(/\/+$/, '');
  } catch {
    return PROD_SITE_URL;
  }
}

export const siteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
