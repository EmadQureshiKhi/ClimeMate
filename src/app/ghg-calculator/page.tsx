'use client';

import GHGCalculator from '@/components/ghg/GHGCalculator';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function GHGCalculatorPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <GHGCalculator />
      </div>
    </ProtectedRoute>
  );
}