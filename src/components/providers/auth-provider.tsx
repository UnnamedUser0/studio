'use client';

import React, { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: FirebaseClientProviderProps) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}