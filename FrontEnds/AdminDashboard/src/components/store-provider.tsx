'use client';

import React from 'react';
import { StoreContext, useCreateStore } from '@/lib/store';

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const store = useCreateStore();

  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
};
