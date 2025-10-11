'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { DataPersistenceProvider } from '@/contexts/DataPersistenceContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <DataPersistenceProvider>
        {children}
      </DataPersistenceProvider>
    </QueryClientProvider>
  );
}