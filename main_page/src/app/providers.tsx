'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserDataProvider } from '@/contexts/UserDataContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Simple Providers without monorepo dependencies
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <UserDataProvider>
          {children}
        </UserDataProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}