/**
 * Soft auth transitions: suppress global route overlay and coordinate
 * parallel login/logout work without hard document reloads.
 */

let suppressNavigationUntil = 0;

/** Skip MainContentLoader / NProgress for the next soft navigation window. */
export function suppressNavigationLoading(ms = 4000): void {
  suppressNavigationUntil = Math.max(suppressNavigationUntil, Date.now() + ms);
}

export function shouldSuppressNavigationLoading(): boolean {
  return Date.now() < suppressNavigationUntil;
}

export function clearNavigationLoadingSuppress(): void {
  suppressNavigationUntil = 0;
}
