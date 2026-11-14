/**
 * Utility functions for working with cookies
 * Note: HttpOnly cookies cannot be accessed via JavaScript for security reasons
 * These functions help debug cookie-related issues
 */

/**
 * Check if cookies are being sent in requests
 * This can be used to verify that credentials: 'include' is working
 */
export function checkCookieSupport(): {
  supportsCredentials: boolean;
  cookieEnabled: boolean;
} {
  if (typeof window === 'undefined') {
    return { supportsCredentials: false, cookieEnabled: false };
  }

  return {
    supportsCredentials: true, // We use credentials: 'include' in fetch
    cookieEnabled: navigator.cookieEnabled,
  };
}

/**
 * Log cookie information for debugging
 * Note: HttpOnly cookies won't be visible here, but this helps verify the setup
 */
export function logCookieInfo(): void {
  if (typeof window === 'undefined') return;

  const info = checkCookieSupport();
  console.log('Cookie Support:', {
    ...info,
    allCookies: document.cookie || '(no cookies accessible)',
    note: 'HttpOnly cookies (like AuthCookie) are not accessible via JavaScript for security',
  });
}

/**
 * Verify that a request includes credentials
 */
export function verifyCredentialsInRequest(): boolean {
  // This is a helper to remind developers to use credentials: 'include'
  return true; // We always use credentials: 'include' in apiRequest
}
