'use client';

import { useUserSync } from '@/hooks/useUserSync';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  // Sync user to database when authenticated
  useUserSync();

  return <>{children}</>;
}
