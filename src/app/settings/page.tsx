'use client';

import { AccountSettings } from '@/components/settings/account-settings';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <AccountSettings />
      </div>
    </ProtectedRoute>
  );
}
