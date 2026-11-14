
'use client';

import * as React from 'react';

// This hook manages a single theme color, persisting it to localStorage.
export function useThemeColor(
  cssVariable: string,
  defaultValue: string
): [string, (value: string) => void, string] {
  const storageKey = `theme-color:${cssVariable}`;
  
  // Get initial value from localStorage or use default
  const getInitialValue = () => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    return localStorage.getItem(storageKey) || defaultValue;
  };

  const [color, setColor] = React.useState<string>(getInitialValue);

  // Update localStorage and apply CSS variable when color changes
  const setAndPersistColor = (newColor: string) => {
    setColor(newColor);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newColor);
      document.documentElement.style.setProperty(cssVariable, newColor);
    }
  };

  // Effect to apply the color on initial client-side mount
  React.useEffect(() => {
    const storedColor = localStorage.getItem(storageKey);
    if (storedColor) {
      document.documentElement.style.setProperty(cssVariable, storedColor);
    }
  }, [storageKey, cssVariable]);

  return [color, setAndPersistColor, defaultValue];
}
