'use client';

import { UploadWizard } from '@/components/upload/upload-wizard';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <div>
        <div className="container mx-auto px-4 py-8">
          <UploadWizard />
        </div>
      </div>
    </ProtectedRoute>
  );
}