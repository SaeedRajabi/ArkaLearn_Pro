/**
 * Google Identity Services (GIS) helpers for ID-token sign-in.
 * Docs: https://developers.google.com/identity/gsi/web
 */

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GIS_SCRIPT_ID = 'google-identity-services';

type GoogleCredentialResponse = {
  credential: string;
  select_by?: string;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: string;
    ux_mode?: 'popup' | 'redirect';
  }) => void;
  prompt: (momentListener?: (notification: {
    isNotDisplayed: () => boolean;
    isSkippedMoment: () => boolean;
    isDismissedMoment: () => boolean;
    getNotDisplayedReason: () => string;
    getSkippedReason: () => string;
    getDismissedReason: () => string;
  }) => void) => void;
  renderButton: (
    parent: HTMLElement,
    options: Record<string, string | number | boolean>
  ) => void;
  cancel: () => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Identity is only available in the browser.'));
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(GIS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity.')), {
        once: true,
      });
      if (window.google?.accounts?.id) resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = GIS_SCRIPT_ID;
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error('Failed to load Google Identity.'));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Opens Google sign-in and resolves with the ID token (JWT).
 * Tries One Tap / FedCM prompt first; falls back to a temporary GIS button click.
 */
export async function requestGoogleIdToken(clientId: string): Promise<string> {
  if (!clientId.trim()) {
    throw new Error('Google Client ID is not configured.');
  }

  await loadGoogleIdentityScript();
  const googleId = window.google?.accounts?.id;
  if (!googleId) {
    throw new Error('Google Identity Services failed to initialize.');
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const finish = (credential: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(credential);
    };
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    let host: HTMLDivElement | null = null;
    const cleanup = () => {
      try {
        googleId.cancel();
      } catch {
        /* ignore */
      }
      if (host?.parentNode) host.parentNode.removeChild(host);
      host = null;
    };

    googleId.initialize({
      client_id: clientId,
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: 'popup',
      callback: (response) => {
        if (response?.credential) {
          finish(response.credential);
          return;
        }
        fail(new Error('Google did not return an ID token.'));
      },
    });

    googleId.prompt((notification) => {
      if (settled) return;
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback: render official button off-screen and click it.
        host = document.createElement('div');
        host.setAttribute('aria-hidden', 'true');
        host.style.cssText =
          'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
        document.body.appendChild(host);
        googleId.renderButton(host, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 280,
        });
        const btn = host.querySelector('div[role="button"]') as HTMLElement | null;
        if (btn) {
          btn.click();
          return;
        }
        fail(
          new Error(
            notification.isNotDisplayed()
              ? `Google sign-in unavailable (${notification.getNotDisplayedReason() || 'unknown'}).`
              : 'Google sign-in was skipped. Please try again.'
          )
        );
      }
    });

    window.setTimeout(() => {
      if (!settled) {
        fail(new Error('Google sign-in timed out. Please try again.'));
      }
    }, 120_000);
  });
}
