'use client';

import { SemaApp } from '@/components/sema/sema-app';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function SemaPage() {
  return (
    <ProtectedRoute>
      <div>
        <div className="container mx-auto px-4 py-8">
          <SemaApp />
        </div>
      </div>
    </ProtectedRoute>
  );
}