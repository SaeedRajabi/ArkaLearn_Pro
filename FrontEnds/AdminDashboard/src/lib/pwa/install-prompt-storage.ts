export const PWA_INSTALL_NEVER_SHOW_KEY = 'arka-admin-pwa-install-never-show';

export function isPwaInstallPermanentlyDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PWA_INSTALL_NEVER_SHOW_KEY) === '1';
  } catch {
    return false;
  }
}

export function setPwaInstallPermanentlyDismissed(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PWA_INSTALL_NEVER_SHOW_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function isPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
  return false;
}
