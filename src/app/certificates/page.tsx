'use client';

import { CertificateList } from '@/components/certificates/certificate-list';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function CertificatesPage() {
  return (
    <ProtectedRoute>
      <div>
        <div className="container mx-auto px-4 py-8">
          <CertificateList />
        </div>
      </div>
    </ProtectedRoute>
  );
}