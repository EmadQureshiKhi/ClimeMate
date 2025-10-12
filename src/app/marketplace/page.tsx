'use client';

import { Marketplace } from '@/components/marketplace/marketplace';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function MarketplacePage() {
  return (
    <ProtectedRoute>
      <div>
        <div className="container mx-auto px-4 py-8">
          <Marketplace />
        </div>
      </div>
    </ProtectedRoute>
  );
}