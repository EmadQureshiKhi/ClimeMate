'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { DataPersistenceProvider } from '@/contexts/DataPersistenceContext';
import { PrivyAuthProvider } from '@/components/providers/privy-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <PrivyAuthProvider>
      <QueryClientProvider client={queryClient}>
        <DataPersistenceProvider>
          {children}
        </DataPersistenceProvider>
      </QueryClientProvider>
    </PrivyAuthProvider>
  );
}