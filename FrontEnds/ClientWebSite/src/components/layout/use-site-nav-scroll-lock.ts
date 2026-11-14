'use client';

import { useEffect } from 'react';

const SITE_NAV_OPEN_CLASS = 'site-nav-open';
const SITE_HEADER_SELECTOR = '.site-header';

type HeaderPinSnapshot = {
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  zIndex: string;
  backgroundColor: string;
  backdropFilter: string;
  webkitBackdropFilter: string;
};

function readHeaderSnapshot(header: HTMLElement): HeaderPinSnapshot {
  return {
    position: header.style.position,
    top: header.style.top,
    left: header.style.left,
    right: header.style.right,
    width: header.style.width,
    zIndex: header.style.zIndex,
    backgroundColor: header.style.backgroundColor,
    backdropFilter: header.style.backdropFilter,
    webkitBackdropFilter: header.style.getPropertyValue('-webkit-backdrop-filter'),
  };
}

function restoreHeaderSnapshot(header: HTMLElement, snapshot: HeaderPinSnapshot) {
  header.style.position = snapshot.position;
  header.style.top = snapshot.top;
  header.style.left = snapshot.left;
  header.style.right = snapshot.right;
  header.style.width = snapshot.width;
  header.style.zIndex = snapshot.zIndex;
  header.style.backgroundColor = snapshot.backgroundColor;
  header.style.backdropFilter = snapshot.backdropFilter;
  if (snapshot.webkitBackdropFilter) {
    header.style.setProperty('-webkit-backdrop-filter', snapshot.webkitBackdropFilter);
  } else {
    header.style.removeProperty('-webkit-backdrop-filter');
  }
}

function pinSiteHeader(header: HTMLElement) {
  header.style.position = 'fixed';
  header.style.left = '0';
  header.style.right = '0';
  header.style.width = '100%';
  header.style.zIndex = '200';
  header.style.backgroundColor = 'hsl(var(--background))';
  header.style.backdropFilter = 'none';
  header.style.setProperty('-webkit-backdrop-filter', 'none');

  header.style.top = '0';
  const misalignedTop = header.getBoundingClientRect().top;
  if (Math.abs(misalignedTop) > 0.5) {
    header.style.top = `${-misalignedTop}px`;
  }

  document.documentElement.style.setProperty('--site-header-height', `${header.offsetHeight}px`);
}

/**
 * Locks page scroll while mobile/tablet site nav is open.
 * The header is pinned to the viewport (fixed + solid) so it stays visible and flush
 * with the menu panel even when the user opened the menu after scrolling.
 */
export function useSiteNavScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const scrollY = window.scrollY;
    const { style: bodyStyle } = document.body;
    const bodySnapshot = {
      position: bodyStyle.position,
      top: bodyStyle.top,
      width: bodyStyle.width,
      overflow: bodyStyle.overflow,
    };

    const header = document.querySelector(SITE_HEADER_SELECTOR);
    const headerSnapshot = header instanceof HTMLElement ? readHeaderSnapshot(header) : null;

    document.documentElement.classList.add(SITE_NAV_OPEN_CLASS);

    bodyStyle.position = 'fixed';
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.width = '100%';
    bodyStyle.overflow = 'hidden';

    const syncHeader = () => {
      const el = document.querySelector(SITE_HEADER_SELECTOR);
      if (el instanceof HTMLElement) pinSiteHeader(el);
    };

    syncHeader();
    requestAnimationFrame(() => {
      syncHeader();
      requestAnimationFrame(syncHeader);
    });

    const onResize = () => syncHeader();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      document.documentElement.classList.remove(SITE_NAV_OPEN_CLASS);
      document.documentElement.style.removeProperty('--site-header-height');

      bodyStyle.position = bodySnapshot.position;
      bodyStyle.top = bodySnapshot.top;
      bodyStyle.width = bodySnapshot.width;
      bodyStyle.overflow = bodySnapshot.overflow;

      if (header instanceof HTMLElement && headerSnapshot) {
        restoreHeaderSnapshot(header, headerSnapshot);
      }

      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
