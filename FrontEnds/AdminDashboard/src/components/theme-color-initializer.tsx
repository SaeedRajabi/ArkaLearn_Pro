
'use client';

import * as React from 'react';
import { useThemeColor } from '@/hooks/use-theme-color';

// This component is a bit of a hack, but it's a clean way to initialize
// the theme colors on the client side without needing to pass props down.
// It simply calls the hooks which contain the useEffect logic to apply
// the colors from localStorage.
export function ThemeColorInitializer() {
  useThemeColor('--primary', '231 48% 48%');
  useThemeColor('--accent', '174 100% 29%');

  return null;
}
